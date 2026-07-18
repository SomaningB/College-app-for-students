import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { adminAPI, streamsAPI, materialsAPI } from '../services/api'
import toast from 'react-hot-toast'
import { FiUpload, FiTrash2, FiFile, FiCheck, FiX } from 'react-icons/fi'

export default function AdminMaterials() {
  const [streams, setStreams] = useState({})
  const [materials, setMaterials] = useState([])
  const [pending, setPending] = useState([])
  const [tab, setTab] = useState('upload')

  const [title, setTitle] = useState('')
  const [stream, setStream] = useState('')
  const [puc, setPuc] = useState('')
  const [subject, setSubject] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    streamsAPI.getAll().then(res => setStreams(res.data)).catch(() => {})
    loadData()
  }, [])

  const loadData = () => {
    adminAPI.getMaterials().then(res => setMaterials(res.data)).catch(() => {})
    materialsAPI.getPending().then(res => setPending(res.data)).catch(() => {})
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!title || !stream || !puc || !subject || !file) {
      toast.error('Please fill in all fields')
      return
    }
    setUploading(true)
    const fd = new FormData()
    fd.append('title', title)
    fd.append('stream', stream)
    fd.append('puc', puc)
    fd.append('subject', subject)
    fd.append('file', file)
    try {
      await adminAPI.uploadMaterial(fd)
      toast.success('Material uploaded')
      setTitle(''); setStream(''); setPuc(''); setSubject(''); setFile(null)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this material?')) return
    try {
      await adminAPI.deleteMaterial(id)
      toast.success('Deleted')
      loadData()
    } catch { toast.error('Delete failed') }
  }

  const handleApprove = async (id) => {
    try {
      await materialsAPI.approve(id)
      toast.success('Approved')
      loadData()
    } catch { toast.error('Failed') }
  }

  const handleReject = async (id) => {
    try {
      await materialsAPI.reject(id)
      toast.success('Rejected')
      loadData()
    } catch { toast.error('Failed') }
  }

  const streamKeys = Object.keys(streams).filter(k => k !== '_languages')
  const streamSubjects = stream ? (() => {
    const s = streams[stream]
    if (!s) return []
    if (s.combinations) return [...new Set(Object.values(s.combinations).flat())]
    if (s.subjects) return s.subjects
    if (s.sectors) return s.sectors
    return []
  })() : []

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Study Materials</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['upload', 'pending', 'all'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)',
              background: tab === t ? 'var(--accent)' : 'var(--bg-secondary)',
              color: tab === t ? 'white' : 'var(--text-primary)', fontWeight: 500,
              cursor: 'pointer', fontSize: '0.85rem'
            }}
          >{t === 'upload' ? 'Upload New' : t === 'pending' ? `Pending (${pending.length})` : 'All Materials'}</button>
        ))}
      </div>

      {tab === 'upload' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card" style={{ padding: 32 }}>
          <h2 style={{ marginBottom: 20, fontSize: '1.1rem' }}>Upload Study Material</h2>
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 500 }}>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input-field" placeholder="Title (e.g. Chapter 1 - Motion)" required />

            <div style={{ display: 'flex', gap: 12 }}>
              <select value={stream} onChange={e => { setStream(e.target.value); setSubject('') }} className="input-field" style={{ flex: 1 }} required>
                <option value="">Select Stream</option>
                {streamKeys.map(k => <option key={k} value={k}>{streams[k]?.label || k}</option>)}
              </select>
              <select value={puc} onChange={e => setPuc(e.target.value)} className="input-field" style={{ flex: 1 }} required>
                <option value="">PUC Year</option>
                <option value="1st">1st PUC</option>
                <option value="2nd">2nd PUC</option>
              </select>
            </div>

            <select value={subject} onChange={e => setSubject(e.target.value)} className="input-field" required>
              <option value="">Select Subject</option>
              {streamSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <div style={{
              border: '2px dashed var(--border)', borderRadius: 12, padding: 32,
              textAlign: 'center', cursor: 'pointer', color: 'var(--text-muted)'
            }} onClick={() => document.getElementById('fileInput').click()}>
              <FiUpload size={24} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: '0.85rem' }}>{file ? file.name : 'Click to upload PDF, DOC, TXT, or MD'}</div>
              <input id="fileInput" type="file" hidden onChange={e => setFile(e.target.files[0])} accept=".pdf,.doc,.docx,.txt,.md" />
            </div>

            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              type="submit" disabled={uploading} className="btn btn-primary"
              style={{ justifyContent: 'center', padding: 14 }}>
              {uploading ? 'Uploading...' : <><FiUpload size={18} /> Upload Material</>}
            </motion.button>
          </form>
        </motion.div>
      )}

      {tab === 'pending' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {pending.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No pending materials</div>
          ) : (
            pending.map(m => (
              <div key={m.id} className="card" style={{ padding: 16, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{m.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.subject} - {m.stream} by {m.contributor_name}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleApprove(m.id)} className="btn" style={{ background: 'var(--success)', color: 'white', padding: '8px 16px' }}><FiCheck /></button>
                  <button onClick={() => handleReject(m.id)} className="btn" style={{ background: 'var(--error)', color: 'white', padding: '8px 16px' }}><FiX /></button>
                </div>
              </div>
            ))
          )}
        </motion.div>
      )}

      {tab === 'all' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {materials.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No materials uploaded yet</div>
          ) : (
            materials.map(m => (
              <div key={m.id} className="card" style={{ padding: 16, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                    <FiFile />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{m.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {m.subject} - {m.stream} {m.puc && `(${m.puc} PUC)`} - {m.download_count} downloads
                      <span style={{
                        marginLeft: 8, padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem',
                        background: m.status === 'approved' ? 'var(--success)' : m.status === 'pending' ? 'var(--warning)' : 'var(--error)',
                        color: 'white'
                      }}>{m.status}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDelete(m.id)} className="btn" style={{ color: 'var(--error)', padding: '8px 12px' }}><FiTrash2 /></button>
              </div>
            ))
          )}
        </motion.div>
      )}
    </div>
  )
}