import { createSign } from 'crypto';

type SheetRow = Record<string, string> & { __sheetRowNumber?: string };

export interface SheetOrder {
  _id: string;
  id: string;
  orderNumber: string;
  customerId: string | { _id: string; firstName: string; lastName: string; email: string; phone?: string };
  routeType: 'EU_TO_EU' | 'EU_TO_US';
  courier: 'DPD' | 'FEDEX';
  status: string;
  trackingId?: string;
  labelUrl?: string;
  productName?: string;
  quantity?: number;
  receiverFirstName?: string;
  receiverLastName?: string;
  receiverCompany?: string;
  receiverCountry?: string;
  receiverCity?: string;
  receiverState?: string;
  receiverPostalCode?: string;
  receiverAddress?: string;
  receiverHouseNumber?: string;
  receiverEmail?: string;
  receiverPhone?: string;
  productSent?: string;
  createdAt: string;
  updatedAt: string;
  source: 'google-sheet';
}

interface SheetValues {
  values: string[][];
  headers: string[];
  rows: SheetRow[];
  sheetName: string;
}

const HEADER_ALIASES: Record<string, string[]> = {
  orderNumber: ['orderNumber', 'order number', 'order #', 'order no', 'order id', 'id'],
  customerName: ['customerName', 'customer name', 'name'],
  customerEmail: ['customerEmail', 'customer email', 'email customer'],
  customerFirstName: ['customerFirstName', 'customer first name', 'first name customer'],
  customerLastName: ['customerLastName', 'customer last name', 'last name customer'],
  customerPhone: ['customerPhone', 'customer phone'],
  routeType: ['routeType', 'route type', 'route'],
  courier: ['courier', 'provider', 'shipping partner'],
  status: ['status', 'order status'],
  trackingId: ['trackingId', 'tracking id', 'tracking number', 'tracking'],
  labelUrl: ['labelUrl', 'label url', 'label', 'shipping label'],
  productName: ['productName', 'product name', 'product'],
  productSent: ['productSent', 'product sent'],
  quantity: ['quantity', 'qty'],
  receiverFirstName: ['receiverFirstName', 'receiver first name', 'recipient first name', 'first name'],
  receiverLastName: ['receiverLastName', 'receiver last name', 'recipient last name', 'last name'],
  receiverCompany: ['receiverCompany', 'receiver company', 'recipient company', 'company'],
  receiverCountry: ['receiverCountry', 'receiver country', 'recipient country', 'country'],
  receiverCity: ['receiverCity', 'receiver city', 'recipient city', 'city'],
  receiverState: ['receiverState', 'receiver state', 'recipient state', 'state'],
  receiverPostalCode: ['receiverPostalCode', 'receiver postal code', 'postal code', 'zip'],
  receiverAddress: ['receiverAddress', 'receiver address', 'address', 'street'],
  receiverHouseNumber: ['receiverHouseNumber', 'receiver house number', 'house number'],
  receiverEmail: ['receiverEmail', 'receiver email', 'recipient email'],
  receiverPhone: ['receiverPhone', 'receiver phone', 'recipient phone', 'phone'],
  createdAt: ['createdAt', 'created at', 'date', 'created'],
  updatedAt: ['updatedAt', 'updated at', 'last updated'],
};

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

function getValue(row: SheetRow, key: keyof typeof HEADER_ALIASES) {
  for (const alias of HEADER_ALIASES[key]) {
    const value = row[normalizeHeader(alias)];
    if (value) return value.trim();
  }

  return '';
}

function parseRouteType(value: string, country: string): 'EU_TO_EU' | 'EU_TO_US' {
  const normalized = value.toUpperCase().replace(/\s+/g, '_');
  if (normalized === 'EU_TO_US' || normalized.includes('US')) return 'EU_TO_US';
  if (country.toUpperCase() === 'US' || country.toUpperCase() === 'UNITED_STATES') return 'EU_TO_US';
  return 'EU_TO_EU';
}

function parseCourier(value: string, routeType: 'EU_TO_EU' | 'EU_TO_US'): 'DPD' | 'FEDEX' {
  const normalized = value.toUpperCase();
  if (normalized.includes('FEDEX')) return 'FEDEX';
  if (normalized.includes('DPD')) return 'DPD';
  return routeType === 'EU_TO_US' ? 'FEDEX' : 'DPD';
}

