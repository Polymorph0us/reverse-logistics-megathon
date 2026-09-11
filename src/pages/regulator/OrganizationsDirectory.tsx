import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { useSharedStore } from "@/store/useSharedStore"
import { getOrganizations, createOrganization } from "@/api/mockApi"
import type { OrganizationNode, SectorType } from "@/api/types"
import { 
  Building2, 
  Factory, 
  Truck, 
  Store, 
  Flame, 
  ShieldCheck, 
  Plus, 
  Search, 
  MapPin, 
  Mail, 
  Phone, 
  CheckCircle2, 
  ExternalLink,
  Filter,
  Layers,
  Award,
  AlertCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function OrganizationsDirectory() {
  const sharedOrgs = useSharedStore(state => state.organizations)
  const [orgs, setOrgs] = useState<OrganizationNode[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<"ALL" | SectorType>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterState, setFilterState] = useState<string>("ALL")
  const [selectedOrg, setSelectedOrg] = useState<OrganizationNode | null>(null)
  const [isOnboardOpen, setIsOnboardOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Form State for new onboarding
  const [formData, setFormData] = useState({
    name: "",
    type: "MANUFACTURER" as SectorType,
    licenseNumber: "",
    city: "",
    state: "",
    address: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    complianceScore: 98,
  })

  // Open onboard modal pre-configured for a given sector
  const openOnboardForSector = (sector: SectorType) => {
    setFormData(prev => ({ ...prev, type: sector }));
    setIsOnboardOpen(true);
  };

  // Check URL query parameters on load
  useEffect(() => {
    if (searchParams.get("onboard") === "true") {
      const s = searchParams.get("sector");
      if (s && ["MANUFACTURER", "DISTRIBUTOR", "RETAILER", "WASTE_FACILITY"].includes(s.toUpperCase())) {
        setFormData(prev => ({ ...prev, type: s.toUpperCase() as SectorType }));
        setActiveTab(s.toUpperCase() as SectorType);
      }
      setIsOnboardOpen(true);
    }
  }, [searchParams]);

  // Load from API / Shared Store
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getOrganizations();
      setOrgs(data);
    } catch (e) {
      console.error(e);
      setOrgs(sharedOrgs || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sharedOrgs]);

  // Sector Counts
  const sectorCounts = useMemo(() => {
    const counts = {
      ALL: orgs.length,
      MANUFACTURER: 0,
      DISTRIBUTOR: 0,
      RETAILER: 0,
      WASTE_FACILITY: 0,
    };
    orgs.forEach((o) => {
      if (o.type in counts) {
        counts[o.type as SectorType]++;
      }
    });
    return counts;
  }, [orgs]);

  // Unique states for filter dropdown
  const uniqueStates = useMemo(() => {
    const set = new Set<string>();
    orgs.forEach((o) => {
      if (o.state) set.add(o.state);
    });
    return Array.from(set).sort();
  }, [orgs]);

  // Filtered List
  const filteredOrgs = useMemo(() => {
    return orgs.filter((o) => {
      // Sector filter
      if (activeTab !== "ALL" && o.type !== activeTab) return false;
      // State filter
      if (filterState !== "ALL" && o.state !== filterState) return false;
      // Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matches =
          o.name.toLowerCase().includes(q) ||
          o.licenseNumber.toLowerCase().includes(q) ||
          o.city.toLowerCase().includes(q) ||
          o.state.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [orgs, activeTab, filterState, searchQuery]);

  // Handle Onboard Submit
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.licenseNumber.trim() || !formData.city.trim()) {
      alert("Please fill in Organization Name, License Number, and City.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createOrganization({
        name: formData.name.trim(),
        type: formData.type,
        licenseNumber: formData.licenseNumber.trim(),
        city: formData.city.trim(),
        state: formData.state.trim() || "National",
        address: formData.address.trim() || `${formData.city}, ${formData.state}`,
        contactEmail: formData.contactEmail.trim() || `nodal@${formData.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.in`,
        contactPhone: formData.contactPhone.trim() || "+91 98765 43210",
        complianceScore: formData.complianceScore,
        active: true,
        registeredDate: new Date().toISOString().split("T")[0],
      });

      setSuccessMsg(`Successfully onboarded "${created.name}" to the National RxTrack Database!`);
      setIsOnboardOpen(false);
      // Reset form
      setFormData({
        name: "",
        type: "MANUFACTURER",
        licenseNumber: "",
        city: "",
        state: "",
        address: "",
        contactPerson: "",
        contactEmail: "",
        contactPhone: "",
        complianceScore: 98,
      });

      await loadData();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      console.error(err);
      alert("Failed to onboard organization. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getSectorBadge = (type: SectorType | "REGULATOR") => {
    switch (type) {
      case "MANUFACTURER":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Factory className="w-3.5 h-3.5 text-blue-600" />
            Manufacturer (OEM)
          </span>
        );
      case "DISTRIBUTOR":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <Truck className="w-3.5 h-3.5 text-purple-600" />
            Distributor Hub
          </span>
        );
      case "RETAILER":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Store className="w-3.5 h-3.5 text-emerald-600" />
            Retail Chemist
          </span>
        );
      case "WASTE_FACILITY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            CBWTF Incinerator
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Building2 className="w-3.5 h-3.5" />
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-emerald-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                CDSCO National Regulatory Master Registry
              </span>
              <span className="text-xs text-slate-400">PostgreSQL SHA-256 Verified Ledger</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Authorized Supply Chain Organizations
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Central directory for all 4 authorized pharmaceutical sectors: Formulators & OEMs, 
              Wholesale Distributors, Dispensing Retail Chemists, and Bio-Medical Waste Incinerators (CBWTF).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsOnboardOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-md flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Onboard Organization
            </Button>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {/* 4 Sector KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sector 1: Manufacturers */}
        <Card 
          onClick={() => setActiveTab("MANUFACTURER")}
          className={`cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 border-l-blue-500 ${
            activeTab === "MANUFACTURER" ? "ring-2 ring-blue-500/40 bg-blue-50/20" : ""
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">Manufacturers (OEMs)</CardTitle>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Factory className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{sectorCounts.MANUFACTURER}</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
              WHO-GMP Licensed Formulators
            </p>
          </CardContent>
        </Card>

        {/* Sector 2: Distributors */}
        <Card 
          onClick={() => setActiveTab("DISTRIBUTOR")}
          className={`cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 border-l-purple-500 ${
            activeTab === "DISTRIBUTOR" ? "ring-2 ring-purple-500/40 bg-purple-50/20" : ""
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">Distributors</CardTitle>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Truck className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{sectorCounts.DISTRIBUTOR}</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-purple-500"></span>
              Regional Hubs & Crate Consolidators
            </p>
          </CardContent>
        </Card>

        {/* Sector 3: Retailers */}
        <Card 
          onClick={() => setActiveTab("RETAILER")}
          className={`cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 border-l-emerald-500 ${
            activeTab === "RETAILER" ? "ring-2 ring-emerald-500/40 bg-emerald-50/20" : ""
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">Retail Pharmacies</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Store className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{sectorCounts.RETAILER}</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              State FDA Chemist Outlets
            </p>
          </CardContent>
        </Card>

        {/* Sector 4: Waste Facilities */}
        <Card 
          onClick={() => setActiveTab("WASTE_FACILITY")}
          className={`cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 border-l-amber-500 ${
            activeTab === "WASTE_FACILITY" ? "ring-2 ring-amber-500/40 bg-amber-50/20" : ""
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">CBWTF Incinerators</CardTitle>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Flame className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{sectorCounts.WASTE_FACILITY}</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
              CPCB Authorized Kilns (≥1050°C)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sector Selection Bar & Search Filters */}
      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-4 space-y-4">
          {/* Sector Buttons */}
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
            <Button
              variant={activeTab === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("ALL")}
              className={activeTab === "ALL" ? "bg-slate-900 text-white" : "text-gray-600"}
            >
              <Layers className="w-4 h-4 mr-1.5" />
              All Sectors ({sectorCounts.ALL})
            </Button>
            <Button
              variant={activeTab === "MANUFACTURER" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("MANUFACTURER")}
              className={activeTab === "MANUFACTURER" ? "bg-blue-600 text-white hover:bg-blue-700" : "text-gray-600"}
            >
              <Factory className="w-4 h-4 mr-1.5" />
              Manufacturers ({sectorCounts.MANUFACTURER})
            </Button>
            <Button
              variant={activeTab === "DISTRIBUTOR" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("DISTRIBUTOR")}
              className={activeTab === "DISTRIBUTOR" ? "bg-purple-600 text-white hover:bg-purple-700" : "text-gray-600"}
            >
              <Truck className="w-4 h-4 mr-1.5" />
              Distributors ({sectorCounts.DISTRIBUTOR})
            </Button>
            <Button
              variant={activeTab === "RETAILER" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("RETAILER")}
              className={activeTab === "RETAILER" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "text-gray-600"}
            >
              <Store className="w-4 h-4 mr-1.5" />
              Retailers ({sectorCounts.RETAILER})
            </Button>
            <Button
              variant={activeTab === "WASTE_FACILITY" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("WASTE_FACILITY")}
              className={activeTab === "WASTE_FACILITY" ? "bg-amber-600 text-white hover:bg-amber-700" : "text-gray-600"}
            >
              <Flame className="w-4 h-4 mr-1.5" />
              CBWTF Incinerators ({sectorCounts.WASTE_FACILITY})
            </Button>

            {activeTab === "ALL" && (
              <Button
                size="sm"
                onClick={() => setIsOnboardOpen(true)}
                className="ml-auto bg-slate-900 hover:bg-slate-800 text-white font-medium shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                + Onboard Any Sector
              </Button>
            )}
            {activeTab === "MANUFACTURER" && (
              <Button
                size="sm"
                onClick={() => openOnboardForSector("MANUFACTURER")}
                className="ml-auto bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                + New Manufacturer (OEM)
              </Button>
            )}
            {activeTab === "DISTRIBUTOR" && (
              <Button
                size="sm"
                onClick={() => openOnboardForSector("DISTRIBUTOR")}
                className="ml-auto bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                + New Distributor Hub
              </Button>
            )}
            {activeTab === "RETAILER" && (
              <Button
                size="sm"
                onClick={() => openOnboardForSector("RETAILER")}
                className="ml-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                + New Retail Chemist
              </Button>
            )}
            {activeTab === "WASTE_FACILITY" && (
              <Button
                size="sm"
                onClick={() => openOnboardForSector("WASTE_FACILITY")}
                className="ml-auto bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                + New CBWTF Facility
              </Button>
            )}
          </div>

          {/* Search & State Filter controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by company, license, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger className="w-full sm:w-48 h-9 text-sm">
                  <SelectValue placeholder="Filter by State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All States / Regions</SelectItem>
                  {uniqueStates.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organizations Directory Grid */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 animate-pulse bg-white rounded-xl border border-gray-100">
          Fetching authorized organizations directory from database...
        </div>
      ) : filteredOrgs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-gray-200">
          <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-800">No organizations found</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            No active nodes match your search query "{searchQuery}" in the selected sector.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setFilterState("ALL");
              setActiveTab("ALL");
            }}
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrgs.map((org) => {
            const isHighCompliance = (org.complianceScore ?? 100) >= 95;
            return (
              <Card
                key={org.id}
                className="hover:shadow-md transition-shadow border-gray-200 bg-white flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    {getSectorBadge(org.type)}
                    <span
                      className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isHighCompliance
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      <Award className="w-3 h-3 mr-1" />
                      {org.complianceScore ?? 100}% Score
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-gray-900 mt-2 line-clamp-1">
                    {org.name}
                  </CardTitle>
                  <CardDescription className="text-xs font-mono text-gray-500">
                    License: <span className="font-semibold text-gray-700">{org.licenseNumber}</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pt-0 text-xs text-gray-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">
                      {org.address || `${org.city}, ${org.state}`}
                    </span>
                  </div>

                  {org.contactEmail && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{org.contactEmail}</span>
                    </div>
                  )}

                  {org.contactPhone && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{org.contactPhone}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
                      Registered: {org.registeredDate || "Verified"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOrg(org)}
                      className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-medium px-2"
                    >
                      Inspect Profile <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Organization Details Modal */}
      {selectedOrg && (
        <Dialog open={!!selectedOrg} onOpenChange={() => setSelectedOrg(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                {getSectorBadge(selectedOrg.type)}
                <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200">
                  Active Verified Node
                </Badge>
              </div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                {selectedOrg.name}
              </DialogTitle>
              <DialogDescription className="font-mono text-xs">
                Regulatory Identifier: {selectedOrg.id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-sm text-gray-700 border-y border-gray-100">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg">
                <div>
                  <span className="text-xs text-gray-500 block">Drug / CPCB License</span>
                  <span className="font-semibold text-gray-900 font-mono text-xs">
                    {selectedOrg.licenseNumber}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Compliance Audit Score</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    {selectedOrg.complianceScore ?? 100} / 100
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Jurisdiction State</span>
                  <span className="font-medium text-gray-800">{selectedOrg.state}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Headquarters / Plant City</span>
                  <span className="font-medium text-gray-800">{selectedOrg.city}</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-gray-500 font-medium block mb-1">Registered Facility Address</span>
                <p className="text-xs text-gray-600 bg-slate-50 p-2.5 rounded border border-gray-200">
                  {selectedOrg.address || `${selectedOrg.city}, ${selectedOrg.state}`}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs text-gray-500 font-medium block">Nodal Regulatory Communications</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Mail className="w-3.5 h-3.5 text-gray-500" />
                    <span className="truncate">{selectedOrg.contactEmail || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Phone className="w-3.5 h-3.5 text-gray-500" />
                    <span>{selectedOrg.contactPhone || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-lg text-xs text-emerald-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Cryptographic Key-Value Proof Chain
                </div>
                <p className="text-emerald-700">
                  All reverse-logistics events emitted by this node are signed and verified against its registered public identifier.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedOrg(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Onboard New Organization Modal Dialog */}
      <Dialog open={isOnboardOpen} onOpenChange={setIsOnboardOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleOnboardSubmit}>
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <Plus className="w-3 h-3" /> New Entity Registration
                </span>
              </div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Onboard Supply Chain Organization
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Add an authorized manufacturer, distributor, pharmacy, or waste disposal facility to the national registry.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-sm max-h-[70vh] overflow-y-auto pr-1">
              {/* Organization Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold text-gray-700">
                  Organization Legal Name *
                </Label>
                <Input
                  id="name"
                  required
                  placeholder="e.g. Cipla Therapeutics Ltd or Apollo Pharmacy"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>

              {/* Sector Selection */}
              <div className="space-y-1.5">
                <Label htmlFor="type" className="text-xs font-semibold text-gray-700">
                  Sector / Supply Chain Tier *
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(val) => setFormData({ ...formData, type: val as SectorType })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select Sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANUFACTURER">🏭 Manufacturer (OEM Formulator)</SelectItem>
                    <SelectItem value="DISTRIBUTOR">🚚 Distributor (Regional Transshipment Hub)</SelectItem>
                    <SelectItem value="RETAILER">🏥 Retailer (Chemist & Dispensing Pharmacy)</SelectItem>
                    <SelectItem value="WASTE_FACILITY">🔥 Bio-Medical Waste Facility (CBWTF Kiln)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* License Number */}
              <div className="space-y-1.5">
                <Label htmlFor="license" className="text-xs font-semibold text-gray-700">
                  Drug License / CPCB Authorization Number *
                </Label>
                <Input
                  id="license"
                  required
                  placeholder="e.g. MFG-MH-2025-0819 or CBWTF-WST-901"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="h-9 text-sm font-mono"
                />
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs font-semibold text-gray-700">
                    City *
                  </Label>
                  <Input
                    id="city"
                    required
                    placeholder="e.g. Mumbai"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="state" className="text-xs font-semibold text-gray-700">
                    State / UT
                  </Label>
                  <Input
                    id="state"
                    placeholder="e.g. Maharashtra"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* Facility Address */}
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs font-semibold text-gray-700">
                  Physical Plant / Shop Address
                </Label>
                <Input
                  id="address"
                  placeholder="Plot/Shop number, Industrial Area, PIN Code"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="h-9 text-sm"
                />
              </div>

              {/* Contact Email & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-gray-700">
                    Nodal Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="regulatory@company.com"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold text-gray-700">
                    Contact Phone
                  </Label>
                  <Input
                    id="phone"
                    placeholder="+91 98765 43210"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-gray-100 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOnboardOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submitting ? "Saving to Database..." : "Register & Issue License"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
