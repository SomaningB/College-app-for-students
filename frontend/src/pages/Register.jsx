import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { streamsAPI } from '../services/api'
import toast from 'react-hot-toast'
import { FiUser, FiMail, FiLock, FiUserPlus, FiChevronRight, FiChevronLeft, FiCheck, FiBookOpen } from 'react-icons/fi'

const steps = ['Account', 'Stream', 'Subjects', 'Languages']

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [streams, setStreams] = useState({})
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    stream: '', combination: '', puc: '', subjects: [], languages: []
  })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()

  useEffect(() => {
    streamsAPI.getAll().then(res => setStreams(res.data)).catch(() => {})
  }, [])

  const streamList = Object.entries(streams).filter(([key]) => key !== '_languages')
  const languageOptions = streams._languages || []

  const handleStreamSelect = (key) => {
    setForm(prev => ({ ...prev, stream: key, combination: '', subjects: [] }))
  }

  const handleCombinationSelect = (combo) => {
    const stream = streams[form.stream]
    const subjects = stream.combinations?.[combo] || stream.subjects || stream.sectors || []
    setForm(prev => ({ ...prev, combination: combo, subjects }))
  }

  const toggleLanguage = (lang) => {
    setForm(prev => {
      const langs = prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
      return { ...prev, languages: langs }
    })
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await register(form)
      toast.success('Account created! Check your email for the verification code.')
      navigate(`/verify-code?email=${encodeURIComponent(res.email)}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <motion.div key="step0" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <FiUser size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field" style={{ paddingLeft: 40 }} placeholder="John Doe" required />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Email</label>
              <div style={{ position: 'relative' }}>
                <FiMail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="email" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  className="input-field" style={{ paddingLeft: 40 }} placeholder="your@email.com" required />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <FiLock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="password" value={form.password} onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                  className="input-field" style={{ paddingLeft: 40 }} placeholder="••••••••" required />
              </div>
            </div>
          </motion.div>
        )
      case 1:
        return (
          <motion.div key="step1" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: '0.85rem' }}>Select your stream</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {streamList.map(([key, stream]) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleStreamSelect(key)}
                  style={{
                    padding: '14px 16px', borderRadius: 12, textAlign: 'left',
                    background: form.stream === key ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                    border: `1px solid ${form.stream === key ? 'var(--accent)' : 'var(--border)'}`,
                    color: form.stream === key ? 'var(--accent)' : 'var(--text-primary)',
                    fontWeight: 500, fontSize: '0.95rem',
                    transition: 'all 0.2s'
                  }}
                >
                  {stream.label}
                </motion.button>
              ))}
            </div>
            {form.stream && (
              <div style={{ marginTop: 20 }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: 12, fontSize: '0.85rem' }}>Select your PUC year</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['1st', '2nd'].map(p => (
                    <motion.button
                      key={p}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setForm(prev => ({ ...prev, puc: p }))}
                      style={{
                        flex: 1, padding: '14px 16px', borderRadius: 12,
                        background: form.puc === p ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                        border: `1px solid ${form.puc === p ? 'var(--accent)' : 'var(--border)'}`,
                        color: form.puc === p ? 'var(--accent)' : 'var(--text-primary)',
                        fontWeight: 500, transition: 'all 0.2s'
                      }}
                    >
                      {p} PUC
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )
      case 2: {
        const stream = streams[form.stream]
        if (!stream) return null
        const hasCombinations = !!stream.combinations

        return (
          <motion.div key="step2" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }}>
            {hasCombinations ? (
              <>
                <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: '0.85rem' }}>Select your combination</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {Object.entries(stream.combinations).map(([key, subs]) => (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleCombinationSelect(key)}
                      style={{
                        padding: '14px 16px', borderRadius: 12, textAlign: 'left',
                        background: form.combination === key ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                        border: `1px solid ${form.combination === key ? 'var(--accent)' : 'var(--border)'}`,
                        color: form.combination === key ? 'var(--accent)' : 'var(--text-primary)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>{key}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{subs.join(' • ')}</div>
                    </motion.button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: '0.85rem' }}>Your subjects</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {form.subjects.map((s, i) => (
                    <span key={i} style={{
                      padding: '8px 16px', borderRadius: 20,
                      background: 'var(--accent-glow)', color: 'var(--accent)',
                      border: '1px solid var(--accent)', fontSize: '0.85rem', fontWeight: 500
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )
      }
      case 3: {
        return (
          <motion.div key="step3" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: 4, fontSize: '0.85rem', fontWeight: 600 }}>
              Students generally study:
            </p>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: '0.75rem' }}>
              Choose up to 2 languages
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {languageOptions.map((lang, idx) => {
                const selected = form.languages.includes(lang)
                return (
                  <motion.button
                    key={lang}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      if (selected || form.languages.length < 2) {
                        toggleLanguage(lang)
                      }
                    }}
                    style={{
                      padding: '14px 16px', borderRadius: 12, textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: selected ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                      border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                      color: selected ? 'var(--accent)' : 'var(--text-primary)',
                      opacity: !selected && form.languages.length >= 2 ? 0.5 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: 6,
                      border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: selected ? 'var(--accent)' : 'transparent',
                      transition: 'all 0.2s', flexShrink: 0
                    }}>
                      {selected && <FiCheck size={14} color="white" />}
                    </div>
                    <span style={{ fontWeight: 500 }}>
                      {idx + 1}) {lang}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )
      }
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
        style={{ width: '100%', maxWidth: 480, padding: 40 }}
      >
        <h1 style={{ textAlign: 'center', marginBottom: 8 }}>Create Account</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: 32, fontSize: '0.9rem' }}>
          Step {step + 1} of {steps.length}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
          {steps.map((s, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i === step ? 'var(--accent)' : i < step ? 'var(--success)' : 'var(--border)',
              transition: 'all 0.3s'
            }} />
          ))}
        </div>

        <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
          {step > 0 ? (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setStep(s => s - 1)} className="btn btn-ghost">
              <FiChevronLeft /> Back
            </motion.button>
          ) : <div />}

          {step < steps.length - 1 ? (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setStep(s => s + 1)}
              disabled={(step === 1 && (!form.stream || !form.puc)) || (step === 2 && !form.combination && form.subjects.length === 0)}
              className="btn btn-primary">
              Next <FiChevronRight />
            </motion.button>
          ) : (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleSubmit} disabled={loading || form.languages.length === 0}
              className="btn btn-primary">
              {loading ? 'Creating...' : <><FiUserPlus /> Create Account</>}
            </motion.button>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign In</Link>
        </p>
      </motion.div>
    </div>
  )
}