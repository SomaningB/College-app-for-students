import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { AnimatePresence } from 'framer-motion'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyCode from './pages/VerifyCode'
import Dashboard from './pages/Dashboard'
import SubjectDetail from './pages/SubjectDetail'
import Chat from './pages/Chat'
import Communities from './pages/Communities'
import CommunityChat from './pages/CommunityChat'
import Friends from './pages/Friends'
import AIAssistant from './pages/AIAssistant'
import Profile from './pages/Profile'
import MyNotes from './pages/MyNotes'
import Search from './pages/Search'
import Landing from './pages/Landing'
import TeacherDashboard from './pages/TeacherDashboard'
import AdminTeachers from './pages/AdminTeachers'
import AdminDashboard from './pages/AdminDashboard'
import AdminMaterials from './pages/AdminMaterials'
import AdminUsers from './pages/AdminUsers'
import Contribute from './pages/Contribute'
import Layout from './components/Layout'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen" />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/app/dashboard" replace />
  return children
}

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="subjects/:subject" element={<SubjectDetail />} />
          <Route path="chat/:uniqueId" element={<Chat />} />
          <Route path="chat" element={<Chat />} />
          <Route path="communities" element={<Communities />} />
          <Route path="communities/:id" element={<CommunityChat />} />
          <Route path="friends" element={<Friends />} />
          <Route path="ai-assistant" element={<AIAssistant />} />
          <Route path="profile" element={<Profile />} />
          <Route path="contribute" element={<Contribute />} />
          <Route path="my-notes" element={<MyNotes />} />
          <Route path="search" element={<Search />} />
          <Route path="teacher" element={<TeacherDashboard />} />
          <Route path="admin/teachers" element={<AdminTeachers />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/materials" element={<AdminMaterials />} />
          <Route path="admin/users" element={<AdminUsers />} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}
