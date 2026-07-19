import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { adminAPI } from '../services/api'
import { FiTrash2, FiMessageSquare, FiUser, FiClock } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadFeedback() }, [])

  const loadFeedback = async () => {
    try { const res = await adminAPI.getFeedback(); setFeedbacks(res.data) }
    catch { toast.error('Failed to load feedback') }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this feedback?')) return
    try { await adminAPI.deleteFeedback(id); setFeedbacks(prev => prev.filter(f => f.id !== id)); toast.success('Deleted') }
    catch { toast.error('Delete failed') }
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>User Feedback</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{feedbacks.length} total feedback entries</p>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }} />
      ) : feedbacks.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <FiMessageSquare size={40} style={{ marginBottom: 8, opacity: 0.3 }} />
          <p>No feedback yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {feedbacks.map((f, i) => (
            <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="card" style={{ padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-glow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0
              }}><FiUser size={16} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{f.user_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FiClock size={12} /> {new Date(f.created_at).toLocaleString()} · @{f.user_unique_id}
                  </div>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{f.message}</div>
              </div>
              <button onClick={() => handleDelete(f.id)} style={{ padding: 8, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                <FiTrash2 size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
