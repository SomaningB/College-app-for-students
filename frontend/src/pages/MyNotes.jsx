import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { userNotesAPI } from '../services/api'
import { FiFolder, FiFileText, FiPlus, FiTrash2, FiUpload, FiX, FiBook, FiChevronRight, FiChevronDown, FiDownload } from 'react-icons/fi'
import toast from 'react-hot-toast'

export default function MyNotes() {
  const { user } = useAuth()
  const [folders, setFolders] = useState([])
  const [notes, setNotes] = useState([])
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [folderSubject, setFolderSubject] = useState('')
  const [noteTitle, setNoteTitle] = useState('')
  const [noteSubject, setNoteSubject] = useState('')
  const [noteFile, setNoteFile] = useState(null)
  const [createLoading, setCreateLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [expandedFolder, setExpandedFolder] = useState(null)
  const [folderNotes, setFolderNotes] = useState({})

  useEffect(() => {
    loadFolders()
    loadAllNotes()
  }, [])

  const loadFolders = async () => {
    try {
      const res = await userNotesAPI.listFolders()
      setFolders(res.data)
    } catch {
      toast.error('Failed to load folders')
    } finally {
      setLoading(false)
    }
  }

  const loadAllNotes = async () => {
    try {
      const res = await userNotesAPI.listNotes({})
      setNotes(res.data)
    } catch {}
  }

  const loadFolderNotes = async (folderId) => {
    if (folderNotes[folderId]) return
    try {
      const res = await userNotesAPI.listNotes({ folder_id: folderId })
      setFolderNotes(prev => ({ ...prev, [folderId]: res.data }))
    } catch {}
  }

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return toast.error('Enter folder name')
    setCreateLoading(true)
    try {
      const fd = new FormData()
      fd.append('name', folderName)
      fd.append('subject', folderSubject)
      await userNotesAPI.createFolder(fd)
      toast.success('Folder created')
      setShowCreateFolder(false)
      setFolderName('')
      setFolderSubject('')
      loadFolders()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create folder')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleDeleteFolder = async (id) => {
    if (!confirm('Delete this folder and all notes inside?')) return
    try {
      await userNotesAPI.deleteFolder(id)
      toast.success('Folder deleted')
      if (selectedFolder === id) setSelectedFolder(null)
      setFolderNotes(prev => { const n = { ...prev }; delete n[id]; return n })
      loadFolders()
    } catch {
      toast.error('Failed to delete folder')
    }
  }

  const handleUpload = async () => {
    if (!noteTitle.trim()) return toast.error('Enter note title')
    if (!noteFile) return toast.error('Select a file')
    setUploadLoading(true)
    try {
      const fd = new FormData()
      fd.append('title', noteTitle)
      fd.append('subject', noteSubject)
      fd.append('folder_id', selectedFolder || '')
      fd.append('file', noteFile)
      await userNotesAPI.uploadNote(fd)
      toast.success('Note uploaded')
      setShowUpload(false)
      setNoteTitle('')
      setNoteSubject('')
      setNoteFile(null)
      loadAllNotes()
      if (selectedFolder) {
        loadFolderNotes(selectedFolder)
        loadFolders()
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to upload')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleDeleteNote = async (id, folderId) => {
    if (!confirm('Delete this note?')) return
    try {
      await userNotesAPI.deleteNote(id)
      toast.success('Note deleted')
      setNotes(prev => prev.filter(n => n.id !== id))
      if (folderId) {
        setFolderNotes(prev => ({
          ...prev,
          [folderId]: (prev[folderId] || []).filter(n => n.id !== id)
        }))
        loadFolders()
      }
    } catch {
      toast.error('Failed to delete note')
    }
  }

  const toggleFolder = (folderId) => {
    if (expandedFolder === folderId) {
      setExpandedFolder(null)
    } else {
      setExpandedFolder(folderId)
      loadFolderNotes(folderId)
    }
  }

  const subjects = [...(user?.subjects || []), ...(user?.languages || [])]

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>My Notes</h1>
        <p style={{ color: 'var(--text-muted)' }}>Create folders and upload study materials subject-wise</p>
      </motion.div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateFolder(true)}
          className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiFolder size={16} /> New Folder
        </motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowUpload(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', fontWeight: 500
          }}>
          <FiUpload size={16} /> Upload Notes
        </motion.button>
      </div>

      <AnimatePresence>
        {showCreateFolder && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="card" style={{ padding: 20, marginBottom: 20, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1rem' }}>Create Folder</h3>
              <button onClick={() => setShowCreateFolder(false)} className="btn btn-ghost"><FiX size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
              <input type="text" value={folderName} onChange={e => setFolderName(e.target.value)}
                placeholder="Folder name (e.g. Physics - Chapter 5)" className="input-field" />
              <select value={folderSubject} onChange={e => setFolderSubject(e.target.value)} className="input-field">
                <option value="">No specific subject</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={handleCreateFolder} disabled={createLoading || !folderName.trim()}
                className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                {createLoading ? 'Creating...' : 'Create Folder'}
              </button>
            </div>
          </motion.div>
        )}

        {showUpload && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="card" style={{ padding: 20, marginBottom: 20, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1rem' }}>Upload Notes</h3>
              <button onClick={() => setShowUpload(false)} className="btn btn-ghost"><FiX size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
              <input type="text" value={noteTitle} onChange={e => setNoteTitle(e.target.value)}
                placeholder="Note title (e.g. Newton's Laws Summary)" className="input-field" />
              <select value={noteSubject} onChange={e => setNoteSubject(e.target.value)} className="input-field">
                <option value="">No subject</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={selectedFolder || ''} onChange={e => setSelectedFolder(e.target.value || null)} className="input-field">
                <option value="">No folder (root)</option>
                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <div style={{
                padding: 16, borderRadius: 10,
                border: '2px dashed var(--border)',
                textAlign: 'center', cursor: 'pointer',
                color: 'var(--text-muted)', fontSize: '0.85rem'
              }} onClick={() => document.getElementById('note-file-input').click()}>
                {noteFile ? noteFile.name : 'Click to select PDF, TXT, or MD file'}
              </div>
              <input id="note-file-input" type="file" accept=".pdf,.txt,.md"
                onChange={e => {
                  const f = e.target.files[0]
                  if (f && f.size > 50 * 1024 * 1024) return toast.error('Max 50MB')
                  if (f && !['pdf', 'txt', 'md'].includes(f.name.split('.').pop().toLowerCase())) return toast.error('Only PDF, TXT, MD')
                  setNoteFile(f)
                }} style={{ display: 'none' }} />
              {noteFile && (
                <div style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>
                  {(noteFile.size / 1024 / 1024).toFixed(1)} MB
                </div>
              )}
              <button onClick={handleUpload} disabled={uploadLoading || !noteTitle.trim() || !noteFile}
                className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
                {uploadLoading ? 'Uploading...' : 'Upload Note'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }} />
      ) : (
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 350px', minWidth: 0 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 12, color: 'var(--text-secondary)' }}>
              <FiFolder size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Folders ({folders.length})
            </h3>
            {folders.length === 0 ? (
              <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No folders yet. Create one to organize your notes.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {folders.map(f => (
                  <motion.div key={f.id} layout
                    className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div onClick={() => toggleFolder(f.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '14px 16px', cursor: 'pointer',
                        borderBottom: expandedFolder === f.id ? '1px solid var(--border)' : 'none'
                      }}>
                      {expandedFolder === f.id ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                      <FiFolder size={18} style={{ color: 'var(--accent)' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{f.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {f.subject && `${f.subject} · `}{f.note_count} notes
                        </div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); handleDeleteFolder(f.id) }}
                        style={{ color: 'var(--text-muted)', padding: 6 }}>
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                    <AnimatePresence>
                      {expandedFolder === f.id && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                          style={{ overflow: 'hidden' }}>
                          <div style={{ padding: '8px 16px 16px' }}>
                            {(folderNotes[f.id] || []).length === 0 ? (
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '8px 0' }}>
                                No notes in this folder
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {(folderNotes[f.id] || []).map(n => (
                                  <div key={n.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '10px 12px', borderRadius: 8,
                                    background: 'var(--bg-secondary)', fontSize: '0.85rem'
                                  }}>
                                    <FiFileText size={14} style={{ color: 'var(--text-muted)' }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {n.file_type} · {(n.file_size / 1024).toFixed(0)} KB
                                      </div>
                                    </div>
                                    <button onClick={() => window.open(n.file_url, '_blank')}
                                      style={{ color: 'var(--text-muted)', padding: 4 }}>
                                      <FiDownload size={12} />
                                    </button>
                                    <button onClick={() => handleDeleteNote(n.id, f.id)}
                                      style={{ color: 'var(--text-muted)', padding: 4 }}>
                                      <FiTrash2 size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div style={{ flex: '1 1 350px', minWidth: 0 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 12, color: 'var(--text-secondary)' }}>
              <FiFileText size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              All Notes ({notes.length})
            </h3>
            {notes.length === 0 ? (
              <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                No notes uploaded yet. Upload study materials to use them with the AI Assistant.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {notes.map(n => (
                  <div key={n.id} className="card" style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px'
                  }}>
                    <FiFileText size={18} style={{ color: 'var(--accent)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {n.subject && `${n.subject} · `}{n.file_type} · {(n.file_size / 1024 / 1024).toFixed(1)} MB
                      </div>
                    </div>
                    <button onClick={() => window.open(n.file_url, '_blank')}
                      style={{ color: 'var(--text-muted)', padding: 6 }}>
                      <FiDownload size={14} />
                    </button>
                    <button onClick={() => handleDeleteNote(n.id, n.folder_id)}
                      style={{ color: 'var(--text-muted)', padding: 6 }}>
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
