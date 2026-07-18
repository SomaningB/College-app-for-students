import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { friendsAPI, authAPI } from '../services/api'
import chatWS from '../services/websocket'
import { FiSend, FiMessageSquare, FiUser, FiSearch, FiPlus, FiMessageCircle } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function Chat() {
  const { uniqueId } = useParams()
  const { user } = useAuth()
  const [friends, setFriends] = useState([])
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [addId, setAddId] = useState('')
  const [typingUser, setTypingUser] = useState(null)
  const messagesEndRef = useRef(null)
  const typingTimeout = useRef(null)

  useEffect(() => {
    loadFriends()
  }, [])

  useEffect(() => {
    if (uniqueId) {
      const friend = friends.find(f => f.unique_id === uniqueId)
      if (friend) setSelectedFriend(friend)
    }
  }, [uniqueId, friends])

  useEffect(() => {
    if (!selectedFriend) return
    const chatId = getChatId(selectedFriend.id)
    chatWS.requestHistory('dm', chatId)

    const unsub = chatWS.on('history', (data) => {
      setMessages(data || [])
    })

    const unsubMsg = chatWS.on('new_message', (data) => {
      if (data.chat_type === 'dm' && data.chat_id === getChatId(selectedFriend.id)) {
        setMessages(prev => {
          if (data.sender_id === user.id) {
            const idx = prev.findIndex(m => m.id && m.id.startsWith('opt-') && m.content === data.content)
            if (idx !== -1) {
              const updated = [...prev]
              updated[idx] = data
              return updated
            }
          }
          if (prev.some(m => m.id === data.id)) return prev
          return [...prev, data]
        })
      }
    })

    const unsubTyping = chatWS.on('typing', (data) => {
      if (data.chat_type === 'dm' && data.chat_id === getChatId(selectedFriend.id) && data.user_id !== user.id) {
        setTypingUser(data.user_name)
        clearTimeout(typingTimeout.current)
        typingTimeout.current = setTimeout(() => setTypingUser(null), 2000)
      }
    })

    return () => { unsub(); unsubMsg(); unsubTyping(); clearTimeout(typingTimeout.current) }
  }, [selectedFriend])

  const handleTyping = () => {
    if (!selectedFriend) return
    chatWS.sendTyping('dm', getChatId(selectedFriend.id))
  }

  const loadFriends = async () => {
    try {
      const res = await friendsAPI.getList()
      setFriends(res.data)
    } catch {}
  }

  const getChatId = (friendId) => {
    return [user.id, friendId].sort().join('')
  }

  const handleSend = () => {
    if (!input.trim() || !selectedFriend) return
    const content = input.trim()
    const chatId = getChatId(selectedFriend.id)
    const optimisticMsg = {
      id: 'opt-' + Date.now(),
      sender_id: user.id,
      sender_name: user.name,
      chat_type: 'dm',
      chat_id: chatId,
      content,
      timestamp: new Date().toISOString()
    }
    setMessages(prev => [...prev, optimisticMsg])
    chatWS.sendMessage(selectedFriend.unique_id, content)
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleAddFriend = async () => {
    if (!addId.trim()) return
    try {
      await friendsAPI.sendRequest(addId.trim())
      toast.success('Friend request sent!')
      setAddId('')
      setShowAdd(false)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send request')
    }
  }

  const filteredFriends = friends.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.unique_id.includes(searchQuery)
  )

  return (
    <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 48px)', margin: -24 }}>
      <div style={{ width: 320, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', flexShrink: 0 }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 12 }}>Messages</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search friends..."
                className="input-field" style={{ paddingLeft: 30, fontSize: '0.85rem' }} />
            </div>
            <button onClick={() => setShowAdd(true)} className="btn-ghost" style={{ padding: '8px 10px', borderRadius: 10 }}>
              <FiPlus size={18} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showAdd && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>Enter friend's 6-digit unique ID</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={addId} onChange={e => setAddId(e.target.value)} placeholder="e.g. 482910"
                  className="input-field" style={{ fontSize: '0.85rem', textAlign: 'center', letterSpacing: 2 }} maxLength={6} />
                <button onClick={handleAddFriend} className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                  <FiPlus size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ flex: 1, overflow: 'auto' }} className="scrollbar-custom">
          {filteredFriends.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <FiMessageCircle size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p>No friends yet</p>
              <p style={{ fontSize: '0.78rem' }}>Add friends by their unique ID</p>
            </div>
          ) : (
            filteredFriends.map(friend => (
              <motion.div
                key={friend.id}
                whileHover={{ background: 'var(--bg-card)' }}
                onClick={() => setSelectedFriend(friend)}
                style={{
                  padding: '12px 16px', cursor: 'pointer',
                  background: selectedFriend?.id === friend.id ? 'var(--bg-card)' : 'transparent',
                  borderLeft: selectedFriend?.id === friend.id ? '3px solid var(--accent)' : '3px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 600, fontSize: '0.85rem' }}>
                    {friend.name[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{friend.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{friend.unique_id}</div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
        {selectedFriend ? (
          <>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 600 }}>
                  {selectedFriend.name[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{selectedFriend.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{selectedFriend.unique_id}</div>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: 20 }} className="scrollbar-custom" ref={messagesEndRef}>
              {messages.map((msg, i) => {
                const isMine = msg.sender_id === user.id
                return (
                  <motion.div
                    key={msg.id || i}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    style={{
                      display: 'flex',
                      justifyContent: isMine ? 'flex-end' : 'flex-start',
                      marginBottom: 8
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      padding: '10px 16px',
                      borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMine ? 'var(--accent)' : 'var(--bg-card)',
                      color: isMine ? 'white' : 'var(--text-primary)',
                      border: isMine ? 'none' : '1px solid var(--border)',
                      wordBreak: 'break-word'
                    }}>
                      {msg.content}
                    </div>
                  </motion.div>
                )
              })}
              {typingUser && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '4px 0' }}>
                  {typingUser} is typing...
                </div>
              )}
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <input
                  type="text"
                  value={input}
                  onChange={e => { setInput(e.target.value); handleTyping() }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="input-field"
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 24, fontSize: '0.9rem' }}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={!input.trim()}
                  style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: input.trim() ? 'var(--accent)' : 'var(--border)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s', flexShrink: 0
                  }}
                >
                  <FiSend size={18} />
                </motion.button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <div style={{ textAlign: 'center' }}>
              <FiMessageSquare size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p>Select a friend to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
