'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/components/useAuth';

type RouteType = 'EU_TO_EU' | 'EU_TO_US';

interface ParcelDraft {
  receiverCountry: string;
  receiverName: string;
  receiverCompany: string;
  receiverCity: string;
  receiverAddress: string;
  receiverPostalCode: string;
  receiverHouseNumber: string;
  receiverAddition: string;
  receiverExtraInfo: string;
  receiverEmail: string;
  receiverCountryCode: string;
  receiverPhone: string;
  receiverReference: string;
  productName: string;
  quantity: number;
}

interface ParcelPayload {
  routeType: RouteType;
  receiverFirstName: string;
  receiverLastName: string;
  receiverCompany: string;
  receiverCountry: string;
  receiverCity: string;
  receiverPostalCode: string;
  receiverAddress: string;
  receiverHouseNumber: string;
  receiverAddition: string;
  receiverExtraInfo: string;
  receiverEmail: string;
  receiverCountryCode: string;
  receiverPhone: string;
  receiverReference: string;
  productName: string;
  quantity: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  parcelCount: number;
}

interface ProductRow {
  id: string;
  productName: string;
  quantity: number;
}

const defaultDraft: ParcelDraft = {
  receiverCountry: '',
  receiverName: '',
  receiverCompany: '',
  receiverCity: '',
  receiverAddress: '',
  receiverPostalCode: '',
  receiverHouseNumber: '',
  receiverAddition: '',
  receiverExtraInfo: '',
  receiverEmail: '',
  receiverCountryCode: '',
  receiverPhone: '',
  receiverReference: '',
  productName: '',
  quantity: 1,
};

const countries = [
  { value: 'AL', label: 'Albania' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgium' },
  { value: 'AT', label: 'Austria' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'US', label: 'United States' },
];

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || parts[0] || '',
  };
}

function toParcelPayload(draft: ParcelDraft, routeType: RouteType): ParcelPayload {
  const { firstName, lastName } = splitName(draft.receiverName);

  return {
    routeType,
    receiverFirstName: firstName,
    receiverLastName: lastName,
    receiverCompany: draft.receiverCompany,
    receiverCountry: draft.receiverCountry,
    receiverCity: draft.receiverCity,
    receiverPostalCode: draft.receiverPostalCode,
    receiverAddress: draft.receiverAddress,
    receiverHouseNumber: draft.receiverHouseNumber,
    receiverAddition: draft.receiverAddition,
    receiverExtraInfo: draft.receiverExtraInfo,
    receiverEmail: draft.receiverEmail,
    receiverCountryCode: draft.receiverCountryCode,
    receiverPhone: draft.receiverPhone,
    receiverReference: draft.receiverReference,
    productName: draft.productName,
    quantity: Number(draft.quantity) || 1,
    weight: 1,
    length: 10,
    width: 10,
    height: 10,
    parcelCount: 1,
  };
}

function toParcelPayloadWithProduct(draft: ParcelDraft, product: ProductRow, routeType: RouteType): ParcelPayload {
  return {
    ...toParcelPayload(draft, routeType),
    productName: product.productName,
    quantity: Number(product.quantity) || 1,
  };
}

function toDraft(parcel: ParcelPayload): ParcelDraft {
  return {
    receiverCountry: parcel.receiverCountry,
    receiverName: `${parcel.receiverFirstName} ${parcel.receiverLastName}`.trim(),
    receiverCompany: parcel.receiverCompany,
    receiverCity: parcel.receiverCity,
    receiverAddress: parcel.receiverAddress,
    receiverPostalCode: parcel.receiverPostalCode,
    receiverHouseNumber: parcel.receiverHouseNumber,
    receiverAddition: parcel.receiverAddition,
    receiverExtraInfo: parcel.receiverExtraInfo,
    receiverEmail: parcel.receiverEmail,
    receiverCountryCode: parcel.receiverCountryCode,
    receiverPhone: parcel.receiverPhone,
    receiverReference: parcel.receiverReference,
    productName: parcel.productName,
    quantity: parcel.quantity,
  };
}

