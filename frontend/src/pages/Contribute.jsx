import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { materialsAPI, streamsAPI } from '../services/api'
import toast from 'react-hot-toast'
import { FiUpload, FiFile } from 'react-icons/fi'

export default function Contribute() {
  const { user } = useAuth()
  const [streams, setStreams] = useState({})
  const [title, setTitle] = useState('')
  const [stream, setStream] = useState(user?.stream || '')
  const [puc, setPuc] = useState(user?.puc || '')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [history, setHistory] = useState([])

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    streamsAPI.getAll().then(res => setStreams(res.data)).catch(() => {})
  }, [])

  const streamKeys = Object.keys(streams).filter(k => k !== '_languages')
  const subjectOptions = stream ? (() => {
    const s = streams[stream]
    if (!s) return []
    if (isAdmin) {
      if (s.combinations) return [...new Set(Object.values(s.combinations).flat())]
      if (s.subjects) return s.subjects
      if (s.sectors) return s.sectors
      return []
    }
    const all = [...(user?.subjects || []), ...(user?.languages || [])]
    return [...new Set(all)]
  })() : []

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title || !subject || !file) {
      toast.error('Please fill in all required fields')
      return
    }
    setUploading(true)
    const fd = new FormData()
    fd.append('title', title)
    fd.append('stream', stream || user?.stream)
    fd.append('puc', puc || user?.puc)
    fd.append('subject', subject)
    if (description) fd.append('description', description)
    fd.append('file', file)
    try {
      await materialsAPI.contribute(fd)
      toast.success(user?.role === 'teacher' ? 'Note uploaded and available to students!' : 'Material submitted for review!')
      setTitle(''); setSubject(''); setDescription(''); setFile(null)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ marginBottom: 8 }}>Contribute Study Material</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: '0.9rem' }}>
          Share notes with your classmates. Uploads will be reviewed by an admin before publishing.
        </p>

        <div className="card" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              className="input-field" placeholder="Chapter title (e.g. Chapter 5 - Thermodynamics)" required />

            {isAdmin && (
              <select value={stream} onChange={e => { setStream(e.target.value); setSubject('') }}
                className="input-field" required>
                <option value="">Select Stream</option>
                {streamKeys.map(k => <option key={k} value={k}>{streams[k]?.label || k}</option>)}
              </select>
            )}

            {isAdmin && (
              <select value={puc} onChange={e => setPuc(e.target.value)}
                className="input-field" required>
                <option value="">PUC Year</option>
                <option value="1st">1st PUC</option>
                <option value="2nd">2nd PUC</option>
              </select>
            )}

            {!isAdmin && (
              <div style={{ display: 'flex', gap: 8, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <span style={{ padding: '4px 12px', borderRadius: 6, background: 'var(--bg-secondary)' }}>
                  {user?.stream}
                </span>
                <span style={{ padding: '4px 12px', borderRadius: 6, background: 'var(--bg-secondary)' }}>
                  {user?.puc} PUC
                </span>
              </div>
            )}

            <select value={subject} onChange={e => setSubject(e.target.value)}
              className="input-field" required>
              <option value="">Select Subject</option>
              {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <textarea value={description} onChange={e => setDescription(e.target.value)}
              className="input-field" placeholder="Description (optional)" rows={3}
              style={{ resize: 'vertical' }} />

            <div style={{
              border: '2px dashed var(--border)', borderRadius: 12, padding: 32,
              textAlign: 'center', cursor: 'pointer', color: 'var(--text-muted)'
            }} onClick={() => document.getElementById('fileInput').click()}>
              <FiUpload size={24} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: '0.85rem' }}>
                {file ? file.name : 'Click to upload PDF, TXT, or MD file'}
              </div>
              <input id="fileInput" type="file" hidden onChange={e => setFile(e.target.files[0])} accept=".pdf,.txt,.md" />
            </div>

            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              type="submit" disabled={uploading} className="btn btn-primary"
              style={{ justifyContent: 'center', padding: 14 }}>
              {uploading ? 'Uploading...' : <><FiUpload size={18} /> Submit for Review</>}
            </motion.button>
          </form>
        </div>

        {history.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>Your Contributions</h3>
            {history.map(h => (
              <div key={h.id} className="card" style={{ padding: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <FiFile size={18} color="var(--accent)" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{h.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{h.subject}</div>
                </div>
                <span style={{
                  padding: '4px 12px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
                  background: h.status === 'approved' ? 'var(--success)' : h.status === 'rejected' ? 'var(--error)' : 'var(--warning)',
                  color: 'white'
                }}>{h.status}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}