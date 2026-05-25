import { randomUUID } from 'crypto';

export type UserRole = 'CUSTOMER' | 'ADMIN' | 'SHIPPING_DPD' | 'SHIPPING_FEDEX';
export type Courier = 'DPD' | 'FEDEX';

export interface LocalUser {
  _id: string;
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  company?: string;
  phone?: string;
  country?: string;
  city?: string;
  postalCode?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocalOrder {
  _id: string;
  orderNumber: string;
  customerId: string | LocalUser;
  routeType: 'EU_TO_EU' | 'EU_TO_US';
  courier: Courier;
  status: string;
  trackingId?: string;
  labelUrl?: string;
  estimatedDeliveryDate?: string;
  adminNotes?: string;
  shippingNotes?: string;
  assignedTo?: string;
  productName?: string;
  quantity?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  parcelCount?: number;
  notes?: string;
  [key: string]: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface LocalRecipient {
  _id: string;
  id: string;
  customerId: string;
  firstName: string;
  lastName: string;
  company?: string;
  country: string;
  city: string;
  postalCode: string;
  address: string;
  houseNumber?: string;
  addition?: string;
  extraInfo?: string;
  email: string;
  countryCode?: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export const useLocalData = process.env.USE_LOCAL_DATA !== 'false';

const now = new Date().toISOString();

const users: LocalUser[] = [
  {
    _id: 'local-admin',
    id: 'local-admin',
    email: 'admin@example.com',
    password: 'password123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    company: 'KVA Logistics',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: 'local-customer',
    id: 'local-customer',
    email: 'customer@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    role: 'CUSTOMER',
    company: 'Sample Company',
    phone: '+1234567890',
    country: 'NL',
    city: 'Amsterdam',
    postalCode: '1012AB',
    address: 'Main Street 123',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: 'local-dpd',
    id: 'local-dpd',
    email: 'dpd@example.com',
    password: 'password123',
    firstName: 'DPD',
    lastName: 'Courier',
    role: 'SHIPPING_DPD',
    company: 'DPD Logistics',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: 'local-fedex',
    id: 'local-fedex',
    email: 'fedex@example.com',
    password: 'password123',
    firstName: 'FedEx',
    lastName: 'Courier',
    role: 'SHIPPING_FEDEX',
    company: 'FedEx International',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
];

const orders: LocalOrder[] = [
  {
    _id: 'local-order-1',
    orderNumber: 'ORD-LOCAL-1001',
    customerId: 'local-customer',
    routeType: 'EU_TO_EU',
    courier: 'DPD',
    status: 'PENDING',
    receiverFirstName: 'Anna',
    receiverLastName: 'Jansen',
    receiverCompany: 'Demo Store',
    receiverCountry: 'DE',
    receiverCity: 'Berlin',
    receiverPostalCode: '10115',
    receiverAddress: 'Invalidenstrasse',
    receiverHouseNumber: '12',
    receiverEmail: 'anna@example.com',
    receiverPhone: '+49123456789',
    productName: 'Sample EU parcel',
    quantity: 1,
    weight: 2,
    parcelCount: 1,
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: 'local-order-2',
    orderNumber: 'ORD-LOCAL-1002',
    customerId: 'local-customer',
    routeType: 'EU_TO_US',
    courier: 'FEDEX',
    status: 'SHIPPED',
    trackingId: 'FX-LOCAL-1002',
    receiverFirstName: 'Michael',
    receiverLastName: 'Smith',
    receiverCountry: 'US',
    receiverCity: 'New York',
    receiverPostalCode: '10001',
    receiverAddress: 'West 31st Street',
    receiverHouseNumber: '25',
    receiverEmail: 'michael@example.com',
    receiverPhone: '+12125550100',
    productName: 'Sample US parcel',
    quantity: 2,
    weight: 4,
    parcelCount: 2,
    createdAt: now,
    updatedAt: now,
  },
];

const recipients: LocalRecipient[] = [
  {
    _id: 'local-recipient-1',
    id: 'local-recipient-1',
    customerId: 'local-customer',
    firstName: 'Anna',
    lastName: 'Jansen',
    company: 'Demo Store',
    country: 'DE',
    city: 'Berlin',
    postalCode: '10115',
    address: 'Invalidenstrasse',
    houseNumber: '12',
    email: 'anna@example.com',
    phone: '+49123456789',
    createdAt: now,
    updatedAt: now,
  },
];

function nextFiveDigitOrderNumber() {
  const maxOrderNumber = orders.reduce((max, order) => {
    const value = Number(order.orderNumber);
    return Number.isInteger(value) ? Math.max(max, value) : max;
  }, 10000);

  return String(maxOrderNumber + 1);
}

export function sanitizeUser(user: LocalUser) {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export function findLocalUserByEmail(email: string) {
  return users.find((user) => user.email === email.toLowerCase()) ?? null;
}

export function findLocalUserById(id: string) {
  return users.find((user) => user._id === id || user.id === id) ?? null;
}

export function createLocalUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const timestamp = new Date().toISOString();
  const user: LocalUser = {
    _id: randomUUID(),
    id: randomUUID(),
    email: input.email.toLowerCase(),
    password: input.password,
    firstName: input.firstName,
    lastName: input.lastName,
    role: 'CUSTOMER',
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  user.id = user._id;
  users.unshift(user);
  return user;
}

export function listLocalCustomers() {
  return users.filter((user) => user.role === 'CUSTOMER').map(sanitizeUser);
}

export function listLocalRecipients(customerId: string) {
  return recipients.filter((recipient) => recipient.customerId === customerId);
}

export function createLocalRecipient(customerId: string, input: {
  firstName: string;
  lastName: string;
  company?: string;
  country: string;
  city: string;
  postalCode: string;
  address: string;
  houseNumber?: string;
  addition?: string;
  extraInfo?: string;
  email: string;
  countryCode?: string;
  phone: string;
}) {
  const existing = recipients.find(
    (recipient) =>
      recipient.customerId === customerId &&
      recipient.email.toLowerCase() === input.email.toLowerCase() &&
      recipient.address.toLowerCase() === input.address.toLowerCase()
  );

  if (existing) {
    return existing;
  }

  const timestamp = new Date().toISOString();
  const recipient: LocalRecipient = {
    _id: randomUUID(),
    id: '',
    customerId,
    ...input,
    email: input.email.toLowerCase(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  recipient.id = recipient._id;
  recipients.unshift(recipient);
  return recipient;
}

export function updateLocalRecipient(customerId: string, id: string, updates: Partial<LocalRecipient>) {
  const recipient = recipients.find(
    (item) => item.customerId === customerId && (item._id === id || item.id === id)
  );

  if (!recipient) {
    return null;
  }

  Object.assign(recipient, updates, { updatedAt: new Date().toISOString() });
  if (updates.email) {
    recipient.email = updates.email.toLowerCase();
  }

  return recipient;
}

export function deleteLocalRecipient(customerId: string, id: string) {
  const index = recipients.findIndex(
    (item) => item.customerId === customerId && (item._id === id || item.id === id)
  );

  if (index === -1) {
    return false;
  }

  recipients.splice(index, 1);
  return true;
}

function withCustomer(order: LocalOrder) {
  if (typeof order.customerId !== 'string') {
    return order;
  }

  const customer = users.find((user) => user._id === order.customerId);
  return {
    ...order,
    customerId: customer ? sanitizeUser(customer) : order.customerId,
  };
}

export function listLocalOrders(filter: Partial<Pick<LocalOrder, 'customerId' | 'routeType' | 'courier' | 'status'>> = {}) {
  return orders.filter((order) => {
    if (filter.customerId && order.customerId !== filter.customerId) return false;
    if (filter.routeType && order.routeType !== filter.routeType) return false;
    if (filter.courier && order.courier !== filter.courier) return false;
    if (filter.status && order.status !== filter.status) return false;
    return true;
  });
}

export function listLocalOrdersWithCustomers(filter: Partial<Pick<LocalOrder, 'customerId' | 'routeType' | 'courier' | 'status'>> = {}) {
  return listLocalOrders(filter).map(withCustomer);
}

export function findLocalOrder(id: string) {
  return orders.find((order) => order._id === id) ?? null;
}

export function findLocalOrderWithCustomer(id: string) {
  const order = findLocalOrder(id);
  return order ? withCustomer(order) : null;
}

export function createLocalOrder(customerId: string, input: Record<string, unknown>) {
  const routeType = input.routeType === 'EU_TO_US' ? 'EU_TO_US' : 'EU_TO_EU';
  const timestamp = new Date().toISOString();
  const order: LocalOrder = {
    ...input,
    _id: randomUUID(),
    orderNumber: nextFiveDigitOrderNumber(),
    customerId,
    routeType,
    courier: routeType === 'EU_TO_EU' ? 'DPD' : 'FEDEX',
    status: 'PENDING',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  orders.unshift(order);
  return order;
}

export function updateLocalOrder(id: string, updates: Partial<LocalOrder>) {
  const order = findLocalOrder(id);
  if (!order) {
    return null;
  }

  Object.assign(order, updates, { updatedAt: new Date().toISOString() });
  return order;
}

export function getLocalAdminStats() {
  return {
    totalOrders: orders.length,
    pendingOrders: orders.filter((order) => order.status === 'PENDING').length,
    dpdOrders: orders.filter((order) => order.courier === 'DPD').length,
    fedexOrders: orders.filter((order) => order.courier === 'FEDEX').length,
    deliveredOrders: orders.filter((order) => order.status === 'DELIVERED').length,
    totalCustomers: users.filter((user) => user.role === 'CUSTOMER').length,
    totalShippingPartners: users.filter((user) => ['SHIPPING_DPD', 'SHIPPING_FEDEX'].includes(user.role)).length,
  };
}
