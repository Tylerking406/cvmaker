import { useState } from 'react'
import { createEducation, updateEducation, deleteEducation } from '../api'
import type { Education } from '../api/types'

const input = 'border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500'
const label = 'block text-sm font-medium text-gray-700 mb-1'

interface Props {
  cvId: string
  initialData: Education[]
}

type FormState = {
  institution: string
  degree: string
  field: string
  startDate: string
  endDate: string
  isCurrent: boolean
  achievements: string
  orderIndex: string
}

const empty: FormState = {
  institution: '', degree: '', field: '', startDate: '', endDate: '',
  isCurrent: false, achievements: '', orderIndex: '0',
}

function toForm(e: Education): FormState {
  return {
    institution: e.institution,
    degree: e.degree,
    field: e.field ?? '',
    startDate: e.startDate ?? '',
    endDate: e.endDate ?? '',
    isCurrent: e.isCurrent,
    achievements: e.achievements.join('\n'),
    orderIndex: String(e.orderIndex),
  }
}

function toPayload(f: FormState): Omit<Education, 'id' | 'cvId'> {
  return {
    institution: f.institution,
    degree: f.degree,
    field: f.field || null,
    startDate: f.startDate || null,
    endDate: f.isCurrent ? null : (f.endDate || null),
    isCurrent: f.isCurrent,
    achievements: f.achievements.split('\n').map(s => s.trim()).filter(Boolean),
    orderIndex: parseInt(f.orderIndex) || 0,
  }
}

export default function EducationSection({ cvId, initialData }: Props) {
  const [items, setItems] = useState<Education[]>(initialData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof FormState, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function startAdd() { setForm(empty); setEditingId(null); setAdding(true); setError('') }
  function startEdit(item: Education) { setForm(toForm(item)); setEditingId(item.id); setAdding(false); setError('') }
  function cancel() { setAdding(false); setEditingId(null) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const payload = toPayload(form)
      if (editingId) {
        const updated = await updateEducation(cvId, editingId, payload)
        setItems(prev => prev.map(i => i.id === editingId ? updated : i))
      } else {
        const created = await createEducation(cvId, payload)
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
      await deleteEducation(cvId, id)
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
          + Add Education
        </button>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {showForm && (
        <form onSubmit={handleSave} className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">{editingId ? 'Edit Education' : 'Add Education'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Institution <span className="text-red-500">*</span></label>
              <input className={input} value={form.institution} onChange={e => set('institution', e.target.value)} required />
            </div>
            <div>
              <label className={label}>Degree <span className="text-red-500">*</span></label>
              <input className={input} value={form.degree} onChange={e => set('degree', e.target.value)} required />
            </div>
            <div>
              <label className={label}>Field of Study</label>
              <input className={input} value={form.field} onChange={e => set('field', e.target.value)} />
            </div>
            <div>
              <label className={label}>Start Date</label>
              <input className={input} type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
            {!form.isCurrent && (
              <div>
                <label className={label}>End Date</label>
                <input className={input} type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
              </div>
            )}
            <div className="flex items-center gap-2 pt-5">
              <input id="edu-current" type="checkbox" checked={form.isCurrent} onChange={e => set('isCurrent', e.target.checked)} className="rounded border-gray-300" />
              <label htmlFor="edu-current" className="text-sm text-gray-700">Currently studying</label>
            </div>
            <div>
              <label className={label}>Order</label>
              <input className={input} type="number" value={form.orderIndex} onChange={e => set('orderIndex', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={label}>Achievements (one per line)</label>
            <textarea className={input} rows={3} value={form.achievements} onChange={e => set('achievements', e.target.value)} />
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
              <p className="font-semibold text-gray-900 text-sm">{item.degree}{item.field ? `, ${item.field}` : ''}</p>
              <p className="text-xs text-gray-600">{item.institution}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {item.startDate ?? ''} – {item.isCurrent ? 'Present' : (item.endDate ?? '')}
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
