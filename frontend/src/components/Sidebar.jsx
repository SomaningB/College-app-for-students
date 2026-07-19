import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { FiGrid, FiBook, FiUsers, FiUserPlus, FiCpu, FiUser, FiLogOut, FiShield, FiUpload, FiX, FiFolder, FiSearch } from 'react-icons/fi'

const studentItems = [
  { to: '/app/dashboard', icon: FiGrid, label: 'Dashboard' },
  { to: '/app/search', icon: FiSearch, label: 'Search' },
  { to: '/app/contribute', icon: FiUpload, label: 'Contribute' },
  { to: '/app/my-notes', icon: FiFolder, label: 'My Notes' },
  { to: '/app/communities', icon: FiUsers, label: 'Communities' },
  { to: '/app/ai-assistant', icon: FiCpu, label: 'AI Assistant' },
  { to: '/app/profile', icon: FiUser, label: 'Profile' },
]

const teacherItems = [
  { to: '/app/dashboard', icon: FiGrid, label: 'Dashboard' },
  { to: '/app/search', icon: FiSearch, label: 'Search' },
  { to: '/app/contribute', icon: FiUpload, label: 'Contribute' },
  { to: '/app/my-notes', icon: FiFolder, label: 'My Notes' },
  { to: '/app/ai-assistant', icon: FiCpu, label: 'AI Assistant' },
  { to: '/app/communities', icon: FiUsers, label: 'Communities' },
]

const adminItems = [
  { to: '/app/admin', icon: FiShield, label: 'Admin Dashboard' },
  { to: '/app/admin/materials', icon: FiBook, label: 'Materials' },
  { to: '/app/admin/users', icon: FiUsers, label: 'Students' },
  { to: '/app/admin/teachers', icon: FiUserPlus, label: 'Teachers' },
]

export default function Sidebar({ isOpen, onToggle }) {
  const { user, logout } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isTeacher = user?.role === 'teacher'

  return (
    <motion.aside
      animate={{ width: isOpen ? 260 : 0 }}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        background: 'rgba(26, 26, 46, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRight: isOpen ? '1px solid var(--border)' : 'none',
        zIndex: 105,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{
        padding: '20px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        minWidth: 260
      }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isOpen ? 1 : 0 }}
          className="text-3d"
          style={{
            background: 'var(--gradient-1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
            fontSize: '1.3rem'
          }}
        >
          CollegeApp
        </motion.div>
        <button onClick={onToggle} className="btn btn-ghost" style={{ padding: 8, borderRadius: 8, minWidth: 36, justifyContent: 'center' }}>
          <FiX size={18} />
        </button>
      </div>

      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 260, overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {(isTeacher ? teacherItems : studentItems).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onToggle}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 10,
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-glow)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              fontWeight: isActive ? 600 : 400
            })}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
        {isTeacher && (
          <div style={{ padding: '16px 12px 8px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)' }}>
            Teacher
          </div>
        )}
        {isTeacher && (
          <NavLink to="/app/teacher" onClick={onToggle}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 10,
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-glow)' : 'transparent',
              textDecoration: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap',
              fontWeight: isActive ? 600 : 400
            })}>
            <FiUpload size={20} />
            <span>My Uploads</span>
          </NavLink>
        )}
        {isAdmin && (
          <div style={{ padding: '16px 12px 8px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)' }}>
            Admin
          </div>
        )}
        {isAdmin && adminItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onToggle}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 10,
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive ? 'var(--accent-glow)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              fontWeight: isActive ? 600 : 400
            })}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)', minWidth: 260 }}>
        {user && (
          <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            @{user.unique_id}
          </div>
        )}
        <button onClick={() => { logout(); onToggle(); }} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 12px',
          borderRadius: 10,
          color: 'var(--text-muted)',
          background: 'transparent',
          width: '100%',
          fontSize: '0.9rem',
          transition: 'all 0.2s',
          border: 'none',
          cursor: 'pointer'
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--error)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <FiLogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </motion.aside>
  )
}
