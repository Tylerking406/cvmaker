import { useState } from 'react'
import { createWorkExperience, updateWorkExperience, deleteWorkExperience } from '../api'
import type { WorkExperience } from '../api/types'

const input = 'border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500'
const label = 'block text-sm font-medium text-gray-700 mb-1'

interface Props {
  cvId: string
  initialData: WorkExperience[]
}

type FormState = {
  company: string
  role: string
  location: string
  startDate: string
  endDate: string
  isCurrent: boolean
  bullets: string
  orderIndex: string
}

const empty: FormState = {
  company: '', role: '', location: '', startDate: '', endDate: '',
  isCurrent: false, bullets: '', orderIndex: '0',
}

function toForm(w: WorkExperience): FormState {
  return {
    company: w.company,
    role: w.role,
    location: w.location ?? '',
    startDate: w.startDate,
    endDate: w.endDate ?? '',
    isCurrent: w.isCurrent,
    bullets: w.bullets.join('\n'),
    orderIndex: String(w.orderIndex),
  }
}

function toPayload(f: FormState): Omit<WorkExperience, 'id' | 'cvId'> {
  return {
    company: f.company,
    role: f.role,
    location: f.location || null,
    startDate: f.startDate,
    endDate: f.isCurrent ? null : (f.endDate || null),
    isCurrent: f.isCurrent,
    bullets: f.bullets.split('\n').map(s => s.trim()).filter(Boolean),
    orderIndex: parseInt(f.orderIndex) || 0,
  }
}

export default function WorkExperienceSection({ cvId, initialData }: Props) {
  const [items, setItems] = useState<WorkExperience[]>(initialData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof FormState, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function startAdd() {
    setForm(empty)
    setEditingId(null)
    setAdding(true)
    setError('')
  }

  function startEdit(item: WorkExperience) {
    setForm(toForm(item))
    setEditingId(item.id)
    setAdding(false)
    setError('')
  }

  function cancel() {
    setAdding(false)
    setEditingId(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = toPayload(form)
      if (editingId) {
        const updated = await updateWorkExperience(cvId, editingId, payload)
        setItems(prev => prev.map(i => i.id === editingId ? updated : i))
      } else {
        const created = await createWorkExperience(cvId, payload)
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
    if (!confirm('Delete this entry?')) return
    try {
      await deleteWorkExperience(cvId, id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const showForm = adding || editingId !== null

  return (
    <div className="space-y-4 max-w-2xl">
      {!showForm && (
        <button
          onClick={startAdd}
          className="bg-blue-600 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-blue-700 transition-colors"
        >
          + Add Experience
        </button>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {showForm && (
        <form onSubmit={handleSave} className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">{editingId ? 'Edit Experience' : 'Add Experience'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Company <span className="text-red-500">*</span></label>
              <input className={input} value={form.company} onChange={e => set('company', e.target.value)} required />
            </div>
            <div>
              <label className={label}>Role <span className="text-red-500">*</span></label>
              <input className={input} value={form.role} onChange={e => set('role', e.target.value)} required />
            </div>
            <div>
              <label className={label}>Location</label>
              <input className={input} value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
            <div>
              <label className={label}>Start Date <span className="text-red-500">*</span></label>
              <input className={input} type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} required />
            </div>
            {!form.isCurrent && (
              <div>
                <label className={label}>End Date</label>
                <input className={input} type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
              </div>
            )}
            <div className="flex items-center gap-2 pt-5">
              <input
                id="we-current"
                type="checkbox"
                checked={form.isCurrent}
                onChange={e => set('isCurrent', e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="we-current" className="text-sm text-gray-700">Currently working here</label>
            </div>
            <div>
              <label className={label}>Order</label>
              <input className={input} type="number" value={form.orderIndex} onChange={e => set('orderIndex', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={label}>Bullets (one per line)</label>
            <textarea className={input} rows={4} value={form.bullets} onChange={e => set('bullets', e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white text-sm font-medium rounded-md px-5 py-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={cancel} className="text-sm text-gray-600 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {items.sort((a, b) => a.orderIndex - b.orderIndex).map(item => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{item.role} — {item.company}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {item.location && `${item.location} · `}
                {item.startDate} – {item.isCurrent ? 'Present' : (item.endDate ?? '')}
              </p>
              {item.bullets.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {item.bullets.map((b, i) => (
                    <li key={i} className="text-xs text-gray-600 flex gap-1.5"><span>•</span><span>{b}</span></li>
                  ))}
                </ul>
              )}
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
