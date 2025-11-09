import { create } from 'zustand'
import { apiClient } from '../api/client'

interface User {
  id: string
  email: string
  name: string
  phone?: string
  company_name?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  userType: 'tenant' | 'owner' | null
  setUserType: (userType: 'tenant' | 'owner') => void
  login: (phoneNumber: string, password: string, userType?: 'tenant' | 'owner') => Promise<void>
  register: (email: string, password: string, name: string, company_name?: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  userType: null,

  setUserType: (userType: 'tenant' | 'owner') => {
    localStorage.setItem('userType', userType)
    set({ userType, user: { id: 'guest', email: 'guest@homemates.com', name: userType === 'tenant' ? 'Tenant' : 'Owner' } })
  },

  login: async (phoneNumber: string, password: string, userType: 'tenant' | 'owner' = 'tenant') => {
    const response = await apiClient.post('/auth/login', { 
      phone_number: phoneNumber, 
      password,
      user_type: userType 
    })
    const { token, user } = response.data
    localStorage.setItem('token', token)
    localStorage.setItem('userType', userType)
    set({ user, token, userType, isLoading: false })
  },

  register: async (email: string, password: string, name: string, company_name?: string) => {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      name,
      company_name,
    })
    const { token, user } = response.data
    localStorage.setItem('token', token)
    set({ user, token, isLoading: false })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userType')
    set({ user: null, token: null, userType: null })
  },

  checkAuth: async () => {
    // Prevent multiple simultaneous checks
    if (get().isLoading === false && get().user) {
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      set({ user: null, token: null, isLoading: false })
      return
    }

    try {
      // Decode JWT token to get user info
      const parts = token.split('.')
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(atob(parts[1]))
          // Check if token is expired
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            localStorage.removeItem('token')
            set({ user: null, token: null, isLoading: false })
            return
          }
          // Set user from token payload
          const storedUserType = localStorage.getItem('userType') as 'tenant' | 'owner' | null
          set({ 
            token, 
            user: {
              id: payload.id || payload.builderId || '',
              email: payload.email || payload.phone || '',
              name: payload.name || '',
              phone: payload.phone || payload.email || '',
              company_name: payload.company_name
            },
            userType: storedUserType,
            isLoading: false 
          })
        } catch (e) {
          // Invalid token format
          localStorage.removeItem('token')
          set({ user: null, token: null, isLoading: false })
        }
      } else {
        // Invalid token
        localStorage.removeItem('token')
        set({ user: null, token: null, isLoading: false })
      }
    } catch (error) {
      localStorage.removeItem('token')
      set({ user: null, token: null, isLoading: false })
    }
  },
}))

