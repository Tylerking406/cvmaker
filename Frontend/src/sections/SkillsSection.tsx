import { useState } from 'react'
import { createSkill, updateSkill, deleteSkill } from '../api'
import type { Skill } from '../api/types'

const input = 'border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500'
const label = 'block text-sm font-medium text-gray-700 mb-1'

interface Props {
  cvId: string
  initialData: Skill[]
}

type FormState = { category: string; items: string; orderIndex: string }
const empty: FormState = { category: '', items: '', orderIndex: '0' }

function toForm(s: Skill): FormState {
  return { category: s.category, items: s.items.join('\n'), orderIndex: String(s.orderIndex) }
}

function toPayload(f: FormState): Omit<Skill, 'id' | 'cvId'> {
  return {
    category: f.category,
    items: f.items.split('\n').map(s => s.trim()).filter(Boolean),
    orderIndex: parseInt(f.orderIndex) || 0,
  }
}

export default function SkillsSection({ cvId, initialData }: Props) {
  const [items, setItems] = useState<Skill[]>(initialData)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function startAdd() { setForm(empty); setEditingId(null); setAdding(true); setError('') }
  function startEdit(item: Skill) { setForm(toForm(item)); setEditingId(item.id); setAdding(false); setError('') }
  function cancel() { setAdding(false); setEditingId(null) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const payload = toPayload(form)
      if (editingId) {
        const updated = await updateSkill(cvId, editingId, payload)
        setItems(prev => prev.map(i => i.id === editingId ? updated : i))
      } else {
        const created = await createSkill(cvId, payload)
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
    if (!confirm('Delete this skill group?')) return
    try {
      await deleteSkill(cvId, id)
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
          + Add Skill Group
        </button>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {showForm && (
        <form onSubmit={handleSave} className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">{editingId ? 'Edit Skill Group' : 'Add Skill Group'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Category <span className="text-red-500">*</span></label>
              <input className={input} value={form.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Languages, Frameworks" required />
            </div>
            <div>
              <label className={label}>Order</label>
              <input className={input} type="number" value={form.orderIndex} onChange={e => set('orderIndex', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={label}>Skills (one per line)</label>
            <textarea className={input} rows={4} value={form.items} onChange={e => set('items', e.target.value)} placeholder="TypeScript&#10;React&#10;Node.js" />
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
              <p className="font-semibold text-gray-900 text-sm">{item.category}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {item.items.map((s, i) => (
                  <span key={i} className="text-xs bg-blue-50 text-blue-700 rounded px-2 py-0.5">{s}</span>
                ))}
              </div>
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
