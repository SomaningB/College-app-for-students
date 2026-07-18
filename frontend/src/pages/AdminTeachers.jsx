import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { adminAPI, streamsAPI } from '../services/api'
import { FiUserPlus, FiTrash2, FiCopy, FiCheck, FiBook, FiX } from 'react-icons/fi'
import toast from 'react-hot-toast'

const streamSubjects = {
  science: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Electronics'],
  commerce: ['Computer Science', 'Economics', 'Business Studies', 'Accountancy', 'Statistics'],
  arts: ['History', 'Political Science', 'Economics', 'Sociology', 'Geography', 'Kannada', 'English']
}

const languageSubjects = ['Information Technology (NSQF)', 'Automobile (NSQF)', 'English', 'Kannada', 'Hindi', 'Urdu', 'Sanskrit (where available)']

export default function AdminTeachers() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [stream, setStream] = useState('')
  const [creating, setCreating] = useState(false)
  const [createdTeacher, setCreatedTeacher] = useState(null)
  const [copied, setCopied] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(null)
  const [editName, setEditName] = useState('')
  const [editSubjects, setEditSubjects] = useState([])
  const [editStream, setEditStream] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const streams = [
    { value: 'science', label: 'Science' },
    { value: 'commerce', label: 'Commerce' },
    { value: 'arts', label: 'Arts' }
  ]

  const availableSubjects = stream ? [...(streamSubjects[stream] || []), ...languageSubjects] : []

  const toggleSubject = (subj) => {
    setSelectedSubjects(prev =>
      prev.includes(subj) ? prev.filter(s => s !== subj) : [...prev, subj]
    )
  }

  useEffect(() => {
    loadTeachers()
  }, [])

  useEffect(() => {
    setSelectedSubjects([])
  }, [stream])

  const loadTeachers = async () => {
    try {
      const res = await adminAPI.getTeachers()
      setTeachers(res.data)
    } catch {
      toast.error('Failed to load teachers')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!name.trim() || selectedSubjects.length === 0 || !stream) return toast.error('Fill all fields and select at least one subject')
    setCreating(true)
    try {
      const fd = new FormData()
      fd.append('name', name)
      fd.append('subjects', selectedSubjects.join(', '))
      fd.append('stream', stream)
      const res = await adminAPI.createTeacher(fd)
      setCreatedTeacher(res.data)
      toast.success('Teacher created')
      setShowCreate(false)
      setName('')
      setSelectedSubjects([])
      setStream('')
      loadTeachers()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create teacher')
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (teacher) => {
    setEditingTeacher(teacher)
    setEditName(teacher.name)
    setEditSubjects([...teacher.subjects])
    setEditStream(teacher.stream)
  }

  const handleEdit = async () => {
    if (!editName.trim() || editSubjects.length === 0 || !editStream) return toast.error('Fill all fields')
    setEditLoading(true)
    try {
      const fd = new FormData()
      fd.append('name', editName)
      fd.append('subjects', editSubjects.join(', '))
      fd.append('stream', editStream)
      await adminAPI.updateTeacher(editingTeacher.id, fd)
      toast.success('Teacher updated')
      setEditingTeacher(null)
      loadTeachers()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this teacher? Their notes will also be removed.')) return
    try {
      await adminAPI.deleteTeacher(id)
      toast.success('Teacher deleted')
      setTeachers(prev => prev.filter(t => t.id !== id))
    } catch {
      toast.error('Delete failed')
    }
  }

  const copyCredentials = () => {
    if (!createdTeacher) return
    const text = `Teacher Account Created\nName: ${createdTeacher.name}\nUser ID: ${createdTeacher.unique_id}\nPassword: ${createdTeacher.password}\nStream: ${createdTeacher.stream}\nSubjects: ${createdTeacher.subjects.join(', ')}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>Manage Teachers</h1>
        <p style={{ color: 'var(--text-muted)' }}>Create teacher accounts and manage them</p>
      </motion.div>

      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={() => setShowCreate(true)}
        className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <FiUserPlus size={16} /> Create Teacher
      </motion.button>

      {showCreate && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="card" style={{ padding: 20, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem' }}>New Teacher</h3>
            <button onClick={() => setShowCreate(false)} className="btn btn-ghost"><FiX size={18} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 500 }}>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Teacher full name" className="input-field" />
            <select value={stream} onChange={e => setStream(e.target.value)} className="input-field">
              <option value="">Select stream</option>
              {streams.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {stream && (
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Select subjects (core + languages):</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 200, overflow: 'auto' }}>
                  {availableSubjects.map(s => (
                    <label key={s} onClick={() => toggleSubject(s)}
                      style={{
                        padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                        background: selectedSubjects.includes(s) ? 'var(--accent)' : 'var(--bg-secondary)',
                        color: selectedSubjects.includes(s) ? 'white' : 'var(--text-secondary)',
                        border: '1px solid', borderColor: selectedSubjects.includes(s) ? 'var(--accent)' : 'var(--border)',
                        fontSize: '0.85rem', transition: 'all 0.15s'
                      }}>
                      {s}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <button onClick={handleCreate} disabled={creating || !name || selectedSubjects.length === 0 || !stream}
              className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              {creating ? 'Creating...' : 'Generate Credentials'}
            </button>
          </div>
        </motion.div>
      )}

      {editingTeacher && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="card" style={{ padding: 20, marginBottom: 24, overflow: 'hidden', border: '1px solid var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem' }}>Edit Teacher — {editingTeacher.name}</h3>
            <button onClick={() => setEditingTeacher(null)} className="btn btn-ghost"><FiX size={18} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 500 }}>
            <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
              placeholder="Teacher full name" className="input-field" />
            <select value={editStream} onChange={e => { setEditStream(e.target.value); setEditSubjects([]) }} className="input-field">
              <option value="">Select stream</option>
              {streams.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {editStream && (
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Subjects:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 200, overflow: 'auto' }}>
                  {(streamSubjects[editStream] || []).concat(languageSubjects).map(s => (
                    <label key={s} onClick={() => setEditSubjects(prev =>
                      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
                    )}
                      style={{
                        padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                        background: editSubjects.includes(s) ? 'var(--accent)' : 'var(--bg-secondary)',
                        color: editSubjects.includes(s) ? 'white' : 'var(--text-secondary)',
                        border: '1px solid', borderColor: editSubjects.includes(s) ? 'var(--accent)' : 'var(--border)',
                        fontSize: '0.85rem', transition: 'all 0.15s'
                      }}>
                      {s}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <button onClick={handleEdit} disabled={editLoading || !editName || editSubjects.length === 0 || !editStream}
              className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              {editLoading ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </motion.div>
      )}

      {createdTeacher && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="card" style={{ padding: 20, marginBottom: 24, border: '1px solid var(--success)', background: 'rgba(34, 197, 94, 0.05)' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 12, color: 'var(--success)' }}>Teacher Created Successfully</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.9rem', marginBottom: 16 }}>
            <div><strong>Name:</strong> {createdTeacher.name}</div>
            <div><strong>User ID:</strong> <code style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 4 }}>{createdTeacher.unique_id}</code></div>
            <div><strong>Password:</strong> <code style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 4 }}>{createdTeacher.password}</code></div>
            <div><strong>Stream:</strong> {createdTeacher.stream}</div>
            <div><strong>Subjects:</strong> {createdTeacher.subjects.join(', ')}</div>
          </div>
          <button onClick={copyCredentials}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: '0.85rem',
              background: copied ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-secondary)',
              color: copied ? 'var(--success)' : 'var(--text-secondary)',
              border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6
            }}>
            {copied ? <><FiCheck size={14} /> Copied</> : <><FiCopy size={14} /> Copy Credentials</>}
          </button>
        </motion.div>
      )}

      <h3 style={{ fontSize: '1rem', marginBottom: 12, color: 'var(--text-secondary)' }}>
        <FiBook size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
        All Teachers ({teachers.length})
      </h3>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 150 }} />
      ) : teachers.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
          No teachers yet. Create one to let them upload notes.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {teachers.map(t => (
            <div key={t.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span>ID: {t.unique_id}</span>
                  <span>· {t.stream}</span>
                  <span>· {t.subjects.join(', ')}</span>
                </div>
              </div>
              <button onClick={() => startEdit(t)}
                style={{ padding: 8, color: 'var(--text-muted)' }}>
                <FiBook size={16} />
              </button>
              <button onClick={() => handleDelete(t.id)}
                style={{ padding: 8, color: 'var(--error)' }}>
                <FiTrash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
