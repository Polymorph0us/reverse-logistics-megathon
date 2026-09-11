import { Outlet, Link, useNavigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/store/useAuthStore"
import { useSharedStore } from "@/store/useSharedStore"
import { LayoutDashboard, Package, AlertTriangle, FileText, LogOut, Activity, ShieldAlert, ShieldCheck, Bell, GitBranch, ScanLine, Truck, Flame, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function DashboardLayout() {
  const { user, loginUser, logout } = useAuthStore()
  const notifications = useSharedStore(state => state.notifications)
  const unreadCount = notifications.filter(n => !n.read).length
  const navigate = useNavigate()
  const location = useLocation()

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
          <Activity className="w-6 h-6 text-emerald-600 mr-2" />
          <span className="font-bold text-lg text-gray-900">RxTrack</span>
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
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive 
                    ? "bg-emerald-50 text-emerald-700" 
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? "text-emerald-500" : "text-gray-400"}`} />
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
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-8 space-x-6">
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
            
            <button className="relative p-2 text-gray-400 hover:text-gray-500 transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-in zoom-in">
                  {unreadCount}
                </span>
              )}
            </button>
        </header>
        
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
