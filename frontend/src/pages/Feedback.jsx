import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { feedbackAPI } from '../services/api'
import { FiSend, FiClock, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function Feedback() {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadHistory() }, [])

  const loadHistory = async () => {
    try { const res = await feedbackAPI.getMine(); setHistory(res.data) }
    catch {} finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!message.trim() || message.trim().length < 10) {
      toast.error('Feedback must be at least 10 characters')
      return
    }
    setSending(true)
    try {
      await feedbackAPI.submit(message.trim())
      toast.success('Feedback sent! Thank you.')
      setMessage('')
      loadHistory()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to send') }
    finally { setSending(false) }
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Feedback</h1>
        <p style={{ color: 'var(--text-muted)' }}>Share your thoughts with the admin & developer</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="card" style={{ padding: 24, marginBottom: 32 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea value={message} onChange={e => setMessage(e.target.value)}
            placeholder="Tell us what you think... feature requests, bug reports, suggestions, or anything else!"
            className="input-field" style={{ minHeight: 140, resize: 'vertical', padding: 16, lineHeight: 1.6 }}
            maxLength={2000} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{message.length}/2000</span>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              type="submit" disabled={sending || message.trim().length < 10}
              className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiSend size={16} /> {sending ? 'Sending...' : 'Send Feedback'}
            </motion.button>
          </div>
        </form>
      </motion.div>

      <div>
        <h3 style={{ fontSize: '1rem', marginBottom: 16, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiClock size={16} /> Your Previous Feedback
        </h3>
        {loading ? (
          <div className="loading-screen" style={{ minHeight: 100 }} />
        ) : history.length === 0 ? (
          <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
            No feedback submitted yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((f, i) => (
              <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 8, whiteSpace: 'pre-wrap' }}>{f.message}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiCheck size={12} /> Sent {new Date(f.created_at).toLocaleDateString()}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
