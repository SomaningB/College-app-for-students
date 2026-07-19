import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { communitiesAPI } from '../services/api'
import { FiUsers, FiPlus, FiSearch, FiExternalLink, FiMessageSquare, FiTrash2, FiCheck, FiX, FiClock } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function Communities() {
  const { user } = useAuth()
  const [tab, setTab] = useState('mine')
  const [mine, setMine] = useState([])
  const [explore, setExplore] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const [memberInput, setMemberInput] = useState('')
  const [memberIds, setMemberIds] = useState([])
  const [search, setSearch] = useState('')
  const [pendingMembers, setPendingMembers] = useState({})
  const [showPending, setShowPending] = useState(null)

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

  const loadPending = async (communityId) => {
    try {
      const res = await communitiesAPI.getPending(communityId)
      setPendingMembers(prev => ({ ...prev, [communityId]: res.data }))
      setShowPending(communityId)
    } catch {}
  }

  const handleApprove = async (communityId, userId) => {
    try {
      await communitiesAPI.approveMember(communityId, userId)
      toast.success('Member approved')
      loadPending(communityId)
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to approve')
    }
  }

  const handleReject = async (communityId, userId) => {
    try {
      await communitiesAPI.rejectMember(communityId, userId)
      toast.success('Member rejected')
      loadPending(communityId)
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reject')
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const data = { ...createForm }
      if (memberIds.length > 0) data.member_ids = memberIds
      await communitiesAPI.create(data)
      toast.success('Community created!')
      setShowCreate(false)
      setCreateForm({ name: '', description: '' })
      setMemberInput('')
      setMemberIds([])
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create')
    }
  }

  const handleJoin = async (id) => {
    try {
      const res = await communitiesAPI.join(id)
      toast.success(res.data?.message || 'Join request sent!')
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to join')
    }
  }

  const addMemberId = () => {
    const id = memberInput.trim().toUpperCase()
    if (!id) return
    if (memberIds.includes(id)) { toast.error('Already added'); return }
    setMemberIds(prev => [...prev, id])
    setMemberInput('')
  }

  const removeMemberId = (id) => {
    setMemberIds(prev => prev.filter(x => x !== id))
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this community and all its messages? This cannot be undone.')) return
    try {
      await communitiesAPI.delete(id)
      toast.success('Community deleted')
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete')
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
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 500 }}>
            <input type="text" value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Community name" className="input-field" required />
            <input type="text" value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Description (optional)" className="input-field" />
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, padding: '8px 12px', background: 'var(--accent-glow)', borderRadius: 8 }}>
              <strong>Requirement:</strong> At least 5 members (including you) are needed to start a community.
              Added: {memberIds.length + 1} / 5 members
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Add members by Student ID:</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={memberInput} onChange={e => setMemberInput(e.target.value.toUpperCase())}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMemberId() } }}
                  placeholder="Enter student ID (e.g. STU00123)" className="input-field" style={{ flex: 1 }} />
                <button type="button" onClick={addMemberId} className="btn" style={{ padding: '10px 16px', flexShrink: 0 }}>Add</button>
              </div>
              {memberIds.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {memberIds.map(id => (
                    <span key={id} style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: '0.8rem',
                      background: 'var(--accent-glow)', color: 'var(--accent)',
                      display: 'flex', alignItems: 'center', gap: 6
                    }}>
                      {id}
                      <button type="button" onClick={() => removeMemberId(id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: 0, fontSize: '0.8rem' }}>x</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
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
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {c.member_count} members · created by {c.created_by_name}
                    {c.created_by === user?.id && c.pending_count > 0 && (
                      <span onClick={() => loadPending(c.id)} style={{ color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FiClock size={12} /> {c.pending_count} pending
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {c.created_by === user?.id && (
                    <>
                      {c.pending_count > 0 && (
                        <button onClick={() => loadPending(c.id)}
                          className="btn" style={{ color: 'var(--accent)', padding: '8px 12px', fontSize: '0.8rem', border: '1px solid var(--border)' }}>
                          <FiClock size={14} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(c.id)}
                        className="btn" style={{ color: 'var(--error)', padding: '8px 12px', fontSize: '0.8rem', border: '1px solid var(--border)' }}>
                        <FiTrash2 size={14} />
                      </button>
                    </>
                  )}
                  <Link to={`/app/communities/${c.id}`} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                    <FiMessageSquare size={14} /> Chat
                  </Link>
                </div>
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
                   {c.has_pending ? (
                     <button className="btn" disabled style={{ padding: '8px 16px', fontSize: '0.8rem', opacity: 0.6 }}>
                       <FiClock size={14} /> Requested
                     </button>
                   ) : (
                     <button onClick={() => handleJoin(c.id)} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                       <FiExternalLink size={14} /> Join
                     </button>
                   )}
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
      {showPending && pendingMembers[showPending] && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="card" style={{ padding: 20, marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '1rem' }}>Pending Join Requests</h3>
              <button onClick={() => setShowPending(null)} className="btn-ghost" style={{ padding: '4px 8px' }}><FiX size={16} /></button>
            </div>
            {pendingMembers[showPending].length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No pending requests</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendingMembers[showPending].map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: 'var(--bg-secondary)' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{m.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{m.unique_id}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleApprove(showPending, m.id)} className="btn" style={{ color: 'var(--success, #22c55e)', padding: '6px 12px', fontSize: '0.8rem', border: '1px solid var(--border)' }}>
                        <FiCheck size={14} /> Approve
                      </button>
                      <button onClick={() => handleReject(showPending, m.id)} className="btn" style={{ color: 'var(--error)', padding: '6px 12px', fontSize: '0.8rem', border: '1px solid var(--border)' }}>
                        <FiX size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
