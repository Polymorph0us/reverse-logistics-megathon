import type { ReactNode } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from "react-router-dom"
import { useAuthStore } from "./store/useAuthStore"
import { useEffect } from "react"
import { Login } from "./pages/Login"
import { DashboardLayout } from "./layouts/DashboardLayout"
import { VerifyBatch } from "./pages/POS/VerifyBatch"

// Retailer
import { RetailerDashboard } from "./pages/retailer/Dashboard"
import { RetailerInventory } from "./pages/retailer/Inventory"
import { ExpiringMedicines } from "./pages/retailer/ExpiringMedicines"
import { CreateReturn } from "./pages/retailer/CreateReturn"

// Distributor
import { DistributorDashboard } from "./pages/distributor/Dashboard"
import { PendingReturns } from "./pages/distributor/PendingReturns"
import { Consolidation } from "./pages/distributor/Consolidation"

// Manufacturer
import { ManufacturerDashboard } from "./pages/manufacturer/Dashboard"
import { ScheduleDestruction } from "./pages/manufacturer/ScheduleDestruction"
import { ManufacturerIntake } from "./pages/manufacturer/ManufacturerIntake"
import { CBWTFScheduler } from "./pages/manufacturer/CBWTFScheduler"

// Waste Facility
import { FacilityDashboard } from "./pages/facility/Dashboard"
import { CertificateView } from "./pages/facility/CertificateView"
import { KilnIncineration } from "./pages/facility/KilnIncineration"

// Regulator
import { RegulatorDashboardView } from "./pages/regulator/Dashboard"
import { FraudAlerts } from "./pages/regulator/FraudAlerts"
import { Investigation } from "./pages/regulator/Investigation"
import { OrganizationsDirectory } from "./pages/regulator/OrganizationsDirectory"
import { BatchPassportView } from "./pages/shared/BatchPassportView"

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
          <Route path="organizations" element={<OrganizationsDirectory />} />

          {/* Retailer */}
          <Route path="retailer/dashboard" element={<RequireAuth allowedRoles={["RETAILER"]}><RetailerDashboard /></RequireAuth>} />
          <Route path="retailer/inventory" element={<RequireAuth allowedRoles={["RETAILER"]}><RetailerInventory /></RequireAuth>} />
          <Route path="retailer/expiring" element={<RequireAuth allowedRoles={["RETAILER"]}><ExpiringMedicines /></RequireAuth>} />
          <Route path="retailer/return/:batchId" element={<RequireAuth allowedRoles={["RETAILER"]}><CreateReturn /></RequireAuth>} />

          {/* Distributor */}
          <Route path="distributor/dashboard" element={<RequireAuth allowedRoles={["DISTRIBUTOR"]}><DistributorDashboard /></RequireAuth>} />
          <Route path="distributor/returns" element={<RequireAuth allowedRoles={["DISTRIBUTOR"]}><PendingReturns /></RequireAuth>} />
          <Route path="distributor/consolidation" element={<RequireAuth allowedRoles={["DISTRIBUTOR"]}><Consolidation /></RequireAuth>} />

          {/* Manufacturer */}
          <Route path="manufacturer/dashboard" element={<RequireAuth allowedRoles={["MANUFACTURER"]}><ManufacturerDashboard /></RequireAuth>} />
          <Route path="manufacturer/intake" element={<RequireAuth allowedRoles={["MANUFACTURER"]}><ManufacturerIntake /></RequireAuth>} />
          <Route path="manufacturer/cbwtf-scheduler" element={<RequireAuth allowedRoles={["MANUFACTURER"]}><CBWTFScheduler /></RequireAuth>} />
          <Route path="manufacturer/schedule-destruction" element={<RequireAuth allowedRoles={["MANUFACTURER"]}><ScheduleDestruction /></RequireAuth>} />

          {/* Waste Facility */}
          <Route path="facility/dashboard" element={<RequireAuth allowedRoles={["WASTE_FACILITY"]}><FacilityDashboard /></RequireAuth>} />
          <Route path="facility/kiln" element={<RequireAuth allowedRoles={["WASTE_FACILITY"]}><KilnIncineration /></RequireAuth>} />
          <Route path="facility/certificate" element={<RequireAuth allowedRoles={["WASTE_FACILITY", "MANUFACTURER", "REGULATOR"]}><CertificateView /></RequireAuth>} />
          <Route path="facility/certificate/:batchId" element={<RequireAuth allowedRoles={["WASTE_FACILITY", "MANUFACTURER", "REGULATOR"]}><CertificateView /></RequireAuth>} />

          {/* Regulator */}
          <Route path="regulator/dashboard" element={<RequireAuth allowedRoles={["REGULATOR", "ADMIN"]}><RegulatorDashboardView /></RequireAuth>} />
          <Route path="regulator/organizations" element={<RequireAuth allowedRoles={["REGULATOR", "ADMIN"]}><OrganizationsDirectory /></RequireAuth>} />
          <Route path="regulator/alerts" element={<RequireAuth allowedRoles={["REGULATOR", "ADMIN"]}><FraudAlerts /></RequireAuth>} />
          <Route path="regulator/investigation/:alertId" element={<RequireAuth allowedRoles={["REGULATOR", "ADMIN"]}><Investigation /></RequireAuth>} />
        </Route>
      </Routes>
    </Router>
  )
}
