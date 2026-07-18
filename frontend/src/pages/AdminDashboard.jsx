import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { adminAPI } from '../services/api'
import { FiUsers, FiFile, FiClock, FiGrid, FiUserPlus, FiBook } from 'react-icons/fi'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    adminAPI.stats().then(res => setStats(res.data)).catch(() => {})
  }, [])

  const cards = [
    { label: 'Total Students', value: stats?.total_users ?? '...', icon: FiUsers, color: '#6c63ff' },
    { label: 'Total Teachers', value: stats?.total_teachers ?? '...', icon: FiUserPlus, color: '#818cf8' },
    { label: 'Approved Materials', value: stats?.total_materials ?? '...', icon: FiFile, color: '#00c853' },
    { label: 'Pending Reviews', value: stats?.pending_materials ?? '...', icon: FiClock, color: '#ff9100' },
    { label: 'Communities', value: stats?.total_communities ?? '...', icon: FiGrid, color: '#e040fb' },
  ]

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>Admin Dashboard</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: '0.9rem' }}>Manage students, materials, and more</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card"
            style={{ padding: 24 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `${card.color}20`, color: card.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
              }}>
                <card.icon />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{card.value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{card.label}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="card" style={{ padding: 32, textAlign: 'center' }}>
        <h2 style={{ marginBottom: 8 }}>Welcome, Admin</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto' }}>
          Use the sidebar to upload study materials, manage students, and review pending submissions.
        </p>
      </div>
    </div>
  )
}