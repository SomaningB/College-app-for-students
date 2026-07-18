import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { teacherAPI } from '../services/api'
import { FiUpload, FiFileText, FiTrash2, FiBook, FiDownload, FiPlus, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [puc, setPuc] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [uploadLoading, setUploadLoading] = useState(false)

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    try {
      const res = await teacherAPI.getNotes()
      setNotes(res.data)
    } catch {
      toast.error('Failed to load notes')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!title.trim() || !subject || !puc || !file) return toast.error('Fill all fields')
    setUploadLoading(true)
    try {
      const fd = new FormData()
      fd.append('title', title)
      fd.append('subject', subject)
      fd.append('puc', puc)
      if (description) fd.append('description', description)
      fd.append('file', file)
      await teacherAPI.upload(fd)
      toast.success('Note uploaded and available to students')
      setShowUpload(false)
      setTitle('')
      setSubject('')
      setPuc('')
      setDescription('')
      setFile(null)
      loadNotes()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this note? Students will no longer access it.')) return
    try {
      await teacherAPI.deleteNote(id)
      toast.success('Note deleted')
      setNotes(prev => prev.filter(n => n.id !== id))
    } catch {
      toast.error('Delete failed')
    }
  }

  const subjects = user?.subjects || []

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Teacher Dashboard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Upload study notes for your subjects — students can find and download them</p>
      </motion.div>

      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={() => setShowUpload(true)}
        className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <FiPlus size={16} /> Upload New Note
      </motion.button>

      {showUpload && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="card" style={{ padding: 20, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem' }}><FiUpload size={16} style={{ marginRight: 8 }} />Upload Note</h3>
            <button onClick={() => setShowUpload(false)} className="btn btn-ghost"><FiX size={18} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 500 }}>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Note title" className="input-field" />
            <select value={subject} onChange={e => setSubject(e.target.value)} className="input-field">
              <option value="">Select subject</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={puc} onChange={e => setPuc(e.target.value)} className="input-field">
              <option value="">Select PUC year</option>
              <option value="1st">PUC 1st Year</option>
              <option value="2nd">PUC 2nd Year</option>
            </select>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Description (optional)" className="input-field" rows={3} />
            <div onClick={() => document.getElementById('teacher-file-input').click()}
              style={{
                padding: 20, borderRadius: 10, border: '2px dashed var(--border)',
                textAlign: 'center', cursor: 'pointer', color: 'var(--text-muted)',
                fontSize: '0.85rem'
              }}>
              {file ? file.name : 'Click to select PDF, DOC, or TXT file'}
            </div>
            <input id="teacher-file-input" type="file" accept=".pdf,.txt,.md,.doc,.docx"
              onChange={e => { const f = e.target.files[0]; if (f) setFile(f) }} style={{ display: 'none' }} />
            <button onClick={handleUpload} disabled={uploadLoading || !title || !subject || !puc || !file}
              className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              {uploadLoading ? 'Uploading...' : 'Upload Note'}
            </button>
          </div>
        </motion.div>
      )}

      <h3 style={{ fontSize: '1rem', marginBottom: 12, color: 'var(--text-secondary)' }}>
        <FiBook size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
        My Uploaded Notes ({notes.length})
      </h3>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 150 }} />
      ) : notes.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
          No notes uploaded yet. Your notes will be available to all students in search.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notes.map(n => (
            <div key={n.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--accent-glow)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <FiFileText size={18} style={{ color: 'var(--accent)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{n.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span>{n.subject}</span>
                  <span>· PUC {n.puc}</span>
                  <span>· {n.file_type}</span>
                  <span>· {(n.file_size / 1024 / 1024).toFixed(1)} MB</span>
                  <span>· {n.download_count} downloads</span>
                </div>
              </div>
              <button onClick={() => window.open(n.file_url, '_blank')}
                style={{ padding: 8, color: 'var(--text-muted)' }}>
                <FiDownload size={16} />
              </button>
              <button onClick={() => handleDelete(n.id)}
                style={{ padding: 8, color: 'var(--text-muted)' }}>
                <FiTrash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
