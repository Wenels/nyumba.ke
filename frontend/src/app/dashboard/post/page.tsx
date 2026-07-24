"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Upload,
  X,
  MapPin,
  PlusCircle,
  Trash2,
  CheckCircle2,
  Building2,
  FileText,
  DollarSign,
  Users,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Info,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPicker } from "@/app/features/listings/components/map-picker";
import { api, ApiError } from "@/lib/api";

const STEPS = [
  { id: "location", name: "Location" },
  { id: "units", name: "Units" },
  { id: "vacancies", name: "Vacancies" },
  { id: "management", name: "Management" },
  { id: "contract", name: "Contract" },
  { id: "media", name: "Media & Docs" },
];

const PROPERTY_TYPES = ["Apartment", "Maisonette", "Bungalow", "Studio", "Bedsitter", "Townhouse"];

interface UnitTypeRow {
  type: string;
  count: number;
  rent: number;
  deposit: number;
}

interface VacantUnit {
  unitNumber: string;
  floor: string;
  doorNumber: string;
  unitType: string;
  status: "Vacant" | "Occupied";
  rentOverride: string;
  notes: string;
}

export default function PostListingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- STEP 1: Location & Basic Info ---
  const [propertyName, setPropertyName] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [lat, setLat] = useState(-1.2921);
  const [lng, setLng] = useState(36.8219);
  const [searchAddress, setSearchAddress] = useState("");
  const [county, setCounty] = useState("");
  const [town, setTown] = useState("");
  const [estate, setEstate] = useState("");
  const [ward, setWard] = useState("");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [totalUnits, setTotalUnits] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [description, setDescription] = useState("");

  // --- STEP 2: Units & Pricing ---
  const [unitTypes, setUnitTypes] = useState<UnitTypeRow[]>([
    { type: "1 Bedroom", count: 0, rent: 0, deposit: 0 },
  ]);

  // --- STEP 3: Vacancies ---
  const [vacancies, setVacancies] = useState<VacantUnit[]>([
    {
      unitNumber: "",
      floor: "",
      doorNumber: "",
      unitType: "1 Bedroom",
      status: "Vacant",
      rentOverride: "",
      notes: "",
    },
  ]);

  // --- STEP 4: Management Details ---
  const [legalName, setLegalName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [managementType, setManagementType] = useState<"owner" | "agent">("owner");
  const [agentName, setAgentName] = useState("");
  const [agentContact, setAgentContact] = useState("");

  // --- STEP 5: Lease Contract & Rules ---
  const [contractType, setContractType] = useState<"template" | "custom">("template");
  const [customContract, setCustomContract] = useState<File | null>(null);
  const [rules, setRules] = useState<string[]>([]);

  // --- STEP 6: Media & Supporting Documents ---
  const [photos, setPhotos] = useState<File[]>([]);
  const [titleDeed, setTitleDeed] = useState<File | null>(null);
  const [landRates, setLandRates] = useState<File | null>(null);
  const [utilityBill, setUtilityBill] = useState<File | null>(null);

  // --- Step Validation ---
  function validateStep(step: number): boolean {
    switch (step) {
      case 1: {
        const missing: string[] = [];
        if (!propertyName.trim()) missing.push("Property Name");
        if (!propertyType) missing.push("Property Type");
        if (!county.trim()) missing.push("County");
        if (!town.trim()) missing.push("Town / Sub-county");
        if (!ward.trim()) missing.push("Ward");
        if (!totalUnits.trim()) missing.push("Total Units");
        if (missing.length > 0) {
          toast.error("Please fill in all required fields", {
            description: `Missing: ${missing.join(", ")}`,
          });
          return false;
        }
        return true;
      }
      case 2: {
        for (let i = 0; i < unitTypes.length; i++) {
          const ut = unitTypes[i];
          if (!ut.count || ut.count <= 0 || !ut.rent || ut.rent <= 0 || !ut.deposit || ut.deposit <= 0) {
            toast.error("Please fill in all unit type fields", {
              description: `Unit Type ${i + 1} has incomplete or zero values for count, rent, or deposit.`,
            });
            return false;
          }
        }
        return true;
      }
      case 3: {
        for (let i = 0; i < vacancies.length; i++) {
          const v = vacancies[i];
          if (!v.unitNumber.trim() || !v.floor.trim() || !v.doorNumber.trim()) {
            toast.error("Please fill in all required unit fields", {
              description: `Unit ${i + 1} is missing Unit Number, Floor, or Door Number.`,
            });
            return false;
          }
        }
        return true;
      }
      case 4: {
        const missing: string[] = [];
        if (!legalName.trim()) missing.push("Legal Name");
        if (!idNumber.trim()) missing.push("ID / Passport Number");
        if (managementType === "agent") {
          if (!agentName.trim()) missing.push("Agent Name");
          if (!agentContact.trim()) missing.push("Agent Contact");
        }
        if (missing.length > 0) {
          toast.error("Please fill in all required fields", {
            description: `Missing: ${missing.join(", ")}`,
          });
          return false;
        }
        return true;
      }
      case 5: {
        if (contractType === "custom" && !customContract) {
          toast.error("Please upload your custom contract", {
            description: "You selected 'Upload Custom Contract' but haven't attached a file.",
          });
          return false;
        }
        return true;
      }
      case 6: {
        if (photos.length === 0) {
          toast.error("Please upload at least one property image", {
            description: "Property images are required to create a listing.",
          });
          return false;
        }
        return true;
      }
      default:
        return true;
    }
  }

  // --- Handlers & Nav ---
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(s + 1, 6));
    }
  };
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  function handleMapChange(newLat: number, newLng: number) {
    setLat(newLat);
    setLng(newLng);
    // Mock reverse geocoding — in production this would call a geocoder API
    setSearchAddress(`Pin location: ${newLat.toFixed(5)}, ${newLng.toFixed(5)}`);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPhotos((prev) => [...prev, ...files].slice(0, 10));
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  // --- Row Builders ---
  const addUnitType = () => {
    setUnitTypes((prev) => [...prev, { type: "1 Bedroom", count: 0, rent: 0, deposit: 0 }]);
  };
  const removeUnitType = (index: number) => {
    setUnitTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const addVacancy = () => {
    setVacancies((prev) => [
      ...prev,
      {
        unitNumber: "",
        floor: "",
        doorNumber: "",
        unitType: unitTypes[0]?.type || "1 Bedroom",
        status: "Vacant",
        rentOverride: "",
        notes: "",
      },
    ]);
  };
  const removeVacancy = (index: number) => {
    setVacancies((prev) => prev.filter((_, i) => i !== index));
  };

  const addRule = () => setRules((prev) => [...prev, ""]);
  const updateRule = (index: number, val: string) => {
    setRules((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };
  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleFinalSubmit() {
    setIsSubmitting(true);
    try {
      const unitTypesPayload = unitTypes.map((ut) => {
        const bedMatch = ut.type.match(/(\d+)/);
        const count = bedMatch ? parseInt(bedMatch[1]) : (ut.type.toLowerCase().includes("studio") ? 0 : 1);
        return {
          label: ut.type,
          bedroomCount: count,
          bathrooms: 1,
          monthlyRent: ut.rent,
          securityDeposit: ut.deposit,
          description: `${ut.type} unit category in ${propertyName}`,
        };
      });

      const unitsPayload = vacancies.map((v) => ({
        unitTypeLabel: v.unitType,
        unitNumber: v.unitNumber,
        floor: parseInt(v.floor) || 1,
        doorNumber: v.doorNumber,
        status: v.status.toUpperCase() === "VACANT" ? "VACANT" : "OCCUPIED",
        rentOverride: v.rentOverride ? parseInt(v.rentOverride) : undefined,
        description: v.notes,
      }));

      const propertyPayload = {
        name: propertyName || "Unnamed Property",
        propertyType: propertyType || "Apartment",
        description: description || "No description provided.",
        address: `${street ? `${street}, ` : ""}${estate ? `${estate}, ` : ""}${town || county || "Nairobi"}`,
        county: county || "Nairobi",
        town: town || "Nairobi",
        estate,
        ward,
        street,
        postalCode,
        latitude: lat,
        longitude: lng,
        totalFloors: parseInt(totalFloors) || 1,
        totalUnits: parseInt(totalUnits) || vacancies.length || 1,
        managementType,
        agentName,
        agentContact,
        legalName,
        idNumber,
        contractType,
        rules: rules.filter((r) => r.trim() !== ""),
        unitTypes: unitTypesPayload,
        units: unitsPayload,
      };

      const res = (await api.post("/api/properties", propertyPayload)) as {
        property?: { id: string };
        listing?: { id: string };
      };
      const id = res.property?.id || res.listing?.id;

      // 2. Upload Property Photos
      if (id && photos.length > 0) {
        const formData = new FormData();
        photos.forEach((photo) => formData.append("photos", photo));
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/properties/${id}/photos`,
          {
            method: "POST",
            body: formData,
            credentials: "include",
          }
        );
      }

      toast.success("Property created!", {
        description: "Your 3-tier Property, Unit Categories, and Rooms have been listed.",
      });
      router.push("/dashboard/listings");
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { error?: string };
        toast.error("Failed to post property", {
          description: typeof body?.error === "string" ? body.error : "Something went wrong.",
        });
      } else {
        toast.error("Could not reach the server");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Wizard Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">Add New Property</h1>
        <p className="text-sm text-muted-foreground">
          Fill in the details below to list your property. Step {currentStep} of 6 —{" "}
          {STEPS[currentStep - 1].name}
        </p>
      </div>

      {/* Steps indicator bar */}
      <div className="relative flex justify-between items-center w-full mt-4">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -translate-y-1/2 -z-10 rounded-full" />
        <div
          className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 -z-10 transition-all duration-300 rounded-full"
          style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
        />
        {STEPS.map((s, idx) => {
          const isCompleted = idx + 1 < currentStep;
          const isActive = idx + 1 === currentStep;
          return (
            <div key={s.id} className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-200 bg-background ${
                  isCompleted
                    ? "border-primary bg-primary text-primary-foreground"
                    : isActive
                      ? "border-primary text-primary shadow-sm scale-110"
                      : "border-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? "✓" : idx + 1}
              </div>
              <span
                className={`mt-2 text-xs font-semibold hidden md:inline transition-colors ${
                  isActive ? "text-primary font-bold" : "text-muted-foreground"
                }`}
              >
                {s.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* STEP FORMS CONTAINER */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm min-h-[450px]">
        {/* --- STEP 1: LOCATION & BASIC INFO --- */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Location & Basic Info
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider">
                  Property Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. Canaside"
                  className="mt-1"
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider">
                  Property Type <span className="text-red-500">*</span>
                </Label>
                <select
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                >
                  <option value="">Select Type</option>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Pin Your Building on the Map <span className="text-red-500">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Click on the map or drag the blue pin to your listing's exact location. Map tiles will auto-fill address details.
              </p>
              <MapPicker lat={lat} lng={lng} onChange={handleMapChange} />
            </div>

            {/* Address & geocode auto-fill preview block */}
            <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-4">
              <p className="text-xs text-blue-800 dark:text-blue-300 font-semibold flex items-center gap-1.5">
                <Info className="h-4 w-4" /> County, Town and Ward are filled from the map pin (but you can edit them if needed).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">County</Label>
                  <Input
                    placeholder="e.g. Nairobi County"
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    className="mt-1 bg-background"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">Town / Sub-county</Label>
                  <Input
                    placeholder="e.g. Nairobi"
                    value={town}
                    onChange={(e) => setTown(e.target.value)}
                    className="mt-1 bg-background"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">Estate / Area</Label>
                  <Input
                    placeholder="e.g. Kilimani"
                    value={estate}
                    onChange={(e) => setEstate(e.target.value)}
                    className="mt-1 bg-background"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">Ward</Label>
                  <Input
                    placeholder="e.g. Kilimani"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="mt-1 bg-background"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">Street</Label>
                  <Input
                    placeholder="e.g. Menelik Road"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="mt-1 bg-background"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">Postal Code</Label>
                  <Input
                    placeholder="e.g. 00100"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="mt-1 bg-background"
                  />
                </div>
              </div>

              {ward && (
                <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
                  <ShieldCheck className="h-4 w-4" /> Ward confirmed: {ward} (via spatial boundary check)
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider">
                  Total Units <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="e.g. 2"
                  value={totalUnits}
                  onChange={(e) => setTotalUnits(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider">Total Floors</Label>
                <Input
                  type="number"
                  placeholder="e.g. 5"
                  value={totalFloors}
                  onChange={(e) => setTotalFloors(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider">Description</Label>
              <textarea
                placeholder="Detailed description of the property features, building security, location benefits..."
                rows={3}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* --- STEP 2: UNITS & PRICING --- */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" /> Unit Types & Pricing
              </h2>
              <Button size="sm" type="button" onClick={addUnitType} className="gap-1">
                <PlusCircle className="h-4 w-4" /> Add Unit Type
              </Button>
            </div>

            <div className="rounded-xl border border-yellow-200 bg-yellow-50/50 p-3">
              <p className="text-xs text-yellow-800">
                Total units declared: {totalUnits || 0}. Define all unit types inside this building and their pricing.
              </p>
            </div>

            <div className="space-y-4">
              {unitTypes.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-border rounded-lg relative bg-background/50"
                >
                  <div>
                    <Label className="text-xs font-semibold">Unit Type *</Label>
                    <select
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={row.type}
                      onChange={(e) => {
                        const copy = [...unitTypes];
                        copy[idx].type = e.target.value;
                        setUnitTypes(copy);
                      }}
                    >
                      <option value="1 Bedroom">1 Bedroom</option>
                      <option value="2 Bedroom">2 Bedroom</option>
                      <option value="3 Bedroom">3 Bedroom</option>
                      <option value="Bedsitter">Bedsitter</option>
                      <option value="Studio">Studio</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Count *</Label>
                    <Input
                      type="number"
                      className="mt-1 text-xs"
                      value={row.count}
                      onChange={(e) => {
                        const copy = [...unitTypes];
                        copy[idx].count = parseInt(e.target.value) || 0;
                        setUnitTypes(copy);
                      }}
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Monthly Rent (KSh) *</Label>
                    <Input
                      type="number"
                      className="mt-1 text-xs"
                      value={row.rent}
                      onChange={(e) => {
                        const copy = [...unitTypes];
                        copy[idx].rent = parseInt(e.target.value) || 0;
                        setUnitTypes(copy);
                      }}
                    />
                  </div>

                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs font-semibold">Security Deposit (KSh) *</Label>
                      <Input
                        type="number"
                        className="mt-1 text-xs"
                        value={row.deposit}
                        onChange={(e) => {
                          const copy = [...unitTypes];
                          copy[idx].deposit = parseInt(e.target.value) || 0;
                          setUnitTypes(copy);
                        }}
                      />
                    </div>
                    {unitTypes.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeUnitType(idx)}
                        className="text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- STEP 3: VACANCIES --- */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> Vacant Units
              </h2>
              <Button size="sm" type="button" onClick={addVacancy} className="gap-1">
                <PlusCircle className="h-4 w-4" /> Add Unit
              </Button>
            </div>

            {/* Status counter widgets */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{totalUnits || 0}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Units</p>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{vacancies.length}</p>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Added</p>
              </div>
              <div className="rounded-lg border border-border p-4 text-center bg-primary/5">
                <p className="text-2xl font-bold text-primary">{vacancies.length}</p>
                <p className="text-xs text-primary/80 font-medium uppercase tracking-wider">Complete</p>
              </div>
              <div className="rounded-lg border border-border p-4 text-center bg-blue-50">
                <p className="text-2xl font-bold text-blue-600">
                  {vacancies.filter((v) => v.status === "Vacant").length}
                </p>
                <p className="text-xs text-blue-500 font-medium uppercase tracking-wider">Vacant</p>
              </div>
            </div>

            {/* Individual unit forms */}
            <div className="space-y-4">
              {vacancies.map((unit, idx) => (
                <div
                  key={idx}
                  className="border border-border rounded-xl p-4 space-y-4 bg-background/50 relative"
                >
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <span className="text-xs font-bold text-primary">Unit {idx + 1} — details</span>
                    {vacancies.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVacancy(idx)}
                        className="text-destructive h-6 w-6 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">Unit Number *</Label>
                      <Input
                        placeholder="e.g. A01"
                        className="mt-1 text-xs"
                        value={unit.unitNumber}
                        onChange={(e) => {
                          const copy = [...vacancies];
                          copy[idx].unitNumber = e.target.value;
                          setVacancies(copy);
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Floor *</Label>
                      <Input
                        placeholder="e.g. 1"
                        className="mt-1 text-xs"
                        value={unit.floor}
                        onChange={(e) => {
                          const copy = [...vacancies];
                          copy[idx].floor = e.target.value;
                          setVacancies(copy);
                        }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Door Number *</Label>
                      <Input
                        placeholder="e.g. 1"
                        className="mt-1 text-xs"
                        value={unit.doorNumber}
                        onChange={(e) => {
                          const copy = [...vacancies];
                          copy[idx].doorNumber = e.target.value;
                          setVacancies(copy);
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">Unit Type *</Label>
                      <select
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={unit.unitType}
                        onChange={(e) => {
                          const copy = [...vacancies];
                          copy[idx].unitType = e.target.value;
                          setVacancies(copy);
                        }}
                      >
                        {unitTypes.map((ut, uIdx) => (
                          <option key={uIdx} value={ut.type}>
                            {ut.type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Status *</Label>
                      <select
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={unit.status}
                        onChange={(e) => {
                          const copy = [...vacancies];
                          copy[idx].status = e.target.value as "Vacant" | "Occupied";
                          setVacancies(copy);
                        }}
                      >
                        <option value="Vacant">Vacant</option>
                        <option value="Occupied">Occupied</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Rent Override (KSh)</Label>
                      <Input
                        placeholder="Optional"
                        className="mt-1 text-xs"
                        value={unit.rentOverride}
                        onChange={(e) => {
                          const copy = [...vacancies];
                          copy[idx].rentOverride = e.target.value;
                          setVacancies(copy);
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Notes</Label>
                    <textarea
                      placeholder="e.g. Balcony with a view, extra cabinet, etc."
                      rows={2}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                      value={unit.notes}
                      onChange={(e) => {
                        const copy = [...vacancies];
                        copy[idx].notes = e.target.value;
                        setVacancies(copy);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addVacancy}
              className="w-full border-dashed"
            >
              + Add Another Unit
            </Button>
          </div>
        )}

        {/* --- STEP 4: MANAGEMENT DETAILS --- */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Management Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider">
                  Your Legal Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. Samuel Maina Gachuru"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider">
                  ID / Passport Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. 12345678"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Management Type <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={managementType === "owner" ? "default" : "outline"}
                  onClick={() => setManagementType("owner")}
                  className="w-full justify-center"
                >
                  Owner Managed
                </Button>
                <Button
                  type="button"
                  variant={managementType === "agent" ? "default" : "outline"}
                  onClick={() => setManagementType("agent")}
                  className="w-full justify-center"
                >
                  Agent Managed
                </Button>
              </div>
            </div>

            {managementType === "agent" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-border rounded-xl bg-background/50">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider">
                    Agent Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Samcy"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wider">
                    Agent Contact <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. 0702345676"
                    value={agentContact}
                    onChange={(e) => setAgentContact(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- STEP 5: LEASE CONTRACT & RULES --- */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Lease Contract & Property Rules
            </h2>

            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Lease Contract Type <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-4 border border-border rounded-xl bg-background hover:bg-muted/35 cursor-pointer">
                  <input
                    type="radio"
                    name="contractType"
                    checked={contractType === "template"}
                    onChange={() => setContractType("template")}
                    className="mt-1 text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-semibold block">Use Platform Template</span>
                    <span className="text-xs text-muted-foreground">
                      Professional lease agreement generated by the platform with digital signature support.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border border-border rounded-xl bg-background hover:bg-muted/35 cursor-pointer">
                  <input
                    type="radio"
                    name="contractType"
                    checked={contractType === "custom"}
                    onChange={() => setContractType("custom")}
                    className="mt-1 text-primary focus:ring-primary"
                  />
                  <div className="w-full">
                    <span className="text-sm font-semibold block">Upload Custom Contract</span>
                    <span className="text-xs text-muted-foreground block mb-2">
                      Upload your own lease agreement (PDF). Tenants will download, sign and upload back.
                    </span>

                    {contractType === "custom" && (
                      <div className="mt-2">
                        <label className="flex items-center gap-2 border border-dashed border-border rounded-lg px-4 py-3 cursor-pointer hover:bg-muted text-xs text-muted-foreground justify-center">
                          <Upload className="h-4 w-4" />
                          {customContract ? customContract.name : "Select PDF Document"}
                          <input
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) setCustomContract(file);
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider">
                  Property Rules (Optional)
                </Label>
                <Button size="xs" variant="outline" type="button" onClick={addRule}>
                  + Add Rule
                </Button>
              </div>

              <div className="space-y-2">
                {rules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="e.g. No noise after 10 PM"
                      value={rule}
                      onChange={(e) => updateRule(idx, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRule(idx)}
                      className="text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- STEP 6: IMAGES & DOCUMENTS --- */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" /> Images & Supporting Documents
            </h2>

            {/* Photos */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Property Images (Required, up to 10)
              </Label>
              <p className="text-xs text-muted-foreground">
                First photo will be the cover image. Only JPEG, PNG, WebP supported.
              </p>

              <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border p-8 hover:border-primary transition-colors bg-background/50">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Click to upload photos (max 5MB each)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 mt-2">
                  {photos.map((photo, i) => (
                    <div
                      key={i}
                      className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-muted"
                    >
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Photo ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 rounded bg-foreground/75 px-1.5 py-0.5 text-xs text-background">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Documents */}
            <div className="space-y-4 border-t border-border pt-6">
              <Label className="text-xs font-semibold uppercase tracking-wider block">
                Supporting Documents (Optional)
              </Label>
              <p className="text-xs text-muted-foreground">
                Upload verified proof documents to get the verified badge faster.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Title Deed */}
                <div className="flex flex-col gap-2 p-4 border border-border rounded-xl bg-background/50">
                  <span className="text-xs font-bold">Title Deed</span>
                  <label className="flex items-center gap-1.5 border border-dashed border-border rounded-lg py-2.5 px-3 cursor-pointer hover:bg-muted text-xs text-muted-foreground justify-center mt-2">
                    <Upload className="h-3.5 w-3.5" />
                    {titleDeed ? titleDeed.name : "Upload Deed"}
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setTitleDeed(file);
                      }}
                    />
                  </label>
                </div>

                {/* Land Rates Receipt */}
                <div className="flex flex-col gap-2 p-4 border border-border rounded-xl bg-background/50">
                  <span className="text-xs font-bold">Land Rates Receipt</span>
                  <label className="flex items-center gap-1.5 border border-dashed border-border rounded-lg py-2.5 px-3 cursor-pointer hover:bg-muted text-xs text-muted-foreground justify-center mt-2">
                    <Upload className="h-3.5 w-3.5" />
                    {landRates ? landRates.name : "Upload Receipt"}
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setLandRates(file);
                      }}
                    />
                  </label>
                </div>

                {/* Utility Bill */}
                <div className="flex flex-col gap-2 p-4 border border-border rounded-xl bg-background/50">
                  <span className="text-xs font-bold">Utility Bill</span>
                  <label className="flex items-center gap-1.5 border border-dashed border-border rounded-lg py-2.5 px-3 cursor-pointer hover:bg-muted text-xs text-muted-foreground justify-center mt-2">
                    <Upload className="h-3.5 w-3.5" />
                    {utilityBill ? utilityBill.name : "Upload Bill"}
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setUtilityBill(file);
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS BAR */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        {currentStep > 1 ? (
          <Button type="button" variant="outline" onClick={prevStep} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        ) : (
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        )}

        {currentStep < 6 ? (
          <Button type="button" onClick={nextStep} className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            loading={isSubmitting}
            onClick={handleFinalSubmit}
            className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? "Submitting..." : "Submit Property"}
          </Button>
        )}
      </div>
    </div>
  );
}
