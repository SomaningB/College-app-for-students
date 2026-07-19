import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ThreeBackground from '../components/ThreeBackground'

export default function Terms() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <ThreeBackground />
      <div style={{ position: 'relative', zIndex: 1, flex: 1, padding: 40, maxWidth: 800, margin: '0 auto' }}>
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <Link to="/" style={{
            background: 'var(--gradient-1)', WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent', fontWeight: 800, fontSize: '1.4rem',
            textDecoration: 'none'
          }}>CollegeApp</Link>
          <Link to="/" className="btn btn-ghost" style={{ padding: '8px 16px', borderRadius: 8, textDecoration: 'none', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>Back to Home</Link>
        </nav>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 24, background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Terms & Conditions</h1>

          <div className="card" style={{ padding: 32, background: 'rgba(26, 26, 46, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid var(--border)', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
            <h2 style={{ color: 'var(--text)', fontSize: '1.2rem', fontWeight: 600, marginTop: 24, marginBottom: 8 }}>1. Acceptance of Terms</h2>
            <p>By accessing and using CollegeApp, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the platform.</p>

            <h2 style={{ color: 'var(--text)', fontSize: '1.2rem', fontWeight: 600, marginTop: 24, marginBottom: 8 }}>2. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information during registration. You must be a college/PUC student to use this platform.</p>

            <h2 style={{ color: 'var(--text)', fontSize: '1.2rem', fontWeight: 600, marginTop: 24, marginBottom: 8 }}>3. Acceptable Use</h2>
            <p>You agree not to misuse the platform for any unlawful purpose. This includes but is not limited to: sharing harmful content, impersonating others, spamming, or disrupting the experience of other users.</p>

            <h2 style={{ color: 'var(--text)', fontSize: '1.2rem', fontWeight: 600, marginTop: 24, marginBottom: 8 }}>4. Content Guidelines</h2>
            <p>Community discussions and shared materials must be respectful and relevant to academic purposes. We reserve the right to remove any content that violates these guidelines.</p>

            <h2 style={{ color: 'var(--text)', fontSize: '1.2rem', fontWeight: 600, marginTop: 24, marginBottom: 8 }}>5. Privacy</h2>
            <p>We respect your privacy. Your personal information is used only to provide and improve our services. We do not share your data with third parties without your consent.</p>

            <h2 style={{ color: 'var(--text)', fontSize: '1.2rem', fontWeight: 600, marginTop: 24, marginBottom: 8 }}>6. Limitation of Liability</h2>
            <p>CollegeApp is provided "as is" without any warranty. We are not liable for any damages arising from the use of this platform. We reserve the right to modify or discontinue the service at any time.</p>

            <h2 style={{ color: 'var(--text)', fontSize: '1.2rem', fontWeight: 600, marginTop: 24, marginBottom: 8 }}>7. Contact</h2>
            <p>For any questions regarding these terms, contact us at <a href="mailto:somaning58belagavakar@gmail.com" style={{ color: 'var(--accent)' }}>somaning58belagavakar@gmail.com</a>.</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
