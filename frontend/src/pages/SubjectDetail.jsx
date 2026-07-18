import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { materialsAPI } from '../services/api'
import { FiFileText, FiDownload, FiUpload, FiArrowLeft, FiSearch, FiCheck, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

export default function SubjectDetail() {
  const { subject } = useParams()
  const { user } = useAuth()
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', file: null })
  const [uploading, setUploading] = useState(false)

  const isAdmin = user?.role === 'admin'
  const canAccess = isAdmin || user?.subjects?.includes(subject)

  useEffect(() => {
    if (!canAccess) { setLoading(false); return }
    loadMaterials()
  }, [subject])

  const loadMaterials = async () => {
    try {
      const res = await materialsAPI.get({
        subject,
        stream: user?.stream,
        status: 'approved'
      })
      setMaterials(res.data)
    } catch {} finally { setLoading(false) }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!uploadForm.file) return toast.error('Please select a file')
    if (!['.pdf', '.txt', '.md'].includes(uploadForm.file.name.slice(-4).toLowerCase())) {
      return toast.error('Only PDF, TXT, MD files allowed')
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('title', uploadForm.title)
      fd.append('subject', subject)
      fd.append('stream', user?.stream)
      fd.append('puc', user?.puc || '')
      fd.append('description', uploadForm.description)
      fd.append('file', uploadForm.file)
      await materialsAPI.contribute(fd)
      toast.success('Note submitted for approval!')
      setShowUpload(false)
      setUploadForm({ title: '', description: '', file: null })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally { setUploading(false) }
  }

  const filtered = materials.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase())
  )

  if (!canAccess) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <h2 style={{ marginBottom: 12 }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
          This subject is not in your registered curriculum. You can only access materials for your selected subjects.
        </p>
        <Link to="/dashboard">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn btn-primary">
            <FiArrowLeft /> Back to Dashboard
          </motion.button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
          <FiArrowLeft size={14} /> Back to Dashboard
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: '1.6rem' }}>{subject}</h1>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowUpload(true)} className="btn btn-primary">
            <FiUpload /> Contribute Notes
          </motion.button>
        </div>
      </motion.div>

      <div style={{ position: 'relative', marginBottom: 24 }}>
        <FiSearch size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search notes..." className="input-field" style={{ paddingLeft: 36 }} />
      </div>

      <AnimatePresence>
        {showUpload && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="card" style={{ padding: 24, marginBottom: 24, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1rem' }}>Contribute a Note</h3>
              <button onClick={() => setShowUpload(false)} className="btn-ghost" style={{ padding: 6, borderRadius: 8 }}>
                <FiX size={18} />
              </button>
            </div>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="text" value={uploadForm.title} onChange={e => setUploadForm(p => ({ ...p, title: e.target.value }))}
                className="input-field" placeholder="Note title" required />
              <input type="text" value={uploadForm.description} onChange={e => setUploadForm(p => ({ ...p, description: e.target.value }))}
                className="input-field" placeholder="Short description" />
              <div style={{
                border: '2px dashed var(--border)', borderRadius: 12, padding: 24,
                textAlign: 'center', cursor: 'pointer',
                background: uploadForm.file ? 'var(--accent-glow)' : 'transparent',
                borderColor: uploadForm.file ? 'var(--accent)' : 'var(--border)'
              }}
                onClick={() => document.getElementById('file-input').click()}
              >
                <input id="file-input" type="file" accept=".pdf,.txt,.md"
                  onChange={e => setUploadForm(p => ({ ...p, file: e.target.files[0] }))}
                  style={{ display: 'none' }} />
                {uploadForm.file ? (
                  <div style={{ color: 'var(--accent)' }}>
                    <FiCheck size={24} style={{ marginBottom: 4 }} />
                    <div>{uploadForm.file.name}</div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)' }}>
                    <FiUpload size={24} style={{ marginBottom: 4 }} />
                    <div>Drop PDF/TXT/MD file here or click to browse</div>
                  </div>
                )}
              </div>
              <button type="submit" disabled={uploading} className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>
                {uploading ? 'Uploading...' : 'Submit for Approval'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 80 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <FiFileText size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p>No notes found. Be the first to contribute!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(mat => (
            <motion.div
              key={mat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ x: 4 }}
              className="card"
              style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}
              onClick={() => window.open(mat.file_url, '_blank')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FiFileText size={18} color="var(--accent)" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 500, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {mat.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
                    {mat.contributor_name && <span>by {mat.contributor_name}</span>}
                    <span>{mat.download_count} downloads</span>
                    <span>{mat.file_type}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={(e) => { e.stopPropagation(); window.open(mat.file_url, '_blank') }}
                  className="btn-ghost" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                  <FiDownload size={14} /> Download
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
