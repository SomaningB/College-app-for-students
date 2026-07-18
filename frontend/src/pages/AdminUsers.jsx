import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { adminAPI } from '../services/api'
import toast from 'react-hot-toast'
import { FiTrash2, FiUser, FiSearch } from 'react-icons/fi'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    adminAPI.getUsers().then(res => setUsers(res.data)).catch(() => {})
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this user? This cannot be undone.')) return
    try {
      await adminAPI.deleteUser(id)
      setUsers(prev => prev.filter(u => u.id !== id))
      toast.success('User deleted')
    } catch { toast.error('Failed to delete') }
  }

  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.unique_id.includes(search)
  )

  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>Manage Students</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.9rem' }}>{users.length} registered students</p>

      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 24 }}>
        <FiSearch size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          className="input-field" style={{ paddingLeft: 40 }} placeholder="Search by name, email, or ID..." />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((u, i) => (
          <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                <FiUser />
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{u.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {u.email} • @{u.unique_id} • {u.stream || 'No stream'}
                  {u.email_verified ? <span style={{ color: 'var(--success)', marginLeft: 8 }}>Verified</span> : <span style={{ color: 'var(--error)', marginLeft: 8 }}>Unverified</span>}
                </div>
              </div>
            </div>
            <button onClick={() => handleDelete(u.id)} className="btn" style={{ color: 'var(--error)', padding: '8px 12px' }}><FiTrash2 size={16} /></button>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No users found</div>
        )}
      </div>
    </div>
  )
}