function toNumber(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function toIsoDate(value: string) {
  if (!value) return new Date().toISOString();
  const dottedDate = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dottedDate) {
    const [, day, month, year] = dottedDate;
    return new Date(Number(year), Number(month) - 1, Number(day)).toISOString();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function splitFullName(value: string) {
  const parts = value.trim().split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || parts[0] || '',
  };
}

function parseStatus(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return 'PENDING';
  if (['on it way', 'on its way', 'in transit', 'shipped', 'product sent'].includes(normalized)) {
    return 'IN_TRANSIT';
  }
  if (normalized.includes('delivered')) return 'DELIVERED';
  if (normalized.includes('cancel')) return 'CANCELLED';
  if (normalized.includes('no shipment')) return 'PENDING';
  return value.trim().toUpperCase().replace(/\s+/g, '_');
}

function rowsToObjects(values: string[][]) {
  const [headers = [], ...rows] = values;
  const normalizedHeaders = headers.map(normalizeHeader);

  return rows
    .map((row, rowIndex) =>
      normalizedHeaders.reduce<SheetRow>((acc, header, index) => {
        acc[header] = String(row[index] || '');
        acc.__sheetRowNumber = String(rowIndex + 2);
        return acc;
      }, {})
    )
    .filter((row) =>
      normalizedHeaders.some((header) => String(row[header] || '').trim())
    );
}

function getSheetNameFromRange(range: string) {
  return (range.split('!')[0] || 'Sheet1').replace(/^'|'$/g, '');
}

function columnLetter(index: number) {
  let number = index + 1;
  let letter = '';

  while (number > 0) {
    const remainder = (number - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    number = Math.floor((number - 1) / 26);
  }

  return letter;
}

function quotedSheetName(sheetName: string) {
  return `'${sheetName.replace(/'/g, "''")}'`;
}

function appendRangeForHeaders(sheetName: string, headers: string[]) {
  const lastHeaderIndex = headers.reduce((lastIndex, header, index) => {
    return header ? index : lastIndex;
  }, 0);

  return `${quotedSheetName(sheetName)}!A:${columnLetter(lastHeaderIndex)}`;
}

function getHeaderIndex(headers: string[], key: keyof typeof HEADER_ALIASES) {
  const aliases = HEADER_ALIASES[key].map(normalizeHeader);
  return headers.findIndex((header) => aliases.includes(header));
}

function mapSheetRow(row: SheetRow, index: number): SheetOrder {
  const orderNumber = getValue(row, 'orderNumber') || `SHEET-${index + 1}`;
  const customerName = getValue(row, 'customerName');
  const customerNameParts = splitFullName(customerName);
  const receiverFirstName = getValue(row, 'receiverFirstName') || customerNameParts.firstName;
  const receiverLastName = getValue(row, 'receiverLastName') || customerNameParts.lastName;
  const receiverCountry = getValue(row, 'receiverCountry');
  const routeType = parseRouteType(getValue(row, 'routeType'), receiverCountry);
  const courier = parseCourier(getValue(row, 'courier'), routeType);
  const createdAt = toIsoDate(getValue(row, 'createdAt'));

  return {
    _id: `sheet-${orderNumber}`,
    id: `sheet-${orderNumber}`,
    orderNumber,
    customerId: {
      _id: `sheet-customer-${getValue(row, 'customerEmail') || 'unknown'}`,
      firstName: getValue(row, 'customerFirstName') || customerNameParts.firstName || 'Sheet',
      lastName: getValue(row, 'customerLastName') || customerNameParts.lastName || 'Customer',
      email: getValue(row, 'customerEmail'),
      phone: getValue(row, 'customerPhone'),
    },
    routeType,
    courier,
    status: parseStatus(getValue(row, 'status')),
    trackingId: getValue(row, 'trackingId') || undefined,
    labelUrl: getValue(row, 'labelUrl') || undefined,
    productName: getValue(row, 'productName') || undefined,
    productSent: getValue(row, 'productSent') || undefined,
    quantity: toNumber(getValue(row, 'quantity')),
    receiverFirstName: receiverFirstName || undefined,
    receiverLastName: receiverLastName || undefined,
    receiverCompany: getValue(row, 'receiverCompany') || undefined,
    receiverCountry: receiverCountry || undefined,
    receiverCity: getValue(row, 'receiverCity') || undefined,
    receiverState: getValue(row, 'receiverState') || undefined,
    receiverPostalCode: getValue(row, 'receiverPostalCode') || undefined,
    receiverAddress: getValue(row, 'receiverAddress') || undefined,
    receiverHouseNumber: getValue(row, 'receiverHouseNumber') || undefined,
    receiverEmail: getValue(row, 'receiverEmail') || undefined,
    receiverPhone: getValue(row, 'receiverPhone') || undefined,
    createdAt,
    updatedAt: toIsoDate(getValue(row, 'updatedAt') || createdAt),
    source: 'google-sheet',
  };
}

export function isGoogleSheetsOrdersEnabled() {
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_ORDERS_SPREADSHEET_ID;
  const range = process.env.GOOGLE_SHEETS_ORDERS_RANGE;

  return Boolean(
    apiKey &&
      spreadsheetId &&
      range &&
      apiKey !== 'your_google_sheets_api_key' &&
      spreadsheetId !== 'your_spreadsheet_id'
  );
}

export async function getGoogleSheetOrders() {
  const sheet = await getGoogleSheetValues();
  return sheet.rows.map(mapSheetRow);
}

async function getGoogleSheetValues(): Promise<SheetValues> {
  if (!isGoogleSheetsOrdersEnabled()) {
    return {
      values: [],
      headers: [],
      rows: [],
      sheetName: 'Sheet1',
    };
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_ORDERS_SPREADSHEET_ID;
  const range = process.env.GOOGLE_SHEETS_ORDERS_RANGE;
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range || ''
  )}?key=${apiKey}`;

  const response = await fetch(url, {
    next: { revalidate: 30 },
  });

  if (!response.ok) {
    throw new Error(`Google Sheets returned ${response.status}`);
  }

  const data = (await response.json()) as { values?: string[][] };
  const values = data.values || [];
  const [headers = []] = values;

  return {
    values,
    headers: headers.map(normalizeHeader),
    rows: rowsToObjects(values),
    sheetName: getSheetNameFromRange(range || ''),
  };
}

function isGoogleSheetsWriteEnabled() {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY);
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function cleanEnvValue(value: string | undefined) {
  if (!value) return '';

  let cleaned = value.trim();
  if (cleaned.endsWith(',')) {
    cleaned = cleaned.slice(0, -1).trim();
  }

  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1);
  }

  return cleaned;
}

function getServiceAccountPrivateKey() {
  return cleanEnvValue(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
    .replace(/\\\\n/g, '\n')
    .replace(/\\n/g, '\n');
}

async function getGoogleAccessToken() {
  const email = cleanEnvValue(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
  const privateKey = getServiceAccountPrivateKey();

  if (!email || !privateKey) {
    throw new Error('Google service account credentials are missing');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(
    JSON.stringify({
      iss: email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  );
  const unsignedToken = `${header}.${payload}`;
  const signature = createSign('RSA-SHA256').update(unsignedToken).sign(privateKey);
  const assertion = `${unsignedToken}.${base64Url(signature)}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google OAuth returned ${response.status}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error('Google OAuth did not return an access token');
  }

  return data.access_token;
}

