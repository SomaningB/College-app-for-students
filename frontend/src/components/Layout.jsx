import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import ThreeBackground from './ThreeBackground'
import { FiMenu } from 'react-icons/fi'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      <ThreeBackground />
      {!sidebarOpen && (
        <motion.button
          onClick={() => setSidebarOpen(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 12,
            left: 12,
            zIndex: 110,
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)'
          }}
        >
          <FiMenu size={18} />
        </motion.button>
      )}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <motion.main
        layout
        style={{
          flex: 1,
          marginLeft: sidebarOpen ? 260 : 0,
          transition: 'margin 0.3s ease',
          padding: '24px',
          paddingTop: 64,
          minHeight: '100vh',
          overflow: 'auto',
          position: 'relative',
          zIndex: 1,
          perspective: '1000px'
        }}
      >
        <div style={{
          transformStyle: 'preserve-3d',
          perspective: '1000px'
        }}>
          <Outlet />
        </div>
      </motion.main>
      <MobileNav />
    </div>
  )
}
