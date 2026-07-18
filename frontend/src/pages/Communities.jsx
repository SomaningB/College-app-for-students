import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { communitiesAPI } from '../services/api'
import { FiUsers, FiPlus, FiSearch, FiExternalLink, FiMessageSquare } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function Communities() {
  const [tab, setTab] = useState('mine')
  const [mine, setMine] = useState([])
  const [explore, setExplore] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const [search, setSearch] = useState('')

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      const [mRes, eRes] = await Promise.all([
        communitiesAPI.getMine(),
        communitiesAPI.explore()
      ])
      setMine(mRes.data)
      setExplore(eRes.data)
    } catch {}
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await communitiesAPI.create(createForm)
      toast.success('Community created!')
      setShowCreate(false)
      setCreateForm({ name: '', description: '' })
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create')
    }
  }

  const handleJoin = async (id) => {
    try {
      await communitiesAPI.join(id)
      toast.success('Joined community!')
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to join')
    }
  }

  const filteredExplore = explore.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Communities</h1>
            <p style={{ color: 'var(--text-muted)' }}>Chat with groups of students</p>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreate(true)} className="btn btn-primary">
            <FiPlus /> Create Community
          </motion.button>
        </div>
      </motion.div>

      {showCreate && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="card" style={{ padding: 24, marginBottom: 24, overflow: 'hidden' }}>
          <h3 style={{ marginBottom: 16 }}>Create Community</h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
            <input type="text" value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Community name" className="input-field" required />
            <input type="text" value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Description (optional)" className="input-field" />
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              <FiUsers /> Create
            </button>
          </form>
        </motion.div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        <button onClick={() => setTab('mine')}
          style={{
            padding: '8px 16px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 500,
            background: tab === 'mine' ? 'var(--accent)' : 'var(--bg-card)',
            color: tab === 'mine' ? 'white' : 'var(--text-secondary)',
            border: tab === 'mine' ? 'none' : '1px solid var(--border)'
          }}>
          My Communities ({mine.length})
        </button>
        <button onClick={() => setTab('explore')}
          style={{
            padding: '8px 16px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 500,
            background: tab === 'explore' ? 'var(--accent)' : 'var(--bg-card)',
            color: tab === 'explore' ? 'white' : 'var(--text-secondary)',
            border: tab === 'explore' ? 'none' : '1px solid var(--border)'
          }}>
          Explore ({explore.length})
        </button>
      </div>

      {tab === 'mine' ? (
        mine.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <FiUsers size={40} style={{ marginBottom: 8, opacity: 0.3 }} />
            <p>No communities yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mine.map(c => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{c.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {c.member_count} members · created by {c.created_by_name}
                  </div>
                </div>
                <Link to={`/communities/${c.id}`} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                  <FiMessageSquare size={14} /> Chat
                </Link>
              </motion.div>
            ))}
          </div>
        )
      ) : (
        <>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <FiSearch size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search communities..." className="input-field" style={{ paddingLeft: 36 }} />
          </div>
          {filteredExplore.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <FiSearch size={40} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p>No communities found</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredExplore.map(c => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{c.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {c.member_count} members · by {c.created_by_name}
                    </div>
                    {c.description && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{c.description}</div>
                    )}
                  </div>
                  <button onClick={() => handleJoin(c.id)} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                    <FiExternalLink size={14} /> Join
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
