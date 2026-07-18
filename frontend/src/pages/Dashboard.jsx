import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { materialsAPI, aiAPI } from '../services/api'
import { FiBook, FiDownload, FiSearch, FiTrendingUp, FiCpu, FiFileText, FiUpload, FiBookOpen } from 'react-icons/fi'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function Dashboard() {
  const { user } = useAuth()
  const [materials, setMaterials] = useState([])
  const [search, setSearch] = useState('')
  const [recommendations, setRecommendations] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMaterials()
    loadRecommendations()
  }, [])

  const loadMaterials = async () => {
    try {
      const params = {
        stream: user?.stream,
        status: 'approved'
      }
      if (user?.puc) params.puc = user.puc
      const res = await materialsAPI.get(params)
      setMaterials(res.data)
    } catch (err) {
      console.error('Failed to load materials')
    } finally {
      setLoading(false)
    }
  }

  const loadRecommendations = async () => {
    try {
      const res = await aiAPI.recommend()
      setRecommendations(res.data.recommendations)
    } catch {}
  }

  const filtered = materials.filter(m =>
    user?.subjects?.includes(m.subject) &&
    (m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.subject.toLowerCase().includes(search.toLowerCase()))
  )

  const subjects = [...new Set(filtered.map(m => m.subject))]

  return (
    <div className="perspective-container">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 32 }}
      >
        <h1 className="text-3d" style={{ fontSize: '1.8rem', marginBottom: 4 }}>
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          {user?.combination || user?.stream} — {user?.puc ? `${user.puc} PUC` : ''} {user?.subjects?.length} core subjects
          {user?.languages?.length > 0 && ` + ${user.languages.length} languages`}
        </p>
      </motion.div>

      <div style={{ position: 'relative', marginBottom: 32 }}>
        <FiSearch size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search notes, subjects..."
          className="input-field"
          style={{ paddingLeft: 42, padding: '14px 16px 14px 42', fontSize: '1rem' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Link to="/contribute">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="btn btn-primary btn-3d" style={{ gap: 8, padding: '12px 24px' }}>
            <FiUpload size={18} /> Contribute Notes
          </motion.button>
        </Link>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <motion.div whileHover={{ y: -4, rotateY: 2 }} className="card card-3d" style={{ flex: 1, minWidth: 180, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiBook size={20} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{materials.length}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Notes</div>
            </div>
          </div>
        </motion.div>
        <motion.div whileHover={{ y: -4, rotateY: -2 }} className="card card-3d card-3d-reverse" style={{ flex: 1, minWidth: 180, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiTrendingUp size={20} color="var(--success)" />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{subjects.length}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Core Subjects</div>
            </div>
          </div>
        </motion.div>
      </div>

      {search && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 16 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {filtered.length} results for "{search}"
          </p>
        </motion.div>
      )}

      <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {subjects.map(subject => {
          const subjectMaterials = filtered.filter(m => m.subject === subject)
          if (subjectMaterials.length === 0) return null

          return (
            <motion.div key={subject} variants={item}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>{subject}</h3>
                <Link to={`/subjects/${subject}`} style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>
                  View all
                </Link>
              </div>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                {subjectMaterials.slice(0, 5).map(mat => (
                  <motion.div
                    key={mat.id}
                    whileHover={{ y: -8, scale: 1.03, rotateY: 3 }}
                    className="card card-3d glow-border-3d hover-lift-3d"
                    style={{ minWidth: 240, padding: 16, cursor: 'pointer', flexShrink: 0 }}
                    onClick={() => window.open(mat.file_url, '_blank')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <FiFileText size={16} color="var(--accent)" />
                      <div style={{ fontWeight: 500, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {mat.title}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {mat.description || 'No description'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>{mat.download_count} downloads</span>
                      {mat.contributor_name && <span>by {mat.contributor_name}</span>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {recommendations && recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card card-3d modal-3d"
          style={{ marginTop: 32, padding: 20 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <FiCpu size={18} color="var(--accent)" />
            <h3 style={{ fontSize: '1rem' }}>Subject Recommendations</h3>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {recommendations.map((rec, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -4, scale: 1.05 }}
                className="card card-3d"
                style={{
                  padding: '10px 14px',
                  background: 'var(--bg-secondary)',
                  fontSize: '0.85rem'
                }}
              >
                <div style={{ fontWeight: 500, marginBottom: 2 }}>{rec.stream}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {rec.subjects?.slice(0, 3).join(', ')}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
