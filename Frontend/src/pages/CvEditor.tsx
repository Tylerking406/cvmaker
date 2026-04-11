import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { getCv, updateCv } from '../api'
import type { CvDetail } from '../api/types'
import PersonalInfoSection from '../sections/PersonalInfoSection'
import WorkExperienceSection from '../sections/WorkExperienceSection'
import EducationSection from '../sections/EducationSection'
import SkillsSection from '../sections/SkillsSection'
import ProjectsSection from '../sections/ProjectsSection'
import CertificationsSection from '../sections/CertificationsSection'
import AchievementsSection from '../sections/AchievementsSection'

type Tab = 'personal' | 'work' | 'education' | 'skills' | 'projects' | 'certifications' | 'achievements'

const TABS: { id: Tab; label: string }[] = [
  { id: 'personal', label: 'Personal Info' },
  { id: 'work', label: 'Work Experience' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'achievements', label: 'Achievements' },
]

export default function CvEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [cv, setCv] = useState<CvDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('personal')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [savingTitle, setSavingTitle] = useState(false)

  useEffect(() => {
    if (!id) return
    getCv(id)
      .then(data => { setCv(data); setTitleInput(data.title) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSaveTitle(e: React.FormEvent) {
    e.preventDefault()
    if (!cv || !titleInput.trim()) return
    setSavingTitle(true)
    try {
      const updated = await updateCv(cv.id, titleInput.trim(), cv.template)
      setCv(prev => prev ? { ...prev, title: updated.title } : prev)
      setEditingTitle(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update title')
    } finally {
      setSavingTitle(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <p className="text-gray-500 text-sm">Loading…</p>
      </Layout>
    )
  }

  if (error || !cv) {
    return (
      <Layout>
        <p className="text-red-600 text-sm">{error || 'CV not found'}</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-3 flex items-center gap-1 transition-colors"
        >
          ← Back to CVs
        </button>

        <div className="flex items-center gap-3">
          {editingTitle ? (
            <form onSubmit={handleSaveTitle} className="flex items-center gap-2">
              <input
                autoFocus
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={savingTitle}
                className="text-sm bg-blue-600 text-white rounded-md px-3 py-1.5 hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {savingTitle ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => { setEditingTitle(false); setTitleInput(cv.title) }}
                className="text-sm text-gray-500 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </form>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-gray-900">{cv.title}</h1>
              <button
                onClick={() => setEditingTitle(true)}
                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
              >
                Rename
              </button>
              <span className="text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5">{cv.template}</span>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <nav className="flex gap-0 -mb-px min-w-max">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'personal' && (
          <PersonalInfoSection cvId={cv.id} initialData={cv.personalInfo} />
        )}
        {activeTab === 'work' && (
          <WorkExperienceSection cvId={cv.id} initialData={cv.workExperiences} />
        )}
        {activeTab === 'education' && (
          <EducationSection cvId={cv.id} initialData={cv.educations} />
        )}
        {activeTab === 'skills' && (
          <SkillsSection cvId={cv.id} initialData={cv.skills} />
        )}
        {activeTab === 'projects' && (
          <ProjectsSection cvId={cv.id} initialData={cv.projects} />
        )}
        {activeTab === 'certifications' && (
          <CertificationsSection cvId={cv.id} initialData={cv.certifications} />
        )}
        {activeTab === 'achievements' && (
          <AchievementsSection cvId={cv.id} initialData={cv.achievements} />
        )}
      </div>
    </Layout>
  )
}