function normalizeSheetOrderId(id: string) {
  return id.startsWith('sheet-') ? id.slice('sheet-'.length) : id;
}

function portalStatusToSheetStatus(status: string) {
  if (status === 'IN_TRANSIT') return 'on it way';
  if (status === 'DELIVERED') return 'delivered';
  if (status === 'PENDING') return 'no shipment found';
  return status;
}

export async function updateGoogleSheetOrder(
  id: string,
  updates: {
    status?: string;
    trackingId?: string;
    labelUrl?: string;
    productSent?: string;
  }
) {
  if (!isGoogleSheetsWriteEnabled()) {
    throw new Error('Google Sheets write-back is not configured');
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_ORDERS_SPREADSHEET_ID;
  const sheet = await getGoogleSheetValues();
  const orderNumberIndex = getHeaderIndex(sheet.headers, 'orderNumber');

  if (!spreadsheetId || orderNumberIndex === -1) {
    throw new Error('Unable to find ORDER ID column in Google Sheet');
  }

  const cleanId = normalizeSheetOrderId(id);
  const rowIndex = sheet.values.findIndex((row, index) => index > 0 && String(row[orderNumberIndex] || '').trim() === cleanId);
  const fallbackRowIndex =
    rowIndex === -1
      ? sheet.rows.find((row, index) => {
          const generatedOrderNumber = getValue(row, 'orderNumber') || `SHEET-${index + 1}`;
          return generatedOrderNumber === cleanId;
        })
      : null;
  const updateRowIndex = fallbackRowIndex?.__sheetRowNumber
    ? Number(fallbackRowIndex.__sheetRowNumber) - 1
    : rowIndex;

  if (updateRowIndex === -1 || Number.isNaN(updateRowIndex)) {
    throw new Error('Google Sheet order row not found');
  }

  const data: Array<{ range: string; values: string[][] }> = [];
  const updateCell = (key: keyof typeof HEADER_ALIASES, value: string | undefined) => {
    if (value === undefined) return;
    const columnIndex = getHeaderIndex(sheet.headers, key);
    if (columnIndex === -1) return;

    data.push({
      range: `${quotedSheetName(sheet.sheetName)}!${columnLetter(columnIndex)}${updateRowIndex + 1}`,
      values: [[value]],
    });
  };

  updateCell('status', updates.status ? portalStatusToSheetStatus(updates.status) : undefined);
  updateCell('trackingId', updates.trackingId);
  updateCell('labelUrl', updates.labelUrl);
  updateCell('productSent', updates.productSent);

  if (data.length === 0) {
    throw new Error('No matching Google Sheet columns found to update');
  }

  const accessToken = await getGoogleAccessToken();
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Sheets update returned ${response.status}`);
  }

  const updatedOrders = await getGoogleSheetOrders();
  const updatedOrder = updatedOrders.find((order) => order._id === id || order.id === id);

  if (!updatedOrder) {
    throw new Error('Updated Google Sheet order could not be reloaded');
  }

  return updatedOrder;
}

function formatSheetDate(value = new Date()) {
  const day = String(value.getDate()).padStart(2, '0');
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const year = value.getFullYear();
  return `${day}.${month}.${year}`;
}

function valueForHeader(header: string, order: Record<string, any>, orderNumber: string, customerName: string) {
  switch (header) {
    case 'date':
      return formatSheetDate();
    case 'order id':
    case 'order number':
    case 'order #':
    case 'id':
      return orderNumber;
    case 'customer name':
    case 'name':
      return customerName;
    case 'address':
    case 'street':
      return order.receiverAddress || '';
    case 'city':
      return order.receiverCity || '';
    case 'state':
      return order.receiverState || '';
    case 'zip':
    case 'postal code':
      return order.receiverPostalCode || '';
    case 'country':
      return order.receiverCountry || '';
    case 'product':
    case 'product name':
      return order.productName || '';
    case 'qty':
    case 'quantity':
      return String(order.quantity || 1);
    case 'tracking':
    case 'tracking id':
    case 'tracking number':
      return order.trackingId || '';
    case 'order status':
    case 'status':
      return portalStatusToSheetStatus(order.status || 'PENDING');
    case 'product sent':
      return order.productSent || '';
    case 'label url':
    case 'label':
    case 'shipping label':
      return order.labelUrl || '';
    default:
      return '';
  }
}

export async function appendGoogleSheetOrders(
  orders: Array<Record<string, any>>,
  options: {
    customerName: string;
  }
) {
  if (!isGoogleSheetsWriteEnabled()) {
    throw new Error('Google Sheets write-back is not configured');
  }

  const spreadsheetId = process.env.GOOGLE_SHEETS_ORDERS_SPREADSHEET_ID;
  const range = process.env.GOOGLE_SHEETS_ORDERS_RANGE;
  const sheet = await getGoogleSheetValues();

  if (!spreadsheetId || !range || sheet.headers.length === 0) {
    throw new Error('Google Sheet headers are not configured');
  }

  const values = orders.map((order, index) => {
    const orderNumber = String(order.orderNumber || 10001 + index);
    return sheet.headers.map((header) => valueForHeader(header, order, orderNumber, options.customerName));
  });
  const appendRange = appendRangeForHeaders(sheet.sheetName, sheet.headers);

  const accessToken = await getGoogleAccessToken();
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(appendRange)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    }
  );

  if (!response.ok) {
    throw new Error(`Google Sheets append returned ${response.status}`);
  }
}

export function filterSheetOrders(
  orders: SheetOrder[],
  filter: {
    customerEmail?: string;
    routeType?: string;
    courier?: string;
    status?: string;
  }
) {
  return orders.filter((order) => {
    const customer = typeof order.customerId === 'string' ? null : order.customerId;
    if (filter.customerEmail && customer?.email.toLowerCase() !== filter.customerEmail.toLowerCase()) return false;
    if (filter.routeType && order.routeType !== filter.routeType) return false;
    if (filter.courier && order.courier !== filter.courier) return false;
    if (filter.status && order.status !== filter.status) return false;
    return true;
  });
}
