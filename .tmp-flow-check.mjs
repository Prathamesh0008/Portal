const base = 'http://localhost:3000';

async function api(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  const setCookie = res.headers.get('set-cookie') || '';
  return { status: res.status, json, setCookie, location: res.headers.get('location') };
}

function cookieFromSetCookie(setCookie) {
  const first = setCookie.split(';')[0];
  return first || '';
}

async function login(email, password) {
  const result = await api('/api/auth/login', { method: 'POST', body: { email, password } });
  if (result.status !== 200 || !result.json?.success) {
    throw new Error(`Login failed for ${email}: ${result.status} ${JSON.stringify(result.json)}`);
  }
  return {
    cookie: cookieFromSetCookie(result.setCookie),
    token: result.json.data.token,
    user: result.json.data.user,
  };
}

async function run() {
  const customer = await login('customer@example.com', 'password123');
  const admin = await login('admin@example.com', 'password123');
  const dpd = await login('dpd@example.com', 'password123');
  const fedex = await login('fedex@example.com', 'password123');

  const createRes = await api('/api/orders', {
    method: 'POST',
    cookie: customer.cookie,
    body: {
      routeType: 'EU_TO_EU',
      receiverFirstName: 'Flow',
      receiverLastName: 'Check',
      receiverCountry: 'DE',
      receiverPostalCode: '10115',
      receiverCity: 'Berlin',
      receiverAddress: 'Test Street',
      receiverHouseNumber: '1',
      receiverEmail: 'flow@example.com',
      receiverPhone: '+4911111111',
      productName: 'Workflow Box',
      quantity: 1,
      weight: 2,
      length: 10,
      width: 10,
      height: 10,
      parcelCount: 1,
      saveRecipient: true,
    },
  });

  if (createRes.status !== 201 || !createRes.json?.success) {
    throw new Error(`Create order failed: ${createRes.status} ${JSON.stringify(createRes.json)}`);
  }

  const createdId = createRes.json.data._id;

  const customerList = await api('/api/orders', { cookie: customer.cookie });
  const adminList = await api('/api/admin/orders', { cookie: admin.cookie });
  const dpdList = await api('/api/shipping/orders', { cookie: dpd.cookie });

  const adminPatch = await api(`/api/admin/orders/${createdId}`, {
    method: 'PATCH',
    cookie: admin.cookie,
    body: {
      status: 'APPROVED',
      adminNotes: 'Approved in process check',
      courier: 'DPD',
    },
  });

  const dpdPatch = await api(`/api/shipping/orders/${createdId}`, {
    method: 'PATCH',
    cookie: dpd.cookie,
    body: {
      status: 'SHIPPED',
      trackingId: 'DPD-FLOW-001',
      productSent: 'YES',
    },
  });

  const fedexAccess = await api(`/api/shipping/orders/${createdId}`, { cookie: fedex.cookie });

  console.log(JSON.stringify({
    createStatus: createRes.status,
    createdId,
    createdOrderStatus: createRes.json.data.orders?.[0]?.status,
    customerListStatus: customerList.status,
    customerOrdersCount: customerList.json?.data?.length,
    adminListStatus: adminList.status,
    adminTotal: adminList.json?.data?.pagination?.total,
    dpdListStatus: dpdList.status,
    dpdTotal: dpdList.json?.data?.pagination?.total,
    adminPatchStatus: adminPatch.status,
    adminPatchOrderStatus: adminPatch.json?.data?.status,
    dpdPatchStatus: dpdPatch.status,
    dpdPatchOrderStatus: dpdPatch.json?.data?.status,
    dpdTrackingId: dpdPatch.json?.data?.trackingId,
    fedexAccessStatus: fedexAccess.status,
    fedexAccessMessage: fedexAccess.json?.message,
  }, null, 2));
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
