import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { aiAPI, userNotesAPI } from '../services/api'
import { FiCpu, FiSend, FiFileText, FiHelpCircle, FiCopy, FiCheck, FiBook, FiPaperclip, FiX, FiUpload, FiFolder, FiChevronRight, FiChevronDown, FiTrash2 } from 'react-icons/fi'
import toast from 'react-hot-toast'

const quickActions = [
  { icon: FiFileText, label: 'Generate Notes', action: 'notes' },
  { icon: FiHelpCircle, label: 'Exam Questions', action: 'questions' },
  { icon: FiBook, label: 'Study Assistant', action: 'chat' },
  { icon: FiFolder, label: 'Saved Notes', action: 'saved' }
]

export default function AIAssistant() {
  const { user } = useAuth()
  const [mode, setMode] = useState('chat')
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [count, setCount] = useState(5)
  const [chatMessages, setChatMessages] = useState([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [attachedFile, setAttachedFile] = useState(null)
  const chatEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const [savedNotes, setSavedNotes] = useState([])
  const [savedFolders, setSavedFolders] = useState([])
  const [expandedFolder, setExpandedFolder] = useState(null)
  const [folderNotes, setFolderNotes] = useState({})
  const [selectedSavedNote, setSelectedSavedNote] = useState(null)
  const [loadingSaved, setLoadingSaved] = useState(false)
  const allSubjects = [...(user?.subjects || []), ...(user?.languages || [])]

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  useEffect(() => {
    if (historyLoaded) return
    loadHistory()
  }, [])

  useEffect(() => {
    if (mode === 'saved' && savedNotes.length === 0) {
      loadSavedNotes()
    }
  }, [mode])

  const loadSavedNotes = async () => {
    setLoadingSaved(true)
    try {
      const [notesRes, foldersRes] = await Promise.all([
        userNotesAPI.listNotes({}),
        userNotesAPI.listFolders()
      ])
      setSavedNotes(notesRes.data)
      setSavedFolders(foldersRes.data)
    } catch {
      toast.error('Failed to load saved notes')
    } finally {
      setLoadingSaved(false)
    }
  }

  const loadHistory = async () => {
    try {
      const res = await aiAPI.getHistory()
      const msgs = res.data
      if (msgs.length === 0) {
        setChatMessages([{ role: 'ai', content: "Hi! I'm your AI study assistant. Upload your notes and ask questions, or just ask me anything about your subjects!" }])
      } else {
        setChatMessages(msgs.map(m => ({ role: m.role, content: m.content })))
      }
    } catch {
      setChatMessages([{ role: 'ai', content: "Hi! I'm your AI study assistant. Upload your notes and ask questions, or just ask me anything about your subjects!" }])
    } finally {
      setHistoryLoaded(true)
    }
  }

  const handleClearHistory = async () => {
    if (!confirm('Clear all AI chat history?')) return
    try {
      await aiAPI.clearHistory()
      setChatMessages([{ role: 'ai', content: "Hi! I'm your AI study assistant. Upload your notes and ask questions, or just ask me anything about your subjects!" }])
      toast.success('History cleared')
    } catch {
      toast.error('Failed to clear history')
    }
  }

  const loadFolderNotes = async (folderId) => {
    if (folderNotes[folderId]) return
    try {
      const res = await userNotesAPI.listNotes({ folder_id: folderId })
      setFolderNotes(prev => ({ ...prev, [folderId]: res.data }))
    } catch {}
  }

  const handleChatWithSavedNote = async (note) => {
    if (!input.trim()) return toast.error('Type a question about this note')
    setSelectedSavedNote(note)
    setChatMessages(prev => [...prev, { role: 'user', content: `[${note.title}] ${input.trim()}` }])
    setInput('')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('note_id', note.id)
      fd.append('message', input.trim())
      const res = await aiAPI.chatWithSavedNote(fd)
      setChatMessages(prev => [...prev, { role: 'ai', content: res.data.reply }])
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', content: 'Sorry, AI service is unavailable.' }])
    } finally {
      setLoading(false)
      setSelectedSavedNote(null)
    }
  }

  const handleGenerate = async () => {
    if (!subject || !topic) return toast.error('Please enter both subject and topic')
    setLoading(true)
    try {
      if (mode === 'notes') {
        const res = await aiAPI.generateNotes({ topic, subject })
        setResult({ type: 'notes', data: res.data.notes, topic, subject })
      } else if (mode === 'questions') {
        const res = await aiAPI.generateQuestions({ topic, subject, count })
        setResult({ type: 'questions', data: res.data.questions, topic, subject })
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'AI service error')
    } finally {
      setLoading(false)
    }
  }

  const handleChatSend = async () => {
    if (!input.trim() && !attachedFile) return
    const userMsg = input.trim() || (attachedFile ? `Help me understand the notes from ${attachedFile.name}` : '')

    const msgContent = attachedFile
      ? `${userMsg}\n\n[Attached file: ${attachedFile.name}]`
      : userMsg
    setChatMessages(prev => [...prev, { role: 'user', content: msgContent }])
    setInput('')
    setLoading(true)

    try {
      if (attachedFile) {
        const fd = new FormData()
        fd.append('message', userMsg)
        if (subject) fd.append('subject', subject)
        fd.append('file', attachedFile)
        const res = await aiAPI.chatWithNotes(fd)
        setChatMessages(prev => [...prev, { role: 'ai', content: res.data.reply }])
        setAttachedFile(null)
      } else {
        const res = await aiAPI.chat({ message: userMsg, subject: subject || undefined })
        setChatMessages(prev => [...prev, { role: 'ai', content: res.data.reply }])
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'ai', content: 'Sorry, AI service is unavailable.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (mode === 'saved' && selectedSavedNote) {
        handleChatWithSavedNote(selectedSavedNote)
      } else {
        handleChatSend()
      }
    }
  }

  const handleCopy = async (text) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'txt', 'md'].includes(ext)) {
      toast.error('Only PDF, TXT, MD files allowed')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10MB')
      return
    }
    setAttachedFile(file)
  }

  const toggleFolder = (folderId) => {
    if (expandedFolder === folderId) {
      setExpandedFolder(null)
    } else {
      setExpandedFolder(folderId)
      loadFolderNotes(folderId)
    }
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>AI Assistant</h1>
        <p style={{ color: 'var(--text-muted)' }}>Generate notes, exam questions, and get study help</p>
      </motion.div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {quickActions.map(({ icon: Icon, label, action }) => (
          <motion.button key={action} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setMode(action)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 20px', borderRadius: 12,
              background: mode === action ? 'var(--accent)' : 'var(--bg-card)',
              color: mode === action ? 'white' : 'var(--text-secondary)',
              border: mode === action ? 'none' : '1px solid var(--border)',
              fontWeight: 500, fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}>
            <Icon size={18} />
            {label}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {mode === 'chat' && (
          <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="card" style={{ display: 'flex', flexDirection: 'column', height: '60vh' }}>
            <div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={subject} onChange={e => setSubject(e.target.value)}
                className="input-field" style={{ width: 'auto', minWidth: 200, fontSize: '0.85rem' }}>
                <option value="">All subjects</option>
                {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '8px 12px', borderRadius: 8, fontSize: '0.8rem',
                  background: attachedFile ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                  color: attachedFile ? 'var(--accent)' : 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 6
                }}>
                <FiPaperclip size={14} /> {attachedFile ? 'File attached' : 'Attach notes'}
              </motion.button>
              <input ref={fileInputRef} type="file" accept=".pdf,.txt,.md" onChange={handleFileSelect} style={{ display: 'none' }} />
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleClearHistory}
                style={{ marginLeft: 'auto', padding: '8px 10px', borderRadius: 8, fontSize: '0.8rem',
                  background: 'transparent', color: 'var(--text-muted)',
                  border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiTrash2 size={14} /> Clear
              </motion.button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 20 }} className="scrollbar-custom">
              {chatMessages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex', marginBottom: 12,
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                  }}>
                  <div style={{
                    maxWidth: '80%',
                    padding: '12px 18px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-card)',
                    color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                    lineHeight: 1.7,
                    fontSize: '0.9rem',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div style={{ display: 'flex', gap: 4, padding: 12, color: 'var(--text-muted)' }}>
                  <div className="skeleton" style={{ width: 8, height: 8, borderRadius: '50%' }} />
                  <div className="skeleton" style={{ width: 8, height: 8, borderRadius: '50%', animationDelay: '0.2s' }} />
                  <div className="skeleton" style={{ width: 8, height: 8, borderRadius: '50%', animationDelay: '0.4s' }} />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
              {attachedFile && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                  padding: '8px 12px', borderRadius: 8, background: 'var(--accent-glow)',
                  fontSize: '0.8rem', color: 'var(--accent)'
                }}>
                  <FiUpload size={14} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {attachedFile.name}
                  </span>
                  <button onClick={() => setAttachedFile(null)} style={{ color: 'var(--text-muted)', padding: 2 }}>
                    <FiX size={16} />
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={attachedFile ? 'Ask about your notes...' : 'Ask a study question...'}
                  className="input-field" style={{ flex: 1, borderRadius: 24, padding: '12px 16px' }} />
                <button onClick={handleChatSend} disabled={loading || (!input.trim() && !attachedFile)}
                  style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: (input.trim() || attachedFile) ? 'var(--accent)' : 'var(--border)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                  <FiSend size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {mode === 'saved' && (
          <motion.div key="saved" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div className="card" style={{ flex: '0 0 300px', padding: 0, maxHeight: '60vh', display: 'flex', flexDirection: 'column', minWidth: 250 }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '0.9rem' }}>
                <FiFolder size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                My Saved Notes
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: 8 }} className="scrollbar-custom">
                {loadingSaved ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
                ) : savedNotes.length === 0 && savedFolders.length === 0 ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No saved notes yet. Go to <strong>My Notes</strong> to upload study materials.
                  </div>
                ) : (
                  <>
                    {savedFolders.map(f => (
                      <div key={f.id} style={{ marginBottom: 4 }}>
                        <div onClick={() => toggleFolder(f.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                            fontSize: '0.85rem', fontWeight: 500
                          }}>
                          {expandedFolder === f.id ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                          <FiFolder size={14} style={{ color: 'var(--accent)' }} />
                          <span style={{ flex: 1 }}>{f.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.note_count}</span>
                        </div>
                        <AnimatePresence>
                          {expandedFolder === f.id && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                              {(folderNotes[f.id] || []).map(n => (
                                <div key={n.id} onClick={() => setSelectedSavedNote(selectedSavedNote?.id === n.id ? null : n)}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '6px 10px 6px 28px', borderRadius: 6, cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    background: selectedSavedNote?.id === n.id ? 'var(--accent-glow)' : 'transparent',
                                    color: selectedSavedNote?.id === n.id ? 'var(--accent)' : 'var(--text-secondary)'
                                  }}>
                                  <FiFileText size={12} />
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</span>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                    <div style={{ borderTop: savedFolders.length > 0 ? '1px solid var(--border)' : 'none', margin: '4px 0', paddingTop: 4 }}>
                      {savedNotes.filter(n => !n.folder_id).map(n => (
                        <div key={n.id} onClick={() => setSelectedSavedNote(selectedSavedNote?.id === n.id ? null : n)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                            fontSize: '0.85rem',
                            background: selectedSavedNote?.id === n.id ? 'var(--accent-glow)' : 'transparent',
                            color: selectedSavedNote?.id === n.id ? 'var(--accent)' : 'var(--text-secondary)'
                          }}>
                          <FiFileText size={14} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '60vh', minWidth: 300 }}>
              {selectedSavedNote ? (
                <>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 500 }}>
                    Chatting about: {selectedSavedNote.title}
                    <button onClick={() => setSelectedSavedNote(null)} style={{ float: 'right', color: 'var(--text-muted)' }}><FiX size={16} /></button>
                  </div>
                  <div style={{ flex: 1, overflow: 'auto', padding: 20 }} className="scrollbar-custom">
                    {chatMessages.map((msg, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                          display: 'flex', marginBottom: 12,
                          justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                        }}>
                        <div style={{
                          maxWidth: '80%',
                          padding: '12px 18px',
                          borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-card)',
                          color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                          border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                          lineHeight: 1.7,
                          fontSize: '0.9rem',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}
                    {loading && (
                      <div style={{ display: 'flex', gap: 4, padding: 12, color: 'var(--text-muted)' }}>
                        <div className="skeleton" style={{ width: 8, height: 8, borderRadius: '50%' }} />
                        <div className="skeleton" style={{ width: 8, height: 8, borderRadius: '50%', animationDelay: '0.2s' }} />
                        <div className="skeleton" style={{ width: 8, height: 8, borderRadius: '50%', animationDelay: '0.4s' }} />
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="text" value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`Ask about ${selectedSavedNote.title}...`}
                        className="input-field" style={{ flex: 1, borderRadius: 24, padding: '12px 16px' }} />
                      <button onClick={() => handleChatWithSavedNote(selectedSavedNote)} disabled={loading || !input.trim()}
                        style={{
                          width: 44, height: 44, borderRadius: '50%',
                          background: input.trim() ? 'var(--accent)' : 'var(--border)',
                          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                        <FiSend size={18} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: 20, textAlign: 'center' }}>
                  Select a saved note from the sidebar to ask questions about it
                </div>
              )}
            </div>
          </motion.div>
        )}

        {(mode === 'notes' || mode === 'questions') && (
          <motion.div key="generate" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
              <h3 style={{ marginBottom: 16 }}>
                {mode === 'notes' ? 'Generate Study Notes' : 'Generate Exam Questions'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 500 }}>
                <select value={subject} onChange={e => setSubject(e.target.value)}
                  className="input-field">
                  <option value="">Select subject</option>
                  {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
                  placeholder="Enter topic (e.g. 'Newton's Laws', 'Thermodynamics')"
                  className="input-field" />
                {mode === 'questions' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Number of questions:</span>
                    <input type="number" value={count} onChange={e => setCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                      min={1} max={20} className="input-field" style={{ width: 80, textAlign: 'center' }} />
                  </div>
                )}
                <button onClick={handleGenerate} disabled={loading}
                  className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                  {loading ? 'Generating...' : mode === 'notes' ? <><FiFileText /> Generate Notes</> : <><FiHelpCircle /> Generate Questions</>}
                </button>
              </div>
            </div>

            {result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', marginBottom: 2 }}>
                      {result.type === 'notes' ? 'Study Notes' : 'Exam Questions'}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {result.subject} — {result.topic}
                    </p>
                  </div>
                  <button onClick={() => handleCopy(result.data)}
                    style={{
                      padding: '8px 14px', borderRadius: 8,
                      background: copied ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-secondary)',
                      color: copied ? 'var(--success)' : 'var(--text-secondary)',
                      border: '1px solid var(--border)', fontSize: '0.8rem',
                      display: 'flex', alignItems: 'center', gap: 6
                    }}>
                    {copied ? <><FiCheck size={14} /> Copied</> : <><FiCopy size={14} /> Copy</>}
                  </button>
                </div>
                <div style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: 12,
                  padding: 20,
                  fontSize: '0.9rem',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                  color: 'var(--text-primary)'
                }}>
                  {result.data}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
