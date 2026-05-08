import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { User } from '../types'
import { api } from '../utils/request'

interface LoginResponse {
  token: string
  user: User
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, nickname: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const currentUser = await api.get<User>('/auth/me')
          setUser(currentUser)
        } catch {
          localStorage.removeItem('token')
          setToken(null)
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [token])

  const login = async (username: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/login', {
      username,
      password,
    })
    localStorage.setItem('token', response.token)
    setToken(response.token)
    setUser(response.user)
  }

  const register = async (username: string, password: string, nickname: string) => {
    const response = await api.post<LoginResponse>('/auth/register', {
      username,
      password,
      nickname,
    })
    localStorage.setItem('token', response.token)
    setToken(response.token)
    setUser(response.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
