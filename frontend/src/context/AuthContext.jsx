import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'
import chatWS from '../services/websocket'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = sessionStorage.getItem('token')
    const savedUser = sessionStorage.getItem('user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
      chatWS.connect(savedToken)
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password })
    const { token: newToken, user: userData } = res.data
    sessionStorage.setItem('token', newToken)
    sessionStorage.setItem('user', JSON.stringify(userData))
    setToken(newToken)
    setUser(userData)
    chatWS.connect(newToken)
    return userData
  }

  const register = async (userData) => {
    const res = await authAPI.register(userData)
    return res.data
  }

  const logout = () => {
    chatWS.disconnect()
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
