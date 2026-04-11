import { useState } from 'react'
import { createCertification, updateCertification, deleteCertification } from '../api'
import type { Certification } from '../api/types'

const input = 'border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500'
const label = 'block text-sm font-medium text-gray-700 mb-1'

interface Props {
  cvId: string
  initialData: Certification[]
}

type FormState = {
  name: string; issuer: string; issueDate: string; expiryDate: string; url: string; orderIndex: string
}

const empty: FormState = { name: '', issuer: '', issueDate: '', expiryDate: '', url: '', orderIndex: '0' }

function toForm(c: Certification): FormState {
  return {
    name: c.name,
    issuer: c.issuer ?? '',
    issueDate: c.issueDate ?? '',
    expiryDate: c.expiryDate ?? '',
    url: c.url ?? '',
    orderIndex: String(c.orderIndex),
  }
}

function toPayload(f: FormState): Omit<Certification, 'id' | 'cvId'> {
  return {
    name: f.name,
    issuer: f.issuer || null,
    issueDate: f.issueDate || null,
    expiryDate: f.expiryDate || null,
    url: f.url || null,
    orderIndex: parseInt(f.orderIndex) || 0,
  }
}

export default function CertificationsSection({ cvId, initialData }: Props) {
  const [items, setItems] = useState<Certification[]>(initialData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function startAdd() { setForm(empty); setEditingId(null); setAdding(true); setError('') }
  function startEdit(item: Certification) { setForm(toForm(item)); setEditingId(item.id); setAdding(false); setError('') }
  function cancel() { setAdding(false); setEditingId(null) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const payload = toPayload(form)
      if (editingId) {
        const updated = await updateCertification(cvId, editingId, payload)
        setItems(prev => prev.map(i => i.id === editingId ? updated : i))
      } else {
        const created = await createCertification(cvId, payload)
        setItems(prev => [...prev, created])
      }
      cancel()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this certification?')) return
    try {
      await deleteCertification(cvId, id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const showForm = adding || editingId !== null

  return (
    <div className="space-y-4 max-w-2xl">
      {!showForm && (
        <button onClick={startAdd} className="bg-blue-600 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-blue-700 transition-colors">
          + Add Certification
        </button>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {showForm && (
        <form onSubmit={handleSave} className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">{editingId ? 'Edit Certification' : 'Add Certification'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Name <span className="text-red-500">*</span></label>
              <input className={input} value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div>
              <label className={label}>Issuer</label>
              <input className={input} value={form.issuer} onChange={e => set('issuer', e.target.value)} />
            </div>
            <div>
              <label className={label}>Issue Date</label>
              <input className={input} type="date" value={form.issueDate} onChange={e => set('issueDate', e.target.value)} />
            </div>
            <div>
              <label className={label}>Expiry Date</label>
              <input className={input} type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>URL</label>
              <input className={input} value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <label className={label}>Order</label>
              <input className={input} type="number" value={form.orderIndex} onChange={e => set('orderIndex', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-blue-600 text-white text-sm font-medium rounded-md px-5 py-2 hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={cancel} className="text-sm text-gray-600 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {items.sort((a, b) => a.orderIndex - b.orderIndex).map(item => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Link</a>}
              </div>
              {item.issuer && <p className="text-xs text-gray-600">{item.issuer}</p>}
              <p className="text-xs text-gray-500 mt-0.5">
                {item.issueDate ?? ''}
                {item.expiryDate ? ` – ${item.expiryDate}` : ''}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => startEdit(item)} className="text-xs text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors">Edit</button>
              <button onClick={() => handleDelete(item.id)} className="text-xs text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
