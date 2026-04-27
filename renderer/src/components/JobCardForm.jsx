import { useState, useEffect } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import { useFormFields } from '../hooks/useFormFields';
import { X } from 'lucide-react';

const today = () => new Date().toISOString().split('T')[0];

const EMPTY = {
  accountId:        '',
  date:             today(),
  customer:         '',
  contNo:           '',
  lcCNo:            '',
  ogcNo:            '',
  partName:         '',
  poNo:             '',
  billNo:           '',
  dwgNo:            '',
  qty:              '',
  settingStartTime: '',
  settingEndTime:   '',
  settingTotalTime: '',
  jobStartTime:     '',
  jobEndTime:       '',
  jobTotalTime:     '',
  mcHrsStart:       '',
  mcHrsEnd:         '',
  mcTotalTime:      '',
  pl:               '',
  thickness:        '',
  taper:            '',
  operator:         '',
  remark:           '',
  progNo:           '',
  amount:           '0.00',
  extraFields:      {},
};

function TextInput({ label, value, onChange, type = 'text', readOnly, required }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        required={required}
        className={`w-full px-2.5 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500
          ${readOnly
            ? 'bg-gray-100 dark:bg-gray-600 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'
            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100'
          }`}
      />
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div className="col-span-4 mt-3 mb-1">
      <h3 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider border-b border-blue-100 dark:border-blue-900 pb-1">
        {title}
      </h3>
    </div>
  );
}

export default function JobCardForm({ initial, onSave, onCancel, saving }) {
  const { accounts } = useAccounts();
  const { formFields } = useFormFields();

  const [form, setForm] = useState(() => {
    if (!initial) return EMPTY;
    return {
      ...EMPTY,
      ...initial,
      accountId: initial.accountId ? String(initial.accountId) : '',
      date:      initial.date
        ? new Date(initial.date).toISOString().split('T')[0]
        : today(),
      extraFields: initial.extraFields || {},
    };
  });

  const [error, setError] = useState('');

  const set = (field) => (e) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const setExtra = (name) => (e) =>
    setForm(prev => ({
      ...prev,
      extraFields: { ...prev.extraFields, [name]: e.target.value },
    }));

  const toggleMulti = (name, option) => {
    setForm(prev => {
      const current = prev.extraFields[name] || [];
      const next = current.includes(option)
        ? current.filter(v => v !== option)
        : [...current, option];
      return { ...prev, extraFields: { ...prev.extraFields, [name]: next } };
    });
  };

  // Auto-fill customer name from selected account
  useEffect(() => {
    if (form.accountId) {
      const acc = accounts.find(a => String(a.id) === String(form.accountId));
      if (acc && !initial) {
        setForm(prev => ({ ...prev, customer: acc.acctName }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.accountId, accounts]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.accountId) { setError('Please select an account'); return; }
    onSave({
      ...form,
      accountId: parseInt(form.accountId, 10),
      qty: form.qty !== '' ? parseInt(form.qty, 10) : null,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">
          {initial ? `Edit Job Card — ${initial.jobNo}` : 'New Job Card'}
        </h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-4 gap-x-4 gap-y-3">

          <SectionHeader title="Account & Identification" />

          {/* Account selector */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">
              Account <span className="text-red-500">*</span>
            </label>
            <select
              value={form.accountId}
              onChange={set('accountId')}
              required
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">— Select account —</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.acctName}{a.city ? ` (${a.city})` : ''}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">Job No</label>
            <input
              value={initial?.jobNo || '(auto-generated)'}
              readOnly
              className="w-full px-2.5 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
            />
          </div>

          <TextInput label="Date" value={form.date} onChange={set('date')} type="date" />

          <TextInput label="Customer"  value={form.customer} onChange={set('customer')} />
          <TextInput label="Cont No"   value={form.contNo}   onChange={set('contNo')} />
          <TextInput label="L.C.C No"  value={form.lcCNo}    onChange={set('lcCNo')} />
          <TextInput label="O.G.C No"  value={form.ogcNo}    onChange={set('ogcNo')} />
          <TextInput label="Part Name" value={form.partName} onChange={set('partName')} />
          <TextInput label="P.O. No"   value={form.poNo}     onChange={set('poNo')} />
          <TextInput label="Bill No"   value={form.billNo}   onChange={set('billNo')} />
          <TextInput label="DWG No"    value={form.dwgNo}    onChange={set('dwgNo')} />
          <TextInput label="QTY"       value={form.qty}      onChange={set('qty')} type="number" />

          <SectionHeader title="Setting" />
          <TextInput label="Start Time"  value={form.settingStartTime} onChange={set('settingStartTime')} />
          <TextInput label="End Time"    value={form.settingEndTime}   onChange={set('settingEndTime')} />
          <TextInput label="Total Time"  value={form.settingTotalTime} onChange={set('settingTotalTime')} />
          <div />

          <SectionHeader title="Job" />
          <TextInput label="Job Start Time" value={form.jobStartTime} onChange={set('jobStartTime')} />
          <TextInput label="Job End Time"   value={form.jobEndTime}   onChange={set('jobEndTime')} />
          <TextInput label="Total Time"     value={form.jobTotalTime} onChange={set('jobTotalTime')} />
          <div />

          <SectionHeader title="M/C Hours" />
          <TextInput label="M/C Hrs Start" value={form.mcHrsStart}  onChange={set('mcHrsStart')} />
          <TextInput label="M/C Hrs End"   value={form.mcHrsEnd}    onChange={set('mcHrsEnd')} />
          <TextInput label="Total Time"    value={form.mcTotalTime} onChange={set('mcTotalTime')} />
          <div />

          <SectionHeader title="Specifications" />
          <TextInput label="PL"        value={form.pl}        onChange={set('pl')} />
          <TextInput label="Thickness" value={form.thickness} onChange={set('thickness')} />
          <TextInput label="Taper"     value={form.taper}     onChange={set('taper')} />
          <div />

          <SectionHeader title="Assignment" />
          <TextInput label="Operator" value={form.operator} onChange={set('operator')} />
          <TextInput label="Prog No"  value={form.progNo}   onChange={set('progNo')} />
          <TextInput label="Amount"   value={form.amount}   onChange={set('amount')} />
          <div />

          <div className="col-span-4">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">Remark</label>
            <textarea
              value={form.remark}
              onChange={set('remark')}
              rows={2}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Extra settings-defined fields */}
          {formFields.length > 0 && (
            <>
              <SectionHeader title="Additional Fields" />
              {formFields.map(field => {
                if (field.type === 'multiselect') {
                  const opts = field.options ? JSON.parse(field.options) : [];
                  const selected = form.extraFields[field.name] || [];
                  return (
                    <div key={field.id} className="col-span-2">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {opts.map(opt => (
                          <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selected.includes(opt)}
                              onChange={() => toggleMulti(field.name, opt)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-gray-700 dark:text-gray-300">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={field.id}>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                      {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <input
                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                      value={form.extraFields[field.name] || ''}
                      onChange={setExtra(field.name)}
                      required={field.required}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                );
              })}
            </>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg"
          >
            {saving ? 'Saving…' : initial ? 'Update' : 'Create Job Card'}
          </button>
        </div>
      </form>
    </div>
  );
}
