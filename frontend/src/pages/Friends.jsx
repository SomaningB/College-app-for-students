import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { friendsAPI } from '../services/api'
import { FiUserPlus, FiUserCheck, FiMessageSquare, FiClock, FiSearch } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function Friends() {
  const [tab, setTab] = useState('friends')
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [sent, setSent] = useState([])
  const [search, setSearch] = useState('')
  const [addId, setAddId] = useState('')

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    try {
      const [fRes, rRes, sRes] = await Promise.all([
        friendsAPI.getList(),
        friendsAPI.getRequests(),
        friendsAPI.getSent()
      ])
      setFriends(fRes.data)
      setRequests(rRes.data)
      setSent(sRes.data)
    } catch {}
  }

  const handleRespond = async (id, action) => {
    try {
      await friendsAPI.respond(id, action)
      toast.success(action === 'accept' ? 'Friend request accepted!' : 'Request rejected')
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed')
    }
  }

  const handleSendRequest = async () => {
    if (!addId.trim()) return
    try {
      await friendsAPI.sendRequest(addId.trim())
      toast.success('Request sent!')
      setAddId('')
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed')
    }
  }

  const filteredFriends = friends.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="perspective-container">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <h1 className="text-3d" style={{ fontSize: '1.6rem', marginBottom: 4 }}>Friends</h1>
        <p style={{ color: 'var(--text-muted)' }}>Connect with classmates</p>
      </motion.div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 12, flexWrap: 'wrap' }}>
        {[
          { key: 'friends', label: `Friends (${friends.length})` },
          { key: 'requests', label: `Requests (${requests.length})` },
          { key: 'sent', label: `Sent (${sent.length})` },
          { key: 'add', label: 'Add Friend' }
        ].map(({ key, label }) => (
          <motion.button
            key={key}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTab(key)}
            className="btn-3d"
            style={{
              padding: '8px 16px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 500,
              background: tab === key ? 'var(--accent)' : 'var(--bg-card)',
              color: tab === key ? 'white' : 'var(--text-secondary)',
              border: tab === key ? 'none' : '1px solid var(--border)',
              transition: 'all 0.2s'
            }}
          >
            {label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'add' && (
          <motion.div
            key="add"
            initial={{ opacity: 0, y: 10, rotateX: -10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card card-3d modal-3d"
            style={{ padding: 24, maxWidth: 400 }}
          >
            <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>Add by Unique ID</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              Enter your friend's 6-digit unique ID
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" value={addId} onChange={e => setAddId(e.target.value)}
                placeholder="482910" maxLength={6}
                className="input-field" style={{ textAlign: 'center', letterSpacing: 3, fontSize: '1.1rem', fontWeight: 600 }} />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendRequest}
                className="btn btn-primary btn-3d"
              >
                <FiUserPlus /> Send
              </motion.button>
            </div>
          </motion.div>
        )}

        {tab === 'friends' && (
          <motion.div key="friends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <FiSearch size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search friends..." className="input-field" style={{ paddingLeft: 36 }} />
            </div>
            {filteredFriends.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <FiUserCheck size={40} style={{ marginBottom: 8, opacity: 0.3 }} />
                <p>No friends yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredFriends.map(friend => (
                  <motion.div
                    key={friend.id}
                    initial={{ opacity: 0, y: 10, rotateX: -5 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    whileHover={{ y: -4, rotateX: 2, scale: 1.01 }}
                    className="card card-3d hover-lift-3d"
                    style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 600 }}>
                        {friend.name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{friend.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{friend.unique_id} · {friend.stream}</div>
                      </div>
                    </div>
                    <Link to={`/chat/${friend.unique_id}`} className="btn btn-ghost btn-3d" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                      <FiMessageSquare size={14} /> Chat
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'requests' && (
          <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {requests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <FiClock size={40} style={{ marginBottom: 8, opacity: 0.3 }} />
                <p>No pending requests</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {requests.map(req => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 10, rotateX: -5 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    whileHover={{ y: -4, rotateX: 2, scale: 1.01 }}
                    className="card card-3d hover-lift-3d"
                    style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 600 }}>
                        {req.from_user_name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{req.from_user_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{req.from_unique_id}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRespond(req.id, 'accept')}
                        className="btn btn-primary btn-3d"
                        style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                      >
                        <FiUserCheck size={14} /> Accept
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRespond(req.id, 'reject')}
                        className="btn btn-ghost btn-3d"
                        style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                      >
                        Reject
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'sent' && (
          <motion.div key="sent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {sent.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <FiUserPlus size={40} style={{ marginBottom: 8, opacity: 0.3 }} />
                <p>No sent requests</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sent.map(req => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 10, rotateX: -5 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    whileHover={{ y: -4, rotateX: 2 }}
                    className="card card-3d hover-lift-3d"
                    style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 600 }}>
                      {req.to_user_name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{req.to_user_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{req.to_unique_id} · Pending</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
