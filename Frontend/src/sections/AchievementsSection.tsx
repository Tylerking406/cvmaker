import { useState } from 'react'
import { createAchievement, updateAchievement, deleteAchievement } from '../api'
import type { Achievement } from '../api/types'

const input = 'border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500'
const label = 'block text-sm font-medium text-gray-700 mb-1'

interface Props {
  cvId: string
  initialData: Achievement[]
}

type FormState = { description: string; orderIndex: string }
const empty: FormState = { description: '', orderIndex: '0' }

function toForm(a: Achievement): FormState {
  return { description: a.description, orderIndex: String(a.orderIndex) }
}

export default function AchievementsSection({ cvId, initialData }: Props) {
  const [items, setItems] = useState<Achievement[]>(initialData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function startAdd() { setForm(empty); setEditingId(null); setAdding(true); setError('') }
  function startEdit(item: Achievement) { setForm(toForm(item)); setEditingId(item.id); setAdding(false); setError('') }
  function cancel() { setAdding(false); setEditingId(null) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const payload = { description: form.description, orderIndex: parseInt(form.orderIndex) || 0 }
      if (editingId) {
        const updated = await updateAchievement(cvId, editingId, payload)
        setItems(prev => prev.map(i => i.id === editingId ? updated : i))
      } else {
        const created = await createAchievement(cvId, payload)
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
    if (!confirm('Delete this achievement?')) return
    try {
      await deleteAchievement(cvId, id)
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
          + Add Achievement
        </button>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {showForm && (
        <form onSubmit={handleSave} className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">{editingId ? 'Edit Achievement' : 'Add Achievement'}</h3>
          <div>
            <label className={label}>Description <span className="text-red-500">*</span></label>
            <textarea className={input} rows={3} value={form.description} onChange={e => set('description', e.target.value)} required />
          </div>
          <div className="w-32">
            <label className={label}>Order</label>
            <input className={input} type="number" value={form.orderIndex} onChange={e => set('orderIndex', e.target.value)} />
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
            <p className="text-sm text-gray-800 flex-1">{item.description}</p>
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
