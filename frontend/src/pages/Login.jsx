import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'
import { FiMail, FiLock, FiLogIn, FiArrowRight, FiKey, FiCheck } from 'react-icons/fi'
import ThreeBackground from '../components/ThreeBackground'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [resetStep, setResetStep] = useState('email')
  const [resetLoading, setResetLoading] = useState(false)
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
      } else {
        navigate('/app/dashboard', { replace: true })
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

  const handleForgotSendCode = async (e) => {
    e.preventDefault()
    if (!resetEmail.trim()) { toast.error('Enter your email'); return }
    setResetLoading(true)
    try {
      await authAPI.forgotPassword(resetEmail.trim())
      toast.success('Reset code sent if this email is registered')
      setResetStep('code')
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to send code') }
    finally { setResetLoading(false) }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!resetCode.trim() || resetPassword.length < 8) {
      toast.error('Enter the code and a new password (min 8 characters)')
      return
    }
    setResetLoading(true)
    try {
      await authAPI.resetPassword(resetEmail.trim(), resetCode.trim(), resetPassword)
      toast.success('Password reset! You can now log in.')
      setShowForgot(false)
      setResetStep('email')
      setResetCode('')
      setResetPassword('')
      setResetEmail('')
    } catch (err) { toast.error(err.response?.data?.detail || 'Reset failed') }
    finally { setResetLoading(false) }
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

          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <button type="button" onClick={() => setShowForgot(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>
              Forgot Password?
            </button>
          </div>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Register</Link>
        </p>
      </motion.div>

      {showForgot && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: 20
          }}
          onClick={() => { setShowForgot(false); setResetStep('email') }}>
          <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="card" style={{ maxWidth: 400, width: '100%', padding: 32, position: 'relative' }}
            onClick={e => e.stopPropagation()}>
            <button onClick={() => { setShowForgot(false); setResetStep('email') }}
              className="btn btn-ghost" style={{ position: 'absolute', top: 12, right: 12, padding: 8 }}>x</button>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 16 }}>Reset Password</h2>

            {resetStep === 'email' ? (
              <form onSubmit={handleForgotSendCode} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                  <FiMail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                    className="input-field" style={{ paddingLeft: 40 }} placeholder="Your registered email" required />
                </div>
                <motion.button type="submit" disabled={resetLoading} className="btn btn-primary" style={{ justifyContent: 'center' }}>
                  {resetLoading ? 'Sending...' : <><FiKey size={16} /> Send Reset Code</>}
                </motion.button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Enter the 6-digit code sent to {resetEmail}</p>
                <input type="text" value={resetCode} onChange={e => setResetCode(e.target.value)}
                  className="input-field" placeholder="6-digit code" maxLength={6} required />
                <div style={{ position: 'relative' }}>
                  <FiLock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)}
                    className="input-field" style={{ paddingLeft: 40 }} placeholder="New password (min 8 chars)" required />
                </div>
                <motion.button type="submit" disabled={resetLoading} className="btn btn-primary" style={{ justifyContent: 'center' }}>
                  {resetLoading ? 'Resetting...' : <><FiCheck size={16} /> Reset Password</>}
                </motion.button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}