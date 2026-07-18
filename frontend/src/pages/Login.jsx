import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { FiMail, FiLock, FiLogIn, FiArrowRight } from 'react-icons/fi'
import ThreeBackground from '../components/ThreeBackground'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState('')
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setUnverifiedEmail('')
    try {
      const userData = await login(email, password)
      toast.success('Welcome back!')
      if (userData?.role === 'teacher') {
        navigate('/app/teacher', { replace: true })
      } else if (userData?.role === 'admin') {
        navigate('/app/admin', { replace: true })
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setUnverifiedEmail(email)
        toast.error('Please verify your email before logging in')
      } else {
        toast.error(err.response?.data?.detail || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative' }}>
      <ThreeBackground />
      <motion.div
        initial={{ opacity: 0, y: 20, rotateX: 5 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.5 }}
        className="card card-3d modal-3d"
        style={{ width: '100%', maxWidth: 420, padding: 40, position: 'relative', zIndex: 1 }}
      >
        <motion.div
          initial={{ scale: 0, rotateZ: -180 }}
          animate={{ scale: 1, rotateZ: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-3d"
          style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--gradient-1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: 24, fontWeight: 800, color: 'white'
          }}
        >
          C
        </motion.div>

        <h1 className="text-3d" style={{ textAlign: 'center', marginBottom: 8, fontSize: '1.5rem' }}>Welcome Back</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 32, fontSize: '0.9rem' }}>
          Sign in to continue learning
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Email or User ID</label>
            <div style={{ position: 'relative' }}>
              <FiMail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={email}
                onChange={e => { setEmail(e.target.value); setUnverifiedEmail('') }}
                className="input-field"
                style={{ paddingLeft: 40 }}
                placeholder="email or user ID"
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <FiLock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                style={{ paddingLeft: 40 }}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {unverifiedEmail && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{
                background: 'var(--bg-secondary)', borderRadius: 12, padding: 16,
                fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6
              }}
            >
              <div style={{ marginBottom: 8 }}>Your email is not verified yet.</div>
              <Link
                to={`/verify-code?email=${encodeURIComponent(unverifiedEmail)}`}
                style={{ color: 'var(--accent)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                Enter verification code <FiArrowRight size={14} />
              </Link>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02, rotateY: 2 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-3d"
            style={{ width: '100%', justifyContent: 'center', padding: 14, marginTop: 8 }}
          >
            {loading ? 'Signing in...' : <><FiLogIn size={18} /> Sign In</>}
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Register</Link>
        </p>
      </motion.div>
    </div>
  )
}