import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { adminAPI } from '../services/api'
import { FiAward, FiCpu, FiDownload, FiMessageSquare, FiUsers, FiSearch } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function Leaderboard() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStream, setFilterStream] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const res = await adminAPI.getLeaderboard()
      setData(res.data)
    } catch { toast.error('Failed to load leaderboard') }
    finally { setLoading(false) }
  }

  const streams = [...new Set(data.map(d => d.stream).filter(Boolean))]

  const filtered = data.filter(d => {
    if (filterStream && d.stream !== filterStream) return false
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.unique_id.includes(search)) return false
    return true
  })

  const getRankColor = (rank) => {
    if (rank === 1) return '#ffd700'
    if (rank === 2) return '#c0c0c0'
    if (rank === 3) return '#cd7f32'
    return 'var(--text-muted)'
  }

  const getMedal = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Leaderboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Top performing students based on contributions & engagement</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 400 }}>
          <FiSearch size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            className="input-field" style={{ paddingLeft: 36 }} placeholder="Search by name or ID..." />
        </div>
        <select value={filterStream} onChange={e => setFilterStream(e.target.value)} className="input-field" style={{ width: 160 }}>
          <option value="">All Streams</option>
          {streams.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }} />
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <FiAward size={40} style={{ marginBottom: 8, opacity: 0.3 }} />
          <p>No data yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="card" style={{
                padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
                border: d.unique_id === user?.unique_id ? '1px solid var(--accent)' : '1px solid var(--border)',
                background: d.unique_id === user?.unique_id ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-card)'
              }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: d.rank <= 3 ? '1.3rem' : '0.9rem',
                background: d.rank <= 3 ? `${getRankColor(d.rank)}20` : 'var(--bg-secondary)',
                color: getRankColor(d.rank), flexShrink: 0
              }}>
                {getMedal(d.rank)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {d.name}
                  {d.unique_id === user?.unique_id && <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 10, background: 'var(--accent)', color: 'white' }}>You</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{d.unique_id} · {d.stream || 'N/A'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center', padding: '4px 10px', borderRadius: 8, background: 'var(--accent-glow)', minWidth: 50 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)' }}>{d.score}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Score</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: 20, marginTop: 24 }}>
        <h3 style={{ fontSize: '1rem', marginBottom: 12 }}>Scoring Guide</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <div><FiCpu size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Materials: 10 pts each</div>
          <div><FiDownload size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Downloads: 2 pts each</div>
          <div><FiMessageSquare size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Messages: 1 pt each</div>
          <div><FiUsers size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Communities: 5 pts each</div>
        </div>
      </div>
    </div>
  )
}
