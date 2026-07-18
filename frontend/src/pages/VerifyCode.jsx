import { useState, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'
import { FiCheckCircle, FiSend, FiArrowLeft } from 'react-icons/fi'

export default function VerifyCode() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const email = searchParams.get('email') || ''
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [verified, setVerified] = useState(false)
  const inputRefs = useRef([])

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async () => {
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      toast.error('Please enter the full 6-digit code')
      return
    }
    setLoading(true)
    try {
      await authAPI.verifyEmail(email, fullCode)
      setVerified(true)
      toast.success('Email verified! You can now log in.')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await authAPI.resendVerification(email)
      toast.success('New verification code sent!')
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to resend')
    } finally {
      setResending(false)
    }
  }

  if (verified) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ width: '100%', maxWidth: 420, padding: 40, textAlign: 'center' }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            style={{
              width: 64, height: 64, borderRadius: 16,
              background: 'var(--success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              color: 'white', fontSize: 28
            }}
          >
            <FiCheckCircle />
          </motion.div>
          <h1 style={{ marginBottom: 8 }}>Email Verified!</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: '0.9rem' }}>
            Your email has been verified successfully. You can now log in.
          </p>
          <Link to="/login">
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14 }}>
              Go to Login
            </motion.button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ width: '100%', maxWidth: 420, padding: 40 }}
      >
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'var(--gradient-1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 24, color: 'white'
            }}
          >
            <FiSend />
          </motion.div>
          <h1 style={{ marginBottom: 8, fontSize: '1.4rem' }}>Verify Your Email</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            Enter the 6-digit code sent to<br />
            <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
          {code.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleCodeChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              style={{
                width: 48, height: 56, textAlign: 'center', fontSize: '1.4rem', fontWeight: 700,
                borderRadius: 12, border: `2px solid ${digit ? 'var(--accent)' : 'var(--border)'}`,
                background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                outline: 'none', transition: 'all 0.2s'
              }}
            />
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleVerify}
          disabled={loading || code.join('').length !== 6}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: 14, marginBottom: 16 }}
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </motion.button>

        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Didn't receive the code?{' '}
          <button
            onClick={handleResend}
            disabled={resending}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: '0.85rem' }}
          >
            {resending ? 'Sending...' : 'Resend'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <FiArrowLeft size={14} /> Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  )
}