function isDraftReady(draft: ParcelDraft, hasProducts: boolean) {
  return Boolean(
    draft.receiverCountry &&
      draft.receiverName.trim() &&
      draft.receiverCity.trim() &&
      draft.receiverAddress.trim() &&
      draft.receiverPostalCode.trim() &&
      draft.receiverHouseNumber.trim() &&
      draft.receiverEmail.trim() &&
      (hasProducts || draft.productName.trim())
  );
}

function parcelSummary(parcel: ParcelPayload) {
  const country = countries.find((item) => item.value === parcel.receiverCountry)?.label || parcel.receiverCountry;
  return `${parcel.receiverFirstName} ${parcel.receiverLastName} - ${parcel.receiverPostalCode} ${parcel.receiverHouseNumber}, ${country}`;
}

export default function NewOrderPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [selectedRoute, setSelectedRoute] = useState<RouteType | null>(null);
  const [draft, setDraft] = useState<ParcelDraft>(defaultDraft);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [savedParcels, setSavedParcels] = useState<ParcelPayload[]>([]);
  const [saveRecipient, setSaveRecipient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const routeCountries = selectedRoute === 'EU_TO_US'
    ? countries.filter((country) => country.value === 'US')
    : countries.filter((country) => country.value !== 'US');

  const chooseRoute = (route: RouteType | null) => {
    setSelectedRoute(route);
    setDraft((current) => ({ ...current, receiverCountry: '' }));
  };

  const updateDraft = (field: keyof ParcelDraft, value: string | number) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const addProductRow = () => {
    if (!draft.productName.trim()) {
      alert('Please enter a product name.');
      return;
    }

    const quantity = Number(draft.quantity) || 1;
    const product: ProductRow = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      productName: draft.productName.trim(),
      quantity,
    };

    setProducts((current) => [...current, product]);
    setDraft((current) => ({ ...current, productName: '', quantity: 1 }));
  };

  const removeProductRow = (id: string) => {
    setProducts((current) => current.filter((product) => product.id !== id));
  };

  const collectDraftParcels = () => {
    if (!selectedRoute) {
      return { parcels: [], error: 'Please select a route type first.' };
    }

    const currentProducts = [...products];
    if (draft.productName.trim()) {
      currentProducts.push({
        id: 'draft-product',
        productName: draft.productName.trim(),
        quantity: Number(draft.quantity) || 1,
      });
    }

    if (!isDraftReady(draft, currentProducts.length > 0)) {
      return { parcels: [], error: 'Please complete receiver details and add at least one product.' };
    }

    if (currentProducts.length === 0) {
      return { parcels: [], error: 'Please add at least one product.' };
    }

    return {
      parcels: currentProducts.map((product) => toParcelPayloadWithProduct(draft, product, selectedRoute)),
      error: null,
    };
  };

  const saveCurrentParcel = () => {
    const { parcels, error } = collectDraftParcels();
    if (error) {
      alert(error);
      return false;
    }

    setSavedParcels((current) => [...current, ...parcels]);
    setProducts([]);
    setDraft(defaultDraft);
    return true;
  };

  const editSavedParcel = (index: number) => {
    const parcel = savedParcels[index];
    if (!parcel) return;

    setDraft(toDraft(parcel));
    setProducts([]);
    setSavedParcels((current) => current.filter((_, parcelIndex) => parcelIndex !== index));
  };

  const deleteSavedParcel = (index: number) => {
    setSavedParcels((current) => current.filter((_, parcelIndex) => parcelIndex !== index));
  };

  const handleSubmit = async () => {
    if (!token) return;

    const parcels = [...savedParcels];
    const draftCollection = collectDraftParcels();
    if (!draftCollection.error) {
      parcels.push(...draftCollection.parcels);
    }

    if (parcels.length === 0) {
      alert('Please add at least one parcel.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          saveRecipient,
          parcels,
        }),
      });

      const data = await response.json();
      if (data.success) {
        if (data.data?.sheetSynced === false) {
          alert(data.message);
        }
        router.push('/dashboard/orders');
      } else {
        alert('Failed to create order: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen border border-amber-300 bg-white p-4 text-amber-950 md:p-6">
        <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_420px]">
          <main className="space-y-4">
            {!selectedRoute && (
              <section className="border border-amber-300 bg-amber-50 p-6">
                <h2 className="text-2xl font-semibold text-amber-900">Choose Route Type</h2>
                <p className="mt-2 text-sm text-amber-700">Please select shipment route before creating an order.</p>
                <div className="mt-4 max-w-md space-y-3">
                  <select
                    defaultValue=""
                    onChange={(event) => {
                      const value = event.target.value as RouteType | '';
                      if (value) {
                        chooseRoute(value);
                      }
                    }}
                    className="h-11 w-full rounded border border-amber-300 bg-white px-4 text-amber-900 outline-none focus:border-amber-600"
                  >
                    <option value="" disabled>
                      Select route
                    </option>
                    <option value="EU_TO_EU">EU to EU</option>
                    <option value="EU_TO_US">EU to US</option>
                  </select>
                  <p className="text-xs text-amber-700">
                    EU to EU: European destinations | EU to US: United States destinations
                  </p>
                </div>
              </section>
            )}

            {selectedRoute && (
              <>
                <section className="border border-amber-300 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-amber-700">Selected Route</p>
                      <p className="text-lg font-semibold text-amber-900">
                        {selectedRoute === 'EU_TO_EU' ? 'EU to EU' : 'EU to US'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => chooseRoute(null)}
                      className="rounded border border-amber-300 px-3 py-2 text-sm text-amber-900 hover:bg-amber-50"
                    >
                      Change Route
                    </button>
                  </div>
                </section>

            <div className="border border-amber-300 bg-amber-50 px-4 py-3">
              <div className="h-10 border border-amber-200 bg-white px-5 py-2">
                <span className="font-semibold text-amber-950">Who is the receiver?</span>
              </div>
            </div>

            <section className="border border-amber-300 bg-amber-50 p-4">
              <h2 className="border-b border-amber-300 pb-3 text-base font-semibold text-amber-950">
                Address Details
              </h2>

              <div className="mt-4 space-y-4">
                <label className="block text-sm text-amber-950">
                  Country
                  <select
                    value={draft.receiverCountry}
                    onChange={(event) => updateDraft('receiverCountry', event.target.value)}
                    className="mt-2 h-11 w-full border border-amber-300 bg-white px-4 text-amber-950 outline-none focus:border-amber-600"
                  >
                    <option value="">Select country</option>
                    {routeCountries.map((country) => (
                      <option key={country.value} value={country.value}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm text-amber-950">
                  Name
                  <input
                    value={draft.receiverName}
                    onChange={(event) => updateDraft('receiverName', event.target.value)}
                    className="mt-2 h-11 w-full border border-amber-300 bg-white px-4 outline-none focus:border-amber-600"
                  />
                </label>

                <label className="block text-sm text-amber-950">
                  Company name (optional)
                  <input
                    value={draft.receiverCompany}
                    onChange={(event) => updateDraft('receiverCompany', event.target.value)}
                    className="mt-2 h-11 w-full border border-amber-300 bg-white px-4 outline-none focus:border-amber-600"
                  />
                </label>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
                  <label className="block text-sm text-amber-950">
                    City
                    <input
                      value={draft.receiverCity}
                      onChange={(event) => updateDraft('receiverCity', event.target.value)}
                      className="mt-2 h-11 w-full border border-amber-300 bg-white px-4 outline-none focus:border-amber-600"
                    />
                  </label>
                  <label className="block text-sm text-amber-950">
                    Address
                    <input
                      value={draft.receiverAddress}
                      onChange={(event) => updateDraft('receiverAddress', event.target.value)}
                      className="mt-2 h-11 w-full border border-amber-300 bg-white px-4 outline-none focus:border-amber-600"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <label className="block text-sm text-amber-950">
                    Postal code
                    <input
                      value={draft.receiverPostalCode}
                      onChange={(event) => updateDraft('receiverPostalCode', event.target.value)}
                      className="mt-2 h-11 w-full border border-amber-300 bg-white px-4 outline-none focus:border-amber-600"
                    />
                  </label>
                  <label className="block text-sm text-amber-950">
                    House number
                    <input
                      value={draft.receiverHouseNumber}
                      onChange={(event) => updateDraft('receiverHouseNumber', event.target.value)}
                      className="mt-2 h-11 w-full border border-amber-300 bg-white px-4 outline-none focus:border-amber-600"
                    />
                  </label>
                  <label className="block text-sm text-amber-950">
                    Addition (optional)
                    <input
                      value={draft.receiverAddition}
                      onChange={(event) => updateDraft('receiverAddition', event.target.value)}
                      className="mt-2 h-11 w-full border border-amber-300 bg-white px-4 outline-none focus:border-amber-600"
                    />
                  </label>
                </div>

                <label className="block text-sm text-amber-950">
                  Extra address information (optional)
                  <input
                    value={draft.receiverExtraInfo}
                    onChange={(event) => updateDraft('receiverExtraInfo', event.target.value)}
                    className="mt-2 h-11 w-full border border-amber-300 bg-white px-4 outline-none focus:border-amber-600"
                  />
                </label>
              </div>

              <h2 className="mt-8 text-base font-semibold text-amber-950">Contact Info</h2>
              <div className="mt-4 space-y-4">
                <label className="block text-sm text-amber-950">
                  Email address
                  <input
                    type="email"
                    value={draft.receiverEmail}
                    onChange={(event) => updateDraft('receiverEmail', event.target.value)}
                    className="mt-2 h-11 w-full border border-amber-300 bg-white px-4 outline-none focus:border-amber-600"
                  />
                </label>

                <label className="block text-sm text-amber-950">
                  Mobile phone number (optional)
                  <div className="mt-2 grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
                    <select
                      value={draft.receiverCountryCode}
                      onChange={(event) => updateDraft('receiverCountryCode', event.target.value)}
                      className="h-11 border border-amber-300 bg-white px-4 outline-none focus:border-amber-600"
                    >
                      <option value="">Code</option>
                      <option value="+31">+31</option>
                      <option value="+49">+49</option>
                      <option value="+33">+33</option>
                      <option value="+1">+1</option>
                    </select>
                    <input
                      value={draft.receiverPhone}
                      onChange={(event) => updateDraft('receiverPhone', event.target.value)}
                      placeholder="Enter phone number"
                      className="h-11 border border-amber-300 bg-white px-4 outline-none focus:border-amber-600"
                    />
                  </div>
                </label>

                <label className="block text-sm text-amber-950">
                  Reference (optional)
                  <input
                    value={draft.receiverReference}
                    onChange={(event) => updateDraft('receiverReference', event.target.value)}
                    className="mt-2 h-11 w-full border border-amber-300 bg-white px-4 outline-none focus:border-amber-600"
                  />
                </label>
              </div>
            </section>

            <section className="border border-amber-300 bg-amber-50 px-4 py-3">
              <h2 className="text-2xl font-normal text-amber-950">Products</h2>
            </section>

            <section className="border border-amber-300 bg-amber-50 p-4">
              <div className="border border-amber-300 bg-white p-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_240px]">
                  <label className="block text-xs text-amber-950">
                    Product Name
                    <input
                      value={draft.productName}
                      onChange={(event) => updateDraft('productName', event.target.value)}
                      placeholder="Enter product name"
                      className="mt-2 h-11 w-full border border-amber-300 bg-white px-4 text-base outline-none focus:border-amber-600"
                    />
                  </label>
                  <label className="block text-xs text-amber-950">
                    Quantity
                    <input
                      type="number"
                      min="1"
                      value={draft.quantity}
                      onChange={(event) => updateDraft('quantity', Number(event.target.value))}
                      className="mt-2 h-11 w-full border border-amber-300 bg-white px-4 text-center text-base font-semibold outline-none focus:border-amber-600"
                    />
                  </label>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    className="border border-amber-500 bg-amber-400 px-5 py-2 text-sm text-amber-950 hover:bg-amber-300"
                    onClick={addProductRow}
                  >
                    + Add Product
                  </button>
                </div>

                {products.length > 0 && (
                  <div className="mt-4 overflow-x-auto border border-amber-300">
                    <table className="min-w-[560px] w-full bg-white text-sm">
                      <thead className="bg-amber-100">
                        <tr>
                          <th className="border-b border-amber-300 px-3 py-2 text-left font-semibold text-amber-950">#</th>
                          <th className="border-b border-amber-300 px-3 py-2 text-left font-semibold text-amber-950">Product Name</th>
                          <th className="border-b border-amber-300 px-3 py-2 text-left font-semibold text-amber-950">Quantity</th>
                          <th className="border-b border-amber-300 px-3 py-2 text-left font-semibold text-amber-950">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product, index) => (
                          <tr key={product.id}>
                            <td className="border-b border-amber-200 px-3 py-2">{index + 1}</td>
                            <td className="border-b border-amber-200 px-3 py-2">{product.productName}</td>
                            <td className="border-b border-amber-200 px-3 py-2">{product.quantity}</td>
                            <td className="border-b border-amber-200 px-3 py-2">
                              <button
                                type="button"
                                onClick={() => removeProductRow(product.id)}
                                className="border border-red-200 bg-red-50 px-2 py-1 text-red-700 hover:bg-red-100"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
              </>
            )}
          </main>

          <aside className="h-fit border border-amber-300 bg-amber-50 p-4">
            <h2 className="text-base font-semibold text-amber-950">Saved Parcels</h2>
            <div className="mt-4 space-y-2">
              {savedParcels.length === 0 ? (
                <p className="border border-amber-300 bg-white p-3 text-sm text-amber-700">
                  No parcels saved yet.
                </p>
              ) : (
                savedParcels.map((parcel, index) => (
                  <div
                    key={`${parcel.receiverEmail}-${index}`}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border border-amber-300 bg-white p-3 text-sm"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      Parcel {index + 1}: {parcelSummary(parcel)}
                    </span>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => editSavedParcel(index)}
                        className="border border-amber-300 px-2 py-1 hover:bg-amber-50"
                        aria-label={`Edit parcel ${index + 1}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSavedParcel(index)}
                        className="border border-red-200 bg-red-50 px-2 py-1 text-red-700 hover:bg-red-100"
                        aria-label={`Delete parcel ${index + 1}`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

          <div className="border border-amber-300 bg-white p-4 2xl:col-span-2">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <label className="flex items-center gap-3 text-sm text-amber-950">
                <input
                  type="checkbox"
                  checked={saveRecipient}
                  onChange={(event) => setSaveRecipient(event.target.checked)}
                  className="h-4 w-4"
                />
                Save this address for future use
              </label>

              <div className="flex flex-wrap gap-2 md:justify-end">
                <button
                  type="button"
                  onClick={saveCurrentParcel}
                  className="border border-amber-300 bg-white px-5 py-2 text-sm text-amber-950 hover:bg-amber-50"
                >
                  Save and Send New Parcel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="bg-slate-950 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Confirm and Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
