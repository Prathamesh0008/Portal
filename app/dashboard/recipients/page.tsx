'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/components/useAuth';

type Recipient = {
  _id: string;
  id?: string;
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
};

type RecipientForm = {
  country: string;
  name: string;
  company: string;
  city: string;
  address: string;
  postalCode: string;
  houseNumber: string;
  addition: string;
  extraInfo: string;
  email: string;
  countryCode: string;
  phone: string;
};

const countries = [
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'BE', label: 'Belgium' },
  { value: 'AT', label: 'Austria' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'US', label: 'United States' },
  { value: 'AL', label: 'Albania' },
];

function splitName(name: string) {
  const parts = name.trim().split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || parts[0] || '',
  };
}

function toForm(recipient: Recipient): RecipientForm {
  return {
    country: recipient.country || '',
    name: `${recipient.firstName} ${recipient.lastName}`.trim(),
    company: recipient.company || '',
    city: recipient.city || '',
    address: recipient.address || '',
    postalCode: recipient.postalCode || '',
    houseNumber: recipient.houseNumber || '',
    addition: recipient.addition || '',
    extraInfo: recipient.extraInfo || '',
    email: recipient.email || '',
    countryCode: recipient.countryCode || '',
    phone: recipient.phone || '',
  };
}

export default function RecipientsPage() {
  const { token } = useAuth();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState<RecipientForm | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!token) return;

    async function loadRecipients() {
      try {
        const response = await fetch('/api/recipients', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load recipients');
        }

        const nextRecipients = data.data || [];
        setRecipients(nextRecipients);
        if (nextRecipients.length > 0) {
          setSelectedId(nextRecipients[0]._id || nextRecipients[0].id);
          setForm(toForm(nextRecipients[0]));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load recipients');
      } finally {
        setIsLoading(false);
      }
    }

    loadRecipients();
  }, [token]);

  const selectedRecipient = recipients.find((recipient) => (recipient._id || recipient.id) === selectedId) || null;

  const filteredRecipients = useMemo(() => {
    return recipients.filter((recipient) => {
      const searchable = `${recipient.firstName} ${recipient.lastName} ${recipient.company || ''} ${recipient.email} ${recipient.postalCode} ${recipient.country}`.toLowerCase();
      return searchable.includes(search.toLowerCase());
    });
  }, [recipients, search]);

  const selectRecipient = (recipient: Recipient) => {
    setSelectedId(recipient._id || recipient.id || '');
    setForm(toForm(recipient));
  };

  const updateForm = (field: keyof RecipientForm, value: string) => {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleUpdate = async () => {
    if (!token || !selectedRecipient || !form) return;
    const { firstName, lastName } = splitName(form.name);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/recipients/${selectedRecipient._id || selectedRecipient.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          company: form.company,
          country: form.country,
          city: form.city,
          address: form.address,
          postalCode: form.postalCode,
          houseNumber: form.houseNumber,
          addition: form.addition,
          extraInfo: form.extraInfo,
          email: form.email,
          countryCode: form.countryCode,
          phone: form.phone,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update recipient');
      }

      setRecipients((current) =>
        current.map((recipient) =>
          (recipient._id || recipient.id) === selectedId ? data.data : recipient
        )
      );
      setForm(toForm(data.data));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unable to update recipient');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !selectedRecipient) return;
    const id = selectedRecipient._id || selectedRecipient.id;

    try {
      const response = await fetch(`/api/recipients/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete recipient');
      }

      const remaining = recipients.filter((recipient) => (recipient._id || recipient.id) !== id);
      setRecipients(remaining);
      setSelectedId(remaining[0]?._id || remaining[0]?.id || '');
      setForm(remaining[0] ? toForm(remaining[0]) : null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unable to delete recipient');
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen border border-amber-300 bg-white p-4 text-amber-950 md:p-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="border border-amber-300 bg-amber-50 px-4 py-3">
            <div className="h-10 border border-amber-200 bg-white px-5 py-2">
              <span className="font-semibold text-amber-950">Recipients</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_1fr]">
            <aside className="border border-amber-300 bg-white">
              <div className="border-b border-amber-300 bg-amber-50 p-4">
                <div className="flex items-center justify-between text-amber-950">
                  <h1 className="text-lg font-normal">Recipients</h1>
                  <span className="text-sm">{filteredRecipients.length}</span>
                </div>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search recipient..."
                  className="mt-4 h-11 w-full border border-amber-300 bg-white px-4 outline-none focus:border-amber-600"
                />
              </div>

              <div className="space-y-2 p-3">
                {isLoading ? (
                  <p className="p-3 text-sm text-amber-700">Loading recipients...</p>
                ) : error ? (
                  <p className="p-3 text-sm text-red-700">{error}</p>
                ) : filteredRecipients.length === 0 ? (
                  <p className="p-3 text-sm text-amber-700">No saved recipients.</p>
                ) : (
                  filteredRecipients.map((recipient) => {
                    const id = recipient._id || recipient.id || '';
                    const isSelected = id === selectedId;

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => selectRecipient(recipient)}
                        className={`w-full border p-3 text-left text-amber-950 ${
                          isSelected
                            ? 'border-amber-400 bg-amber-100'
                            : 'border-amber-300 bg-white hover:bg-amber-50'
                        }`}
                      >
                        <span className="block font-semibold">
                          {recipient.firstName} {recipient.lastName}
                        </span>
                        <span className="block text-sm text-amber-800">
                          {recipient.postalCode} {recipient.houseNumber}, {recipient.country}
                        </span>
                        <span className="mt-2 block text-xs uppercase tracking-wide text-amber-950">
                          Saved recipient
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            <section className="border border-amber-300 bg-amber-50 p-4">
              {!form ? (
                <p className="text-amber-700">Select a recipient to view details.</p>
              ) : (
                <>
                  <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-amber-300 pb-3">
                    <h2 className="text-base font-semibold text-amber-950">Address Details</h2>
                    <span className="border border-amber-300 bg-white px-3 py-2 text-sm text-amber-950">
                      {form.name}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleUpdate}
                      disabled={isSaving}
                      className="border border-amber-300 bg-white px-4 py-2 text-sm text-amber-950 hover:bg-amber-100 disabled:opacity-50"
                    >
                      {isSaving ? 'Updating...' : 'Update Recipient'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="border border-red-200 bg-red-50 px-3 py-2 text-red-700 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    <label className="block text-sm text-amber-950">
                      Country
                      <select
                        value={form.country}
                        onChange={(event) => updateForm('country', event.target.value)}
                        className="mt-2 h-11 w-full border border-amber-300 bg-white px-4 text-amber-950 outline-none focus:border-amber-600"
                      >
                        <option value="">Select country</option>
                        {countries.map((country) => (
                          <option key={country.value} value={country.value}>
                            {country.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-sm text-amber-950">
                      Name
                      <input
                        value={form.name}
                        onChange={(event) => updateForm('name', event.target.value)}
                        className="mt-2 h-11 w-full border border-amber-300 bg-white px-4 outline-none focus:border-amber-600"
                      />
                    </label>

                    <label className="block text-sm text-amber-950">
                      Company name (optional)
                      <input
                        value={form.company}
                        onChange={(event) => updateForm('company', event.target.value)}
                        className="mt-2 h-11 w-full border border-amber-300 bg-white px-4 outline-none focus:border-amber-600"
                      />
                    </label>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <label className="block text-sm text-amber-950">
                        City
                        <input
                          value={form.city}
                          onChange={(event) => updateForm('city', event.target.value)}
                          className="mt-2 h-11 w-full border border-amber-300 bg-white px-4 outline-none focus:border-amber-600"
                        />
                      </label>
                      <label className="block text-sm text-amber-950">
                        Address
                        <input
                          value={form.address}
                          onChange={(event) => updateForm('address', event.target.value)}
                          className="mt-2 h-11 w-full border border-amber-300 bg-white px-4 outline-none focus:border-amber-600"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                      <label className="block text-sm text-amber-950">
                        Postal code
                        <input
                          value={form.postalCode}
                          onChange={(event) => updateForm('postalCode', event.target.value)}
                          className="mt-2 h-11 w-full border border-amber-300 bg-white px-4 outline-none focus:border-amber-600"
                        />
                      </label>
                      <label className="block text-sm text-amber-950">
                        House number
                        <input
                          value={form.houseNumber}
                          onChange={(event) => updateForm('houseNumber', event.target.value)}
                          className="mt-2 h-11 w-full border border-amber-300 bg-white px-4 outline-none focus:border-amber-600"
                        />
                      </label>
                      <label className="block text-sm text-amber-950">
                        Addition (optional)
                        <input
                          value={form.addition}
                          onChange={(event) => updateForm('addition', event.target.value)}
                          className="mt-2 h-11 w-full border border-amber-300 bg-white px-4 outline-none focus:border-amber-600"
                        />
                      </label>
                    </div>

                    <label className="block text-sm text-amber-950">
                      Extra address information (optional)
                      <input
                        value={form.extraInfo}
                        onChange={(event) => updateForm('extraInfo', event.target.value)}
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
                        value={form.email}
                        onChange={(event) => updateForm('email', event.target.value)}
                        className="mt-2 h-11 w-full border border-amber-300 bg-white px-4 outline-none focus:border-amber-600"
                      />
                    </label>

                    <label className="block text-sm text-amber-950">
                      Mobile phone number (optional)
                      <div className="mt-2 grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
                        <select
                          value={form.countryCode}
                          onChange={(event) => updateForm('countryCode', event.target.value)}
                          className="h-11 border border-amber-300 bg-white px-4 outline-none focus:border-amber-600"
                        >
                          <option value="">Code</option>
                          <option value="+31">+31</option>
                          <option value="+49">+49</option>
                          <option value="+33">+33</option>
                          <option value="+1">+1</option>
                        </select>
                        <input
                          value={form.phone}
                          onChange={(event) => updateForm('phone', event.target.value)}
                          placeholder="Enter phone number"
                          className="h-11 border border-amber-300 bg-white px-4 outline-none focus:border-amber-600"
                        />
                      </div>
                    </label>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
