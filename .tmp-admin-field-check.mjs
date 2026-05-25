const base = 'http://localhost:3000';

async function api(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json, setCookie: res.headers.get('set-cookie') || '' };
}

const cookieFromSetCookie = (s) => (s.split(';')[0] || '');

async function login(email, password) {
  const r = await api('/api/auth/login', { method: 'POST', body: { email, password } });
  if (r.status !== 200 || !r.json?.success) throw new Error(`Login failed for ${email}`);
  return cookieFromSetCookie(r.setCookie);
}

function checkFields(order, expected) {
  const fields = Object.keys(expected);
  return fields.map((key) => ({
    field: key,
    expected: expected[key],
    actual: order?.[key],
    ok: String(order?.[key] ?? '') === String(expected[key] ?? ''),
  }));
}

async function run() {
  const customerCookie = await login('customer@example.com', 'password123');
  const adminCookie = await login('admin@example.com', 'password123');

  const payload = {
    saveRecipient: true,
    parcels: [
      {
        routeType: 'EU_TO_EU',
        receiverFirstName: 'Field',
        receiverLastName: 'Audit',
        receiverCompany: 'Audit GmbH',
        receiverCountry: 'DE',
        receiverCity: 'Berlin',
        receiverPostalCode: '10115',
        receiverAddress: 'Audit Street',
        receiverHouseNumber: '22B',
        receiverAddition: 'Floor 3',
        receiverExtraInfo: 'Ring bell 12',
        receiverEmail: 'audit.receiver@example.com',
        receiverCountryCode: '+49',
        receiverPhone: '1512345678',
        receiverReference: 'REF-2026-05-25',
        productName: 'Sample Capsules',
        quantity: 7,
        weight: 2,
        length: 11,
        width: 12,
        height: 13,
        parcelCount: 2,
        notes: 'Handle with care',
      }
    ]
  };

  const created = await api('/api/orders', { method: 'POST', cookie: customerCookie, body: payload });
  if (created.status !== 201 || !created.json?.success) {
    throw new Error(`Create failed: ${created.status} ${JSON.stringify(created.json)}`);
  }

  const id = created.json.data._id;

  const adminDetail = await api(`/api/admin/orders/${id}`, { cookie: adminCookie });
  const adminList = await api('/api/admin/orders', { cookie: adminCookie });

  const detailOrder = adminDetail.json?.data;
  const listOrder = adminList.json?.data?.orders?.find((o) => o._id === id);

  const expected = {
    routeType: 'EU_TO_EU',
    receiverFirstName: 'Field',
    receiverLastName: 'Audit',
    receiverCompany: 'Audit GmbH',
    receiverCountry: 'DE',
    receiverCity: 'Berlin',
    receiverPostalCode: '10115',
    receiverAddress: 'Audit Street',
    receiverHouseNumber: '22B',
    receiverAddition: 'Floor 3',
    receiverExtraInfo: 'Ring bell 12',
    receiverEmail: 'audit.receiver@example.com',
    receiverCountryCode: '+49',
    receiverPhone: '1512345678',
    receiverReference: 'REF-2026-05-25',
    productName: 'Sample Capsules',
    quantity: 7,
    weight: 2,
    length: 11,
    width: 12,
    height: 13,
    parcelCount: 2,
    notes: 'Handle with care',
  };

  const detailChecks = checkFields(detailOrder, expected);
  const listVisible = {
    productName: listOrder?.productName,
    quantity: listOrder?.quantity,
    receiverAddress: listOrder?.receiverAddress,
    receiverCity: listOrder?.receiverCity,
    receiverPostalCode: listOrder?.receiverPostalCode,
    receiverCountry: listOrder?.receiverCountry,
    trackingId: listOrder?.trackingId ?? null,
    customerIdPresent: Boolean(listOrder?.customerId),
  };

  console.log(JSON.stringify({
    createdOrderId: id,
    adminDetailStatus: adminDetail.status,
    adminListStatus: adminList.status,
    allDetailFieldsMatch: detailChecks.every((x) => x.ok),
    failedDetailFields: detailChecks.filter((x) => !x.ok),
    listViewSnapshot: listVisible,
  }, null, 2));
}

run().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
