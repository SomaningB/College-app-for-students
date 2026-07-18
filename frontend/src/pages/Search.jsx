import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api, { userNotesAPI } from '../services/api'
import { FiSearch, FiDownload, FiFileText, FiBook, FiFolder, FiExternalLink, FiPlus, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function Search() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState('')
  const [puc, setPuc] = useState('')
  const [results, setResults] = useState({ materials: [], my_notes: [], total: 0 })
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [subjects, setSubjects] = useState([])
  const [tab, setTab] = useState('all')
  const [folders, setFolders] = useState([])
  const [savingToFolder, setSavingToFolder] = useState(null)
  const [saveFolderId, setSaveFolderId] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedIds, setSavedIds] = useState(new Set())

  useEffect(() => {
    api.get('/search/subjects').then(r => setSubjects(r.data)).catch(() => {})
    userNotesAPI.listFolders().then(r => setFolders(r.data)).catch(() => {})
  }, [])

  const handleSearch = async () => {
    setLoading(true)
    setSearched(true)
    try {
      const params = {}
      if (query.trim()) params.q = query
      if (subject) params.subject = subject
      if (puc) params.puc = puc
      const res = await api.get('/search/', { params })
      setResults(res.data)
    } catch {
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleDownload = async (item) => {
    if (item.type === 'material') {
      try {
        const res = await api.get(`/materials/${item.id}/download`)
        window.open(res.data.file_url, '_blank')
      } catch {
        toast.error('Download failed')
      }
    } else {
      window.open(item.file_url, '_blank')
    }
  }

  const handleSaveToMyNotes = async (materialId) => {
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('material_id', materialId)
      fd.append('folder_id', saveFolderId)
      await userNotesAPI.saveFromMaterial(fd)
      toast.success('Saved to My Notes')
      setSavedIds(prev => new Set(prev).add(materialId))
      setSavingToFolder(null)
      setSaveFolderId('')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const pucs = ['1st', '2nd']

  const filteredMaterials = tab === 'my' ? [] : results.materials
  const filteredMyNotes = tab === 'global' ? [] : results.my_notes

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Search Notes</h1>
        <p style={{ color: 'var(--text-muted)' }}>Find study materials from teachers and your personal notes</p>
      </motion.div>

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <FiSearch size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by title, subject, or keyword..."
              className="input-field" style={{ paddingLeft: 40, width: '100%' }} />
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleSearch} disabled={loading}
            className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiSearch size={16} /> Search
          </motion.button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={subject} onChange={e => setSubject(e.target.value)} className="input-field" style={{ width: 'auto', minWidth: 160 }}>
            <option value="">All subjects</option>
            {[...new Set([...(user?.subjects || []), ...(user?.languages || []), ...subjects])].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={puc} onChange={e => setPuc(e.target.value)} className="input-field" style={{ width: 'auto', minWidth: 100 }}>
            <option value="">All PUC</option>
            {pucs.map(p => <option key={p} value={p}>PUC {p}</option>)}
          </select>
        </div>
      </div>

      {searched && (
        <div style={{ marginBottom: 16, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {results.total} result{results.total !== 1 ? 's' : ''} found
          {query && <> for "<strong>{query}</strong>"</>}
        </div>
      )}

      {(results.materials.length > 0 || results.my_notes.length > 0) && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'All', key: 'all' },
            { label: `Materials (${results.materials.length})`, key: 'global' },
            { label: `My Notes (${results.my_notes.length})`, key: 'my' }
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: '8px 16px', borderRadius: 8,
                background: tab === t.key ? 'var(--accent)' : 'var(--bg-card)',
                color: tab === t.key ? 'white' : 'var(--text-secondary)',
                border: tab === t.key ? 'none' : '1px solid var(--border)',
                fontSize: '0.85rem', fontWeight: 500
              }}>{t.label}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }} />
      ) : searched && filteredMaterials.length === 0 && filteredMyNotes.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <FiSearch size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div>No results found. Try different keywords.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredMaterials.map(item => (
            <motion.div key={`mat-${item.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: 'var(--accent-glow)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <FiBook size={20} style={{ color: 'var(--accent)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.title}
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <span>{item.subject}</span>
                  {item.puc && <span>· PUC {item.puc}</span>}
                  <span>· {item.file_type}</span>
                  <span>· {(item.file_size / 1024 / 1024).toFixed(1)} MB</span>
                  {item.download_count > 0 && <span>· {item.download_count} downloads</span>}
                  {item.contributor_name && <span>· {item.contributor_name}</span>}
                </div>
                {item.description && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.description}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {savingToFolder === item.id ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <select value={saveFolderId} onChange={e => setSaveFolderId(e.target.value)} className="input-field" style={{ width: 140, fontSize: '0.8rem', padding: '6px 8px' }}>
                      <option value="">Root folder</option>
                      {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <button onClick={() => handleSaveToMyNotes(item.id)} disabled={saving}
                      style={{ padding: '6px 10px', borderRadius: 6, background: 'var(--accent)', color: 'white', fontSize: '0.8rem' }}>
                      <FiCheck size={14} />
                    </button>
                    <button onClick={() => { setSavingToFolder(null); setSaveFolderId('') }}
                      style={{ padding: 6, color: 'var(--text-muted)', fontSize: '0.8rem' }}>X</button>
                  </div>
                ) : savedIds.has(item.id) ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--success)', padding: '0 8px' }}>Saved</span>
                ) : (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => { setSavingToFolder(item.id); setSaveFolderId('') }}
                    style={{
                      padding: '8px 12px', borderRadius: 8, fontSize: '0.8rem',
                      background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)',
                      color: '#818cf8', display: 'flex', alignItems: 'center', gap: 6
                    }}>
                    <FiPlus size={14} /> Add to My Notes
                  </motion.button>
                )}
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => handleDownload(item)}
                  style={{
                    padding: '8px 14px', borderRadius: 8,
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: '0.85rem'
                  }}>
                  <FiDownload size={14} /> Download
                </motion.button>
              </div>
            </motion.div>
          ))}
          {filteredMyNotes.map(item => (
            <motion.div key={`note-${item.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: 'rgba(99, 102, 241, 0.1)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <FiFolder size={20} style={{ color: '#818cf8' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <FiFileText size={14} style={{ marginRight: 6, verticalAlign: 'middle', color: 'var(--text-muted)' }} />
                  {item.title}
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <span>{item.subject || 'No subject'}</span>
                  <span>· {item.file_type}</span>
                  <span>· {(item.file_size / 1024 / 1024).toFixed(1)} MB</span>
                  <span>· My Notes</span>
                </div>
              </div>
              <button onClick={() => handleDownload(item)}
                style={{
                  padding: '8px 14px', borderRadius: 8,
                  background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)',
                  color: '#818cf8', display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: '0.85rem', flexShrink: 0
                }}>
                <FiExternalLink size={14} /> Open
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
