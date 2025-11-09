'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Phone, 
  Settings, 
  FileText, 
  Database,
  LogOut,
  Home,
  UserCheck,
  Plus,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/lib/store/auth'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const tenantNavigation = [
  { name: 'Properties', href: '/dashboard/properties', icon: Home },
]

const ownerNavigation = [
  { name: 'Leads', href: '/dashboard/leads', icon: UserCheck },
  { name: 'Properties', href: '/dashboard/properties', icon: Home },
  { name: 'Add Property', href: '/dashboard/properties-owner', icon: Plus },
]

export function Sidebar() {
  const pathname = usePathname()
  const { logout, userType } = useAuthStore()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Get navigation based on user type
  const navigation = userType === 'owner' ? ownerNavigation : tenantNavigation

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-700" />
          ) : (
            <Menu className="h-6 w-6 text-gray-700" />
          )}
        </button>
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex h-screen w-64 flex-col bg-white/90 backdrop-blur-sm border-r shadow-lg">
        <div className="flex h-16 items-center px-6 border-b bg-gradient-to-r from-homie-blue to-homie-blue-light">
          <h1 className="text-xl font-bold text-white">Homemates</h1>
        </div>
        <div className="px-6 py-2 border-b bg-gray-50">
          <p className="text-xs text-muted-foreground uppercase font-semibold">
            {userType === 'owner' ? 'Owner Portal' : 'Tenant Portal'}
          </p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "homie-gradient text-white shadow-lg"
                    : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="border-t p-4 bg-gray-50">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-gray-100 hover:text-foreground transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="lg:hidden fixed inset-y-0 left-0 w-64 bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex h-16 items-center justify-between px-6 border-b bg-gradient-to-r from-homie-blue to-homie-blue-light">
              <h1 className="text-xl font-bold text-white">Homemates</h1>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            <div className="px-6 py-2 border-b bg-gray-50">
              <p className="text-xs text-muted-foreground uppercase font-semibold">
                {userType === 'owner' ? 'Owner Portal' : 'Tenant Portal'}
              </p>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "homie-gradient text-white shadow-lg"
                        : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <div className="border-t p-4 bg-gray-50">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-gray-100 hover:text-foreground transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
