import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ThreeBackground from '../components/ThreeBackground'
import { FiArrowRight, FiBook, FiCpu, FiUsers, FiMail, FiUser } from 'react-icons/fi'

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <ThreeBackground />
      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <nav style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 40px', backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--border)'
        }}>
          <span style={{
            background: 'var(--gradient-1)', WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent', fontWeight: 800, fontSize: '1.4rem'
          }}>
            CollegeApp
          </span>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/login" className="btn" style={{
              padding: '10px 24px', borderRadius: 10,
              border: '1px solid var(--border)', color: 'var(--text-secondary)',
              textDecoration: 'none', fontWeight: 500
            }}>Log In</Link>
            <Link to="/register" className="btn btn-primary" style={{
              padding: '10px 24px', borderRadius: 10,
              textDecoration: 'none', fontWeight: 500
            }}>Sign Up</Link>
          </div>
        </nav>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={{ maxWidth: 900, textAlign: 'center' }}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <h1 style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: 16,
                background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>
                Your All-in-One PUC Study Platform
              </h1>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.7 }}>
                Access study materials, chat with AI for instant help, collaborate with classmates,
                and stay organized — everything you need for PUC success in one place.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginBottom: 48 }}>
              {[
                { icon: FiBook, label: 'Study Materials', desc: 'Subject-wise notes from teachers and peers' },
                { icon: FiCpu, label: 'AI Assistant', desc: 'Chat with AI to understand any topic' },
                { icon: FiUsers, label: 'Communities', desc: 'Join subject groups & study together' },
                { icon: FiMail, label: 'Stay Connected', desc: 'Collaborate and learn together in groups' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="card" style={{
                  flex: '1 1 180px', padding: 24, textAlign: 'center',
                  background: 'rgba(26, 26, 46, 0.6)', backdropFilter: 'blur(12px)',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: 'var(--accent-glow)', color: 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px', fontSize: 22
                  }}><Icon /></div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{desc}</div>
                </div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="btn btn-primary" style={{
                    padding: '16px 40px', borderRadius: 14, fontSize: '1.1rem',
                    display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 600
                  }}>
                  Get Started <FiArrowRight size={20} />
                </motion.button>
              </Link>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="btn" style={{
                    padding: '16px 40px', borderRadius: 14, fontSize: '1.1rem',
                    display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 600,
                    border: '1px solid var(--border)', color: 'var(--text-secondary)',
                    background: 'transparent'
                  }}>
                  Log In
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          style={{ borderTop: '1px solid var(--border)', padding: '60px 40px', backdropFilter: 'blur(10px)' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 16, background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>About Us</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.7 }}>
              CollegeApp is built by students, for students. Our mission is to make PUC education accessible,
              collaborative, and engaging through technology.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'var(--accent-glow)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28
              }}><FiUser /></div>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>Somaning Belagavakar</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Creator & Developer</div>
              <a href="mailto:somaning58belagavakar@gmail.com" style={{
                color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem',
                display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4
              }}>
                <FiMail size={14} /> somaning58belagavakar@gmail.com
              </a>
            </div>
          </div>
        </motion.div>

        <footer style={{
          borderTop: '1px solid var(--border)', padding: '20px 40px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12, backdropFilter: 'blur(10px)',
          fontSize: '0.85rem', color: 'var(--text-muted)'
        }}>
          <span>&copy; {new Date().getFullYear()} CollegeApp. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 16 }}>
            <Link to="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms & Conditions</Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
