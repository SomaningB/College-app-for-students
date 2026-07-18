import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { materialsAPI } from '../services/api'
import { FiUser, FiMail, FiHash, FiBook, FiBookOpen, FiAward, FiUpload, FiCheck, FiClock } from 'react-icons/fi'

export default function Profile() {
  const { user } = useAuth()
  const [contributors, setContributors] = useState([])
  const [stats, setStats] = useState({ totalNotes: 0, contributed: 0 })

  useEffect(() => {
    materialsAPI.get({ status: 'approved' }).then(res => {
      const all = res.data
      setStats({
        totalNotes: all.length,
        contributed: all.filter(m => m.contributed_by === user?.id).length
      })
    }).catch(() => {})
    materialsAPI.getContributors().then(res => setContributors(res.data)).catch(() => {})
  }, [])

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="card" style={{ padding: 32, textAlign: 'center', marginBottom: 24 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--gradient-1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 28, fontWeight: 700, color: 'white'
            }}>
            {user?.name?.[0]?.toUpperCase()}
          </motion.div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 4 }}>{user?.name}</h1>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiHash size={14} /> @{user?.unique_id}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiMail size={14} /> {user?.email}
            </span>
          </div>
          {user?.contributor_badge && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 16px', borderRadius: 20,
              background: 'rgba(34, 197, 94, 0.15)',
              color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600
            }}>
              <FiAward size={16} /> Top Contributor
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          <motion.div whileHover={{ y: -4 }} className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>{stats.totalNotes}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Notes Available</div>
          </motion.div>
          <motion.div whileHover={{ y: -4 }} className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--success)', marginBottom: 4 }}>{stats.contributed}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Your Contributions</div>
          </motion.div>
          <motion.div whileHover={{ y: -4 }} className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--warning)', marginBottom: 4 }}>{user?.subjects?.length || 0}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Your Subjects</div>
          </motion.div>
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiBook size={16} /> Core Subjects
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {user?.subjects?.map(s => (
              <span key={s} style={{
                padding: '8px 18px', borderRadius: 20,
                background: 'var(--accent-glow)', color: 'var(--accent)',
                border: '1px solid var(--accent)', fontSize: '0.85rem', fontWeight: 500
              }}>
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiBookOpen size={16} /> Languages
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {user?.languages?.length > 0 ? user?.languages?.map(l => (
              <span key={l} style={{
                padding: '8px 18px', borderRadius: 20,
                background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)',
                border: '1px solid var(--accent)', fontSize: '0.85rem', fontWeight: 500
              }}>
                {l}
              </span>
            )) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No languages selected</span>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiAward size={16} /> Top Contributors
          </h3>
          {contributors.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No contributors yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {contributors.map((c, i) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 600, fontSize: '0.8rem' }}>
                    {c.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{c.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{c.unique_id}</div>
                  </div>
                  {i < 3 && (
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--warning)' }}>
                      #{i + 1}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
