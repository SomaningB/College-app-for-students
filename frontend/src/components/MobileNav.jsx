import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { FiGrid, FiUsers, FiCpu, FiLogOut } from 'react-icons/fi'

export default function MobileNav() {
  const { logout } = useAuth()

  const items = [
    { to: '/dashboard', icon: FiGrid, label: 'Home' },
    { to: '/communities', icon: FiUsers, label: 'Communities' },
    { to: '/ai-assistant', icon: FiCpu, label: 'AI' },
  ]

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 100 }}
      style={{
        display: 'none',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(26, 26, 46, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
        padding: '8px 0',
        zIndex: 100,
        justifyContent: 'space-around'
      }}
      className="mobile-nav"
    >
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            padding: '6px 12px',
            color: isActive ? 'var(--accent)' : 'var(--text-muted)',
            textDecoration: 'none',
            fontSize: '0.7rem',
            fontWeight: isActive ? 600 : 400,
            transition: 'all 0.3s ease'
          })}
        >
          <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
            <Icon size={20} />
          </motion.div>
          <span>{label}</span>
        </NavLink>
      ))}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={logout}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          padding: '6px 12px',
          color: 'var(--text-muted)',
          background: 'none',
          border: 'none',
          fontSize: '0.7rem',
          cursor: 'pointer'
        }}
      >
        <FiLogOut size={20} />
        <span>Logout</span>
      </motion.button>
    </motion.nav>
  )
}
