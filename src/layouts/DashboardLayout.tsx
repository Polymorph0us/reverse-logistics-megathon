import { Outlet, Link, useNavigate, useLocation } from "react-router-dom"
import { useAuthStore } from "@/store/useAuthStore"
import { LayoutDashboard, Package, AlertTriangle, FileText, LogOut, Activity, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DashboardLayout() {
  const { user, logout } = useAuthStore()
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
        ]
      case "MANUFACTURER":
        return [
          { label: "Dashboard", href: "/manufacturer/dashboard", icon: LayoutDashboard },
          { label: "Destructions", href: "/manufacturer/schedule-destruction", icon: FileText },
        ]
      case "WASTE_FACILITY":
        return [
          { label: "Dashboard", href: "/facility/dashboard", icon: LayoutDashboard },
        ]
      case "REGULATOR":
      case "ADMIN":
        return [
          { label: "Dashboard", href: "/regulator/dashboard", icon: LayoutDashboard },
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
        
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-900">{user.organizationName}</p>
          <p className="text-xs text-gray-500 capitalize">{user.role.toLowerCase()}</p>
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

      <main className="flex-1 overflow-auto bg-gray-50/50">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
