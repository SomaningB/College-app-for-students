import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { communitiesAPI } from '../services/api'
import chatWS from '../services/websocket'
import { FiSend, FiArrowLeft, FiUsers } from 'react-icons/fi'

export default function CommunityChat() {
  const { id } = useParams()
  const { user } = useAuth()
  const [community, setCommunity] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [members, setMembers] = useState([])
  const [showMembers, setShowMembers] = useState(false)
  const [typingUsers, setTypingUsers] = useState([])
  const messagesEndRef = useRef(null)
  const typingTimeout = useRef(null)

  useEffect(() => {
    loadCommunity()
    loadMembers()
  }, [id])

  useEffect(() => {
    if (!id) return
    chatWS.requestHistory('community', id)

    const unsub = chatWS.on('history', (data) => {
      setMessages(data || [])
    })

    const unsubMsg = chatWS.on('new_message', (data) => {
      if (data.chat_type === 'community' && data.chat_id === id) {
        setMessages(prev => [...prev, data])
      }
    })

    const unsubTyping = chatWS.on('typing', (data) => {
      if (data.chat_type === 'community' && data.chat_id === id && data.user_id !== user.id) {
        setTypingUsers(prev => {
          const filtered = prev.filter(u => u.user_id !== data.user_id)
          return [...filtered, { user_id: data.user_id, user_name: data.user_name }]
        })
        clearTimeout(typingTimeout.current)
        typingTimeout.current = setTimeout(() => setTypingUsers([]), 2000)
      }
    })

    return () => { unsub(); unsubMsg(); unsubTyping(); clearTimeout(typingTimeout.current) }
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadCommunity = async () => {
    try {
      const res = await communitiesAPI.getMine()
      const found = res.data.find(c => c.id === id)
      if (found) setCommunity(found)
    } catch {}
  }

  const loadMembers = async () => {
    try {
      const res = await communitiesAPI.getMembers(id)
      setMembers(res.data)
    } catch {}
  }

  const handleSend = () => {
    if (!input.trim() || !id) return
    chatWS.sendCommunityMessage(id, input.trim())
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 48px)', margin: -24 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to="/communities" style={{ color: 'var(--text-muted)', display: 'flex' }}>
              <FiArrowLeft size={18} />
            </Link>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{community?.name || 'Community'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{community?.member_count || 0} members</div>
            </div>
          </div>
          <button onClick={() => setShowMembers(!showMembers)} className="btn-ghost" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
            <FiUsers size={16} /> Members
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 20 }} className="scrollbar-custom" ref={messagesEndRef}>
          {messages.map((msg, i) => {
            const isMine = msg.sender_id === user.id
            return (
              <motion.div
                key={msg.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  justifyContent: isMine ? 'flex-end' : 'flex-start',
                  marginBottom: 12
                }}
              >
                <div style={{ maxWidth: '70%' }}>
                  {!isMine && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 500, marginBottom: 2, marginLeft: 4 }}>
                      {msg.sender_name}
                    </div>
                  )}
                  <div style={{
                    padding: '10px 16px',
                    borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isMine ? 'var(--accent)' : 'var(--bg-card)',
                    color: isMine ? 'white' : 'var(--text-primary)',
                    border: isMine ? 'none' : '1px solid var(--border)',
                    wordBreak: 'break-word'
                  }}>
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            )
          })}
          {typingUsers.length > 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '4px 0' }}>
              {typingUsers.map(u => u.user_name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <input type="text" value={input} onChange={e => { setInput(e.target.value); chatWS.sendTyping('community', id) }}
              onKeyDown={handleKeyDown} placeholder="Type a message..."
              className="input-field"
              style={{ flex: 1, padding: '12px 16px', borderRadius: 24, fontSize: '0.9rem' }} />
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleSend} disabled={!input.trim()}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: input.trim() ? 'var(--accent)' : 'var(--border)',
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', flexShrink: 0
              }}>
              <FiSend size={18} />
            </motion.button>
          </div>
        </div>
      </div>

      {showMembers && (
        <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
          style={{ borderLeft: '1px solid var(--border)', background: 'var(--bg-secondary)', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '0.9rem' }}>Members ({members.length})</h3>
          </div>
          <div style={{ padding: 8 }}>
            {members.map(m => (
              <div key={m.id} style={{ padding: '8px 8px', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 600, fontSize: '0.8rem' }}>
                  {m.name[0]}
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{m.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>@{m.unique_id}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
