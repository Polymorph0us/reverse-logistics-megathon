import { useState, useEffect, useRef } from "react"
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/store/useAuthStore"
import { useSharedStore } from "@/store/useSharedStore"
import { runAutomatedExpiryCheck } from "@/utils/expirySentinel"
import { LayoutDashboard, Package, AlertTriangle, FileText, LogOut, Activity, ShieldAlert, ShieldCheck, Bell, GitBranch, ScanLine, Truck, Flame, Building2, Plus, CheckCheck, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function DashboardLayout() {
  const { user, loginUser, logout } = useAuthStore()
  const notifications = useSharedStore(state => state.notifications)
  const markNotificationRead = useSharedStore(state => state.markNotificationRead)
  const clearNotifications = useSharedStore(state => state.clearNotifications)
  const [showNotifications, setShowNotifications] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  // Run automated 60-day expiry check and auto-return generation
  useEffect(() => {
    runAutomatedExpiryCheck()
  }, [])

  // Filter notifications for current user's role
  const roleNotifications = notifications.filter(n => {
    if (!n.targetRole) return true;
    return n.targetRole === user?.role;
  })
  const unreadCount = roleNotifications.filter(n => !n.read).length
  const navigate = useNavigate()
  const location = useLocation()

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (!user) return null

  const getNavItems = () => {
    switch (user.role) {
      case "RETAILER":
        return [
          { label: "Dashboard", href: "/retailer/dashboard", icon: LayoutDashboard },
          { label: "Inventory", href: "/retailer/inventory", icon: Package },
          { label: "Expiring Soon", href: "/retailer/expiring", icon: AlertTriangle },
        ]
      case "DISTRIBUTOR":
        return [
          { label: "Dashboard", href: "/distributor/dashboard", icon: LayoutDashboard },
          { label: "Pending Returns", href: "/distributor/returns", icon: Package },
          { label: "Crate Consolidation", href: "/distributor/consolidation", icon: GitBranch },
        ]
      case "MANUFACTURER":
        return [
          { label: "Dashboard",           href: "/manufacturer/dashboard",        icon: LayoutDashboard },
          { label: "OEM Intake & Denaturing",href: "/manufacturer/intake",         icon: ScanLine },
          { label: "CBWTF Pickup Scheduler",href: "/manufacturer/cbwtf-scheduler", icon: Truck },
          { label: "Schedule Destruction", href: "/manufacturer/schedule-destruction", icon: FileText },
        ]
      case "WASTE_FACILITY":
        return [
          { label: "Dashboard",         href: "/facility/dashboard",     icon: LayoutDashboard },
          { label: "Kiln Incineration", href: "/facility/kiln",          icon: Flame },
          { label: "Certificates",      href: "/facility/certificate",   icon: ShieldCheck },
        ]
      case "REGULATOR":
      case "ADMIN":
        return [
          { label: "Dashboard", href: "/regulator/dashboard", icon: LayoutDashboard },
          { label: "Organizations", href: "/regulator/organizations", icon: Building2 },
          { label: "Fraud Alerts", href: "/regulator/alerts", icon: ShieldAlert },
        ]
      default:
        return []
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <img src="/src/assets/logo.png" alt="DrugLines Logo" className="w-12 h-12 mr-3 object-contain drop-shadow-sm" />
          <span className="font-bold tracking-tight text-xl text-brand-text">DrugLines</span>
        </div>
        
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{user.organizationName}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role.toLowerCase()}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {getNavItems().map((item) => {
            const Icon = item.icon
            const isActive = location.pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive 
                    ? "bg-brand-primary/10 text-brand-primary shadow-sm" 
                    : "text-brand-muted hover:bg-gray-100/50 hover:text-brand-text"
                }`}
              >
                <Icon className={`mr-3 h-[18px] w-[18px] ${isActive ? "text-brand-primary" : "text-gray-400"}`} strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <main className="flex-1 overflow-hidden flex flex-col bg-gray-50/50">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div>
            <Link 
              to="/organizations?onboard=true" 
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 active:bg-brand-primary/80 rounded-full transition-colors shadow-sm interactive-card"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Organization</span>
            </Link>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Quick Switch:</span>
              <Select value={user.role} onValueChange={(v) => loginUser(v as any)}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RETAILER">Retailer</SelectItem>
                  <SelectItem value="DISTRIBUTOR">Distributor</SelectItem>
                  <SelectItem value="MANUFACTURER">Manufacturer</SelectItem>
                  <SelectItem value="WASTE_FACILITY">Waste Facility</SelectItem>
                  <SelectItem value="REGULATOR">Regulator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifications(prev => !prev)}
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="System & Regulatory Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-in zoom-in">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider">CDSCO & System Alerts</span>
                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                          {unreadCount} New
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button 
                          onClick={() => {
                            roleNotifications.forEach(n => markNotificationRead(n.id))
                          }}
                          className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <CheckCheck className="w-3 h-3 text-emerald-400" />
                          Mark read
                        </button>
                      )}
                      {roleNotifications.length > 0 && (
                        <button 
                          onClick={() => clearNotifications()}
                          className="text-[10px] text-slate-300 hover:text-red-300 flex items-center gap-1 hover:underline cursor-pointer"
                          title="Remove all notification history"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                          Clear history
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                    {roleNotifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-gray-400">
                        No active alerts or notifications.
                      </div>
                    ) : (
                      roleNotifications.map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-3 text-xs transition-colors cursor-pointer hover:bg-gray-50 ${!n.read ? 'bg-amber-50/40' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              n.severity === "CRITICAL" ? "bg-red-100 text-red-700 border border-red-200" :
                              n.severity === "WARNING" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                              "bg-blue-100 text-blue-800 border border-blue-200"
                            }`}>
                              {n.type.replace(/_/g, " ")}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="font-bold text-gray-900 mb-0.5">{n.title}</p>
                          <p className="text-gray-600 leading-relaxed text-[11px]">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
