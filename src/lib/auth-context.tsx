"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { apiClient } from "./api-client"
import { handleError } from "./error-handler"

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored token on mount
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem("token")
      if (storedToken) {
        setToken(storedToken)
        // TODO: Fetch user data using the token
      }
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const { token: newToken } = await apiClient.auth.login(email, password)
      setToken(newToken)
      if (typeof window !== 'undefined') {
        localStorage.setItem("token", newToken)
      }
      // TODO: Fetch user data using the token
    } catch (error) {
      handleError(error)
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem("token")
    }
  }

  if (isLoading) {
    return null // or a loading spinner
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 
