import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getCvs, createCv, deleteCv } from '../api'
import type { CvSummary } from '../api/types'

const USER_ID_KEY = 'cvmaker_user_id'

export default function Dashboard() {
  const navigate = useNavigate()
  const [userId, setUserId] = useState(() => localStorage.getItem(USER_ID_KEY) ?? '')
  const [userIdInput, setUserIdInput] = useState('')
  const [cvs, setCvs] = useState<CvSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError('')
    getCvs(userId)
      .then(setCvs)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [userId])

  function handleSetUser(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = userIdInput.trim()
    if (!trimmed) return
    localStorage.setItem(USER_ID_KEY, trimmed)
    setUserId(trimmed)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const cv = await createCv(userId, newTitle.trim())
      setCvs(prev => [cv, ...prev])
      setNewTitle('')
      setShowNewForm(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create CV')
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this CV?')) return
    try {
      await deleteCv(id)
      setCvs(prev => prev.filter(c => c.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete CV')
    }
  }

  if (!userId) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-16">
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to CV Maker</h1>
            <p className="text-gray-500 mb-6 text-sm">Enter your user ID to get started.</p>
            <form onSubmit={handleSetUser} className="space-y-4">
              <input
                type="text"
                placeholder="User ID (UUID)"
                value={userIdInput}
                onChange={e => setUserIdInput(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My CVs</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            User: {userId}{' '}
            <button
              onClick={() => { localStorage.removeItem(USER_ID_KEY); setUserId(''); setCvs([]) }}
              className="text-blue-500 hover:underline"
            >
              change
            </button>
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="bg-blue-600 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-blue-700 transition-colors"
        >
          + New CV
        </button>
      </div>

      {showNewForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex gap-3 shadow-sm">
          <input
            type="text"
            placeholder="CV title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            autoFocus
            className="border border-gray-300 rounded-md px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={creating}
            className="bg-blue-600 text-white text-sm font-medium rounded-md px-4 py-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
          <button
            type="button"
            onClick={() => setShowNewForm(false)}
            className="text-gray-500 text-sm px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </form>
      )}

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {loading && <p className="text-gray-500 text-sm">Loading…</p>}

      {!loading && cvs.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No CVs yet.</p>
          <p className="text-sm mt-1">Click "+ New CV" to create one.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cvs.map(cv => (
          <div key={cv.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900 text-base truncate">{cv.title}</h2>
              <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">
                {cv.template}
              </span>
              <p className="text-xs text-gray-400 mt-2">
                Updated {new Date(cv.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/cvs/${cv.id}`)}
                className="flex-1 text-sm font-medium bg-blue-50 text-blue-700 rounded-md px-3 py-1.5 hover:bg-blue-100 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(cv.id)}
                className="text-sm text-red-500 rounded-md px-3 py-1.5 hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
