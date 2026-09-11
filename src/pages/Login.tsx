import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/useAuthStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield } from "lucide-react"

export function Login() {
  const [role, setRole] = useState<string>("RETAILER")
  const { loginUser, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    await loginUser(role as any)
    navigate("/")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center pb-8 pt-8">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-emerald-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">RxTrack</CardTitle>
          <CardDescription className="text-gray-500 mt-2">
            Closed-Loop Medicine Tracking Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Select Demo Role</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="w-full h-12">
                  <SelectValue placeholder="Select a role" />
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
            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Access Dashboard"}
            </Button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400">
              For demo purposes, password is not required.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
