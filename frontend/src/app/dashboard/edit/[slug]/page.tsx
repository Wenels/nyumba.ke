"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Building2, DollarSign, Key, Trash2, PlusCircle, ArrowLeft, Home
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";

const PROPERTY_TYPES = [
  "Bedsitter", "1 Bedroom", "2 Bedrooms", "3 Bedrooms",
  "4+ Bedrooms", "Bungalow", "Maisonette", "Studio", "Apartment", "Townhouse"
];

export default function EditListingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("Basic");

  // Form State
  const [name, setName] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [totalFloors, setTotalFloors] = useState("1");
  const [totalUnits, setTotalUnits] = useState("1");
  
  // Nested State
  const [unitTypes, setUnitTypes] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  // Tracking initialization
  const [originalData, setOriginalData] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["listings", slug],
    queryFn: () => api.get(`/api/listings/${slug}`) as Promise<{ property: any }>,
    enabled: !!slug,
  });

  useEffect(() => {
    if (data?.property && !originalData) {
      const p = data.property;
      setOriginalData(p);
      setName(p.name || "");
      setPropertyType(p.propertyType || "");
      setDescription(p.description || "");
      setAddress(p.address || "");
      setTotalFloors(String(p.totalFloors || 1));
      setTotalUnits(String(p.totalUnits || 1));

      setUnitTypes(
        (p.unitTypes || []).map((ut: any) => ({
          id: ut.id,
          label: ut.label,
          monthlyRent: ut.monthlyRent,
          securityDeposit: ut.securityDeposit,
          bedroomCount: ut.bedroomCount,
          bathrooms: ut.bathrooms,
        }))
      );

      const allUnits = (p.unitTypes || []).flatMap((ut: any) => 
        (ut.units || []).map((u: any) => ({
          id: u.id,
          unitTypeId: ut.id,
          unitNumber: u.unitNumber,
          floor: u.floor,
          doorNumber: u.doorNumber || "",
          status: u.status,
          rentOverride: u.rentOverride || "",
        }))
      );
      setUnits(allUnits);
    }
  }, [data, originalData]);

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.patch(`/api/properties/${slug}`, payload);
    },
    onSuccess: () => {
      toast.success("Property updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      router.push("/dashboard/listings");
    },
    onError: (err) => {
      const message = err instanceof ApiError ? (err.body as any)?.error : "Something went wrong";
      toast.error("Update failed", { description: typeof message === "string" ? message : JSON.stringify(message) });
    },
  });

  const handleSave = () => {
    if (!name.trim()) return toast.error("Property name is required");

    const payload: any = {
      name,
      propertyType,
      description,
      address,
      totalFloors: Number(totalFloors),
      totalUnits: Number(totalUnits),
    };

    const unitTypesUpdate: any[] = [];
    const unitTypesCreate: any[] = [];

    unitTypes.forEach((ut) => {
      const utUnits = units.filter(u => u.unitTypeId === ut.id || (!ut.id && u.unitTypeId === ut.tempId));
      
      const unitsUpdate: any[] = [];
      const unitsCreate: any[] = [];

      utUnits.forEach(u => {
        if (u.id) {
          unitsUpdate.push({
            where: { id: u.id },
            data: {
              unitNumber: String(u.unitNumber),
              floor: Number(u.floor),
              doorNumber: String(u.doorNumber),
              status: u.status,
              rentOverride: u.rentOverride ? Number(u.rentOverride) : null,
            }
          });
        } else {
          unitsCreate.push({
            unitNumber: String(u.unitNumber),
            floor: Number(u.floor),
            doorNumber: String(u.doorNumber),
            status: u.status,
            rentOverride: u.rentOverride ? Number(u.rentOverride) : null,
          });
        }
      });

      const utData: any = {
        label: ut.label,
        monthlyRent: Number(ut.monthlyRent),
        securityDeposit: Number(ut.securityDeposit),
        bedroomCount: Number(ut.bedroomCount),
        bathrooms: Number(ut.bathrooms),
      };

      if (unitsUpdate.length > 0 || unitsCreate.length > 0) {
        utData.units = {};
        if (unitsUpdate.length > 0) utData.units.update = unitsUpdate;
        if (unitsCreate.length > 0) utData.units.create = unitsCreate;
      }

      if (ut.id) {
        unitTypesUpdate.push({
          where: { id: ut.id },
          data: utData,
        });
      } else {
        unitTypesCreate.push(utData);
      }
    });

    if (unitTypesUpdate.length > 0 || unitTypesCreate.length > 0) {
      payload.unitTypes = {};
      if (unitTypesUpdate.length > 0) payload.unitTypes.update = unitTypesUpdate;
      if (unitTypesCreate.length > 0) payload.unitTypes.create = unitTypesCreate;
    }

    updateMutation.mutate(payload);
  };

  const addUnitType = () => {
    setUnitTypes((prev) => [...prev, { 
      tempId: Math.random().toString(36).substr(2, 9), 
      label: "1 Bedroom", monthlyRent: 0, securityDeposit: 0, bedroomCount: 1, bathrooms: 1 
    }]);
  };

  const removeUnitType = (index: number) => {
    // Only allow removing newly added unit types for simplicity, backend might reject deleting existing without cleanup
    const ut = unitTypes[index];
    if (ut.id) {
      toast.error("Cannot delete existing unit types from this interface yet.");
      return;
    }
    setUnitTypes((prev) => prev.filter((_, i) => i !== index));
    setUnits((prev) => prev.filter(u => u.unitTypeId !== ut.tempId));
  };

  const addUnit = () => {
    if (unitTypes.length === 0) return toast.error("Please add a unit type first");
    const targetUt = unitTypes[0];
    setUnits((prev) => [
      ...prev,
      {
        unitTypeId: targetUt.id || targetUt.tempId,
        unitNumber: "",
        floor: "1",
        doorNumber: "",
        status: "VACANT",
        rentOverride: "",
      },
    ]);
  };

  const removeUnit = (index: number) => {
    const u = units[index];
    if (u.id) {
      toast.error("Cannot delete existing rooms. You can change their status to MAINTENANCE or OCCUPIED instead.");
      return;
    }
    setUnits((prev) => prev.filter((_, i) => i !== index));
  };

  if (isLoading || !originalData) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Property</h1>
            <p className="mt-1 text-muted-foreground truncate">{originalData.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button loading={updateMutation.isPending} onClick={handleSave} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex rounded-lg border border-border bg-muted p-1 w-fit">
        {["Basic", "Unit Types", "Rooms"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>{tab}</button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm min-h-[400px]">
        {activeTab === "Basic" && (
          <div className="space-y-5">
            <h2 className="font-semibold flex items-center gap-2"><Building2 className="h-4 w-4 text-primary"/> Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Property Name</Label>
                <Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Property Type</Label>
                <select className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
                  {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</Label>
              <textarea rows={4} className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="md:col-span-1">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Floors</Label>
                <Input type="number" className="mt-1.5" value={totalFloors} onChange={(e) => setTotalFloors(e.target.value)} />
              </div>
              <div className="md:col-span-1">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Units</Label>
                <Input type="number" className="mt-1.5" value={totalUnits} onChange={(e) => setTotalUnits(e.target.value)} />
              </div>
              <div className="md:col-span-1">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Address</Label>
                <Input className="mt-1.5" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "Unit Types" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary"/> Unit Categories</h2>
              <Button size="sm" onClick={addUnitType} className="gap-1 bg-secondary text-secondary-foreground"><PlusCircle className="h-4 w-4" /> Add Category</Button>
            </div>
            <p className="text-xs text-muted-foreground">Manage the different categories of units (e.g., 1 Bedroom, 2 Bedroom) in your property.</p>
            
            <div className="space-y-4">
              {unitTypes.map((row, idx) => (
                <div key={row.id || row.tempId} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border border-border rounded-lg relative bg-background/50">
                  <div className="md:col-span-1">
                    <Label className="text-xs font-semibold">Category Label</Label>
                    <Input className="mt-1 text-xs" value={row.label} onChange={(e) => {
                      const copy = [...unitTypes]; copy[idx].label = e.target.value; setUnitTypes(copy);
                    }} />
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-xs font-semibold">Monthly Rent (KSh)</Label>
                    <Input type="number" className="mt-1 text-xs" value={row.monthlyRent} onChange={(e) => {
                      const copy = [...unitTypes]; copy[idx].monthlyRent = e.target.value; setUnitTypes(copy);
                    }} />
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-xs font-semibold">Deposit (KSh)</Label>
                    <Input type="number" className="mt-1 text-xs" value={row.securityDeposit} onChange={(e) => {
                      const copy = [...unitTypes]; copy[idx].securityDeposit = e.target.value; setUnitTypes(copy);
                    }} />
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-xs font-semibold">Bedrooms</Label>
                    <Input type="number" className="mt-1 text-xs" value={row.bedroomCount} onChange={(e) => {
                      const copy = [...unitTypes]; copy[idx].bedroomCount = e.target.value; setUnitTypes(copy);
                    }} />
                  </div>
                  <div className="md:col-span-1 flex items-end justify-between">
                    <div className="flex-1 mr-2">
                      <Label className="text-xs font-semibold">Bathrooms</Label>
                      <Input type="number" className="mt-1 text-xs" value={row.bathrooms} onChange={(e) => {
                        const copy = [...unitTypes]; copy[idx].bathrooms = e.target.value; setUnitTypes(copy);
                      }} />
                    </div>
                    {!row.id && (
                      <Button variant="ghost" size="icon" onClick={() => removeUnitType(idx)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Rooms" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2"><Key className="h-4 w-4 text-primary"/> Rooms Management</h2>
              <Button size="sm" onClick={addUnit} className="gap-1 bg-secondary text-secondary-foreground"><PlusCircle className="h-4 w-4" /> Add Room</Button>
            </div>
            
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs text-blue-800 font-medium">
                To put a vacated unit back online, find the unit below and change its status back to "VACANT".
              </p>
            </div>

            <div className="space-y-3">
              {units.map((unit, idx) => (
                <div key={unit.id || idx} className="grid grid-cols-2 md:grid-cols-6 gap-3 p-3 border border-border rounded-lg items-center bg-background/50">
                  <div className="md:col-span-1">
                    <Label className="text-[10px] uppercase text-muted-foreground mb-1 block">Unit Number</Label>
                    <Input className="h-8 text-xs font-bold" value={unit.unitNumber} onChange={(e) => {
                      const copy = [...units]; copy[idx].unitNumber = e.target.value; setUnits(copy);
                    }} />
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-[10px] uppercase text-muted-foreground mb-1 block">Status</Label>
                    <select className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs font-bold focus-visible:outline-none"
                      value={unit.status} onChange={(e) => {
                        const copy = [...units]; copy[idx].status = e.target.value; setUnits(copy);
                      }}
                      style={{ color: unit.status === "VACANT" ? "#16a34a" : unit.status === "OCCUPIED" ? "#dc2626" : "inherit" }}
                    >
                      <option value="VACANT">VACANT (Online)</option>
                      <option value="OCCUPIED">OCCUPIED</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-[10px] uppercase text-muted-foreground mb-1 block">Category</Label>
                    <select className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none"
                      value={unit.unitTypeId} onChange={(e) => {
                        const copy = [...units]; copy[idx].unitTypeId = e.target.value; setUnits(copy);
                      }}
                    >
                      {unitTypes.map(ut => (
                        <option key={ut.id || ut.tempId} value={ut.id || ut.tempId}>{ut.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-1">
                    <Label className="text-[10px] uppercase text-muted-foreground mb-1 block">Floor</Label>
                    <Input type="number" className="h-8 text-xs" value={unit.floor} onChange={(e) => {
                      const copy = [...units]; copy[idx].floor = e.target.value; setUnits(copy);
                    }} />
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <div className="flex-1 mr-1">
                      <Label className="text-[10px] uppercase text-muted-foreground mb-1 block">Rent Override</Label>
                      <Input placeholder="Optional" className="h-8 text-xs" value={unit.rentOverride} onChange={(e) => {
                        const copy = [...units]; copy[idx].rentOverride = e.target.value; setUnits(copy);
                      }} />
                    </div>
                    {!unit.id && (
                      <Button variant="ghost" size="icon" onClick={() => removeUnit(idx)} className="text-destructive h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
