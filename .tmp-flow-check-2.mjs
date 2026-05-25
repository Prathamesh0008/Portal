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

const cookieFromSetCookie = (setCookie) => (setCookie.split(';')[0] || '');

async function login(email, password) {
  const result = await api('/api/auth/login', { method: 'POST', body: { email, password } });
  if (result.status !== 200 || !result.json?.success) throw new Error(`Login failed: ${email}`);
  return { cookie: cookieFromSetCookie(result.setCookie), user: result.json.data.user };
}

async function run() {
  const customer = await login('customer@example.com', 'password123');
  const admin = await login('admin@example.com', 'password123');
  const dpd = await login('dpd@example.com', 'password123');

  const createRes = await api('/api/orders', {
    method: 'POST', cookie: customer.cookie,
    body: {
      routeType: 'EU_TO_EU', receiverFirstName: 'Flow2', receiverLastName: 'Check2', receiverCountry: 'DE', receiverPostalCode: '10115', receiverCity: 'Berlin', receiverAddress: 'Street', receiverHouseNumber: '2', receiverEmail: 'flow2@example.com', receiverPhone: '+4911111112', productName: 'Box2', quantity: 1, weight: 2, length: 10, width: 10, height: 10, parcelCount: 1,
    }
  });
  const id = createRes.json.data._id;

  const customerPatch = await api(`/api/orders/${id}`, {
    method: 'PATCH',
    cookie: customer.cookie,
    body: { status: 'DELIVERED', trackingId: 'HACK-123', adminNotes: 'hack' },
  });

  const adminPatch = await api(`/api/admin/orders/${id}`, {
    method: 'PATCH',
    cookie: admin.cookie,
    body: { status: 'APPROVED', adminNotes: 'ok' },
  });

  const dpdPatch = await api(`/api/shipping/orders/${id}`, {
    method: 'PATCH',
    cookie: dpd.cookie,
    body: { status: 'SHIPPED', trackingId: 'DPD-REAL-123' },
  });

  const final = await api(`/api/orders/${id}`, { cookie: customer.cookie });

  console.log(JSON.stringify({
    createStatus: createRes.status,
    customerPatchStatus: customerPatch.status,
    customerPatchData: customerPatch.json.data,
    adminPatchStatus: adminPatch.status,
    dpdPatchStatus: dpdPatch.status,
    finalStatus: final.json?.data?.status,
    finalTrackingId: final.json?.data?.trackingId,
    finalAdminNotes: final.json?.data?.adminNotes,
  }, null, 2));
}

run().catch((e) => { console.error(e); process.exit(1); });
