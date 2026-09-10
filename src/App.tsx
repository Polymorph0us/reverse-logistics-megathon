import type { ReactNode } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from "react-router-dom"
import { useAuthStore } from "./store/useAuthStore"
import { useEffect } from "react"
import { Login } from "./pages/Login"
import { DashboardLayout } from "./layouts/DashboardLayout"
import { VerifyBatch } from "./pages/POS/VerifyBatch"

// Retailer
import { RetailerDashboard } from "./pages/retailer/Dashboard"
import { ExpiringMedicines } from "./pages/retailer/ExpiringMedicines"
import { CreateReturn } from "./pages/retailer/CreateReturn"

// Distributor
import { PendingReturns } from "./pages/distributor/PendingReturns"

// Manufacturer
import { ManufacturerDashboard } from "./pages/manufacturer/Dashboard"

// Waste Facility
import { FacilityDashboard } from "./pages/facility/Dashboard"
import { CertificateView } from "./pages/facility/CertificateView"

// Regulator
import { RegulatorDashboardView } from "./pages/regulator/Dashboard"
import { FraudAlerts } from "./pages/regulator/FraudAlerts"
import { BatchPassportView } from "./pages/shared/BatchPassportView"

// Placeholder pages to resolve imports
const Placeholder = ({ title }: { title: string }) => <div className="p-6"><h1>{title}</h1><p>Under construction...</p></div>

function RequireAuth({ children, allowedRoles }: { children: ReactNode, allowedRoles?: string[] }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />
  return children
}

function RoleBasedRedirect() {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" />
  
  switch (user.role) {
    case "RETAILER": return <Navigate to="/retailer/dashboard" />
    case "DISTRIBUTOR": return <Navigate to="/distributor/dashboard" />
    case "MANUFACTURER": return <Navigate to="/manufacturer/dashboard" />
    case "WASTE_FACILITY": return <Navigate to="/facility/dashboard" />
    case "REGULATOR":
    case "ADMIN": return <Navigate to="/regulator/dashboard" />
    default: return <Navigate to="/login" />
  }
}

function RoleQueryInterceptor() {
  const [searchParams] = useSearchParams()
  const { loginUser, user } = useAuthStore()
  
  useEffect(() => {
    const role = searchParams.get("role")?.toUpperCase()
    if (role && ["RETAILER", "DISTRIBUTOR", "MANUFACTURER", "WASTE_FACILITY", "REGULATOR", "ADMIN"].includes(role)) {
      if (!user || user.role !== role) {
        loginUser(role as any)
      }
    }
  }, [searchParams, loginUser, user])
  
  return null
}

export default function App() {
  return (
    <Router>
      <RoleQueryInterceptor />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<VerifyBatch />} />
        
        <Route path="/" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
          <Route index element={<RoleBasedRedirect />} />
          
          <Route path="batch/:batchId" element={<BatchPassportView />} />

          {/* Retailer */}
          <Route path="retailer/dashboard" element={<RequireAuth allowedRoles={["RETAILER"]}><RetailerDashboard /></RequireAuth>} />
          <Route path="retailer/inventory" element={<RequireAuth allowedRoles={["RETAILER"]}><Placeholder title="Inventory" /></RequireAuth>} />
          <Route path="retailer/expiring" element={<RequireAuth allowedRoles={["RETAILER"]}><ExpiringMedicines /></RequireAuth>} />
          <Route path="retailer/return/:batchId" element={<RequireAuth allowedRoles={["RETAILER"]}><CreateReturn /></RequireAuth>} />

          {/* Distributor */}
          <Route path="distributor/dashboard" element={<RequireAuth allowedRoles={["DISTRIBUTOR"]}><Placeholder title="Distributor Dashboard" /></RequireAuth>} />
          <Route path="distributor/returns" element={<RequireAuth allowedRoles={["DISTRIBUTOR"]}><PendingReturns /></RequireAuth>} />

          {/* Manufacturer */}
          <Route path="manufacturer/dashboard" element={<RequireAuth allowedRoles={["MANUFACTURER"]}><ManufacturerDashboard /></RequireAuth>} />
          <Route path="manufacturer/schedule-destruction" element={<RequireAuth allowedRoles={["MANUFACTURER"]}><Placeholder title="Schedule Destruction" /></RequireAuth>} />

          {/* Waste Facility */}
          <Route path="facility/dashboard" element={<RequireAuth allowedRoles={["WASTE_FACILITY"]}><FacilityDashboard /></RequireAuth>} />
          <Route path="facility/certificate/:batchId" element={<RequireAuth allowedRoles={["WASTE_FACILITY", "MANUFACTURER", "REGULATOR"]}><CertificateView /></RequireAuth>} />

          {/* Regulator */}
          <Route path="regulator/dashboard" element={<RequireAuth allowedRoles={["REGULATOR", "ADMIN"]}><RegulatorDashboardView /></RequireAuth>} />
          <Route path="regulator/alerts" element={<RequireAuth allowedRoles={["REGULATOR", "ADMIN"]}><FraudAlerts /></RequireAuth>} />
          <Route path="regulator/investigation/:alertId" element={<RequireAuth allowedRoles={["REGULATOR", "ADMIN"]}><Placeholder title="Investigation" /></RequireAuth>} />
        </Route>
      </Routes>
    </Router>
  )
}
