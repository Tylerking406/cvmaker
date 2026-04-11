import { useState } from 'react'
import { upsertPersonalInfo } from '../api'
import type { PersonalInfo } from '../api/types'

const input = 'border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500'
const label = 'block text-sm font-medium text-gray-700 mb-1'

interface Props {
  cvId: string
  initialData: PersonalInfo | null
}

type FormState = Omit<PersonalInfo, 'id' | 'cvId'>

const empty: FormState = {
  fullName: '', jobTitle: '', email: '', phone: '',
  location: '', linkedIn: '', gitHub: '', website: '', summary: '',
}

function toForm(p: PersonalInfo): FormState {
  return {
    fullName: p.fullName,
    jobTitle: p.jobTitle ?? '',
    email: p.email ?? '',
    phone: p.phone ?? '',
    location: p.location ?? '',
    linkedIn: p.linkedIn ?? '',
    gitHub: p.gitHub ?? '',
    website: p.website ?? '',
    summary: p.summary ?? '',
  }
}

export default function PersonalInfoSection({ cvId, initialData }: Props) {
  const [form, setForm] = useState<FormState>(initialData ? toForm(initialData) : empty)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await upsertPersonalInfo(cvId, {
        fullName: form.fullName,
        jobTitle: form.jobTitle || null,
        email: form.email || null,
        phone: form.phone || null,
        location: form.location || null,
        linkedIn: form.linkedIn || null,
        gitHub: form.gitHub || null,
        website: form.website || null,
        summary: form.summary || null,
      })
      setSaved(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Full Name <span className="text-red-500">*</span></label>
          <input className={input} value={form.fullName} onChange={e => set('fullName', e.target.value)} required />
        </div>
        <div>
          <label className={label}>Job Title</label>
          <input className={input} value={form.jobTitle ?? ''} onChange={e => set('jobTitle', e.target.value)} />
        </div>
        <div>
          <label className={label}>Email</label>
          <input className={input} type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} />
        </div>
        <div>
          <label className={label}>Phone</label>
          <input className={input} value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} />
        </div>
        <div>
          <label className={label}>Location</label>
          <input className={input} value={form.location ?? ''} onChange={e => set('location', e.target.value)} />
        </div>
        <div>
          <label className={label}>LinkedIn</label>
          <input className={input} value={form.linkedIn ?? ''} onChange={e => set('linkedIn', e.target.value)} />
        </div>
        <div>
          <label className={label}>GitHub</label>
          <input className={input} value={form.gitHub ?? ''} onChange={e => set('gitHub', e.target.value)} />
        </div>
        <div>
          <label className={label}>Website</label>
          <input className={input} value={form.website ?? ''} onChange={e => set('website', e.target.value)} />
        </div>
      </div>
      <div>
        <label className={label}>Summary</label>
        <textarea
          className={input}
          rows={4}
          value={form.summary ?? ''}
          onChange={e => set('summary', e.target.value)}
        />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white text-sm font-medium rounded-md px-5 py-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {saved && <span className="text-green-600 text-sm">Saved!</span>}
      </div>
    </form>
  )
}
