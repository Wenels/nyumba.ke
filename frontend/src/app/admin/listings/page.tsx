"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search,
  Trash2,
  ExternalLink,
  ImageOff,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const STATUSES = ["", "PENDING", "ACTIVE", "EXPIRED", "REMOVED"];

export default function AdminListingsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-listings", search, status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      return api.get(`/api/admin/listings?${params}`) as Promise<{
        listings: any[];
      }>;
    },
  });

  const { data: detailData } = useQuery({
    queryKey: ["admin-listing-detail", selectedListing?.id],
    queryFn: () =>
      api.get(`/api/admin/listings/${selectedListing.id}/detail`) as Promise<{
        listing: any;
      }>,
    enabled: !!selectedListing,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      api.patch(`/api/admin/listings/${id}/approve`, { action }),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success(action === "approve" ? "Listing approved" : "Listing rejected");
      setSelectedListing(null);
    },
    onError: (err) => {
      toast.error("Failed", {
        description:
          err instanceof ApiError
            ? (err.body as any)?.error
            : "Something went wrong",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/listings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success("Listing deleted from database");
      setSelectedListing(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/admin/listings/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      toast.success("Status updated");
    },
  });

  const listings = data?.listings ?? [];
  const detail = detailData?.listing;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-background">Listings</h1>
        <p className="mt-1 text-background/50">{listings.length} listings found</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-background/30" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search listings..."
            className="pl-9 border-background/20 bg-background/10 text-background placeholder:text-background/30"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-background/20 bg-background/10 px-3 py-2 text-sm text-background"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s} className="text-foreground bg-background">
              {s || "All statuses"}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-6">
        {/* Listings list */}
        <div className="flex-1 space-y-3 min-w-0">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-background/5" />
            ))
          ) : listings.length === 0 ? (
            <div className="rounded-xl border border-background/10 p-12 text-center text-background/40">
              No listings found
            </div>
          ) : (
            listings.map((listing: any) => {
              const photo = listing.photos?.[0];
              const isSelected = selectedListing?.id === listing.id;
              return (
                <div
                  key={listing.id}
                  className={`flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-secondary bg-secondary/10"
                      : "border-background/10 bg-background/5 hover:bg-background/10"
                  }`}
                  onClick={() => setSelectedListing(listing)}
                >
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-background/10">
                    {photo ? (
                      <Image
                        src={`${API_URL}${photo.url}`}
                        alt={listing.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageOff className="h-4 w-4 text-background/30" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-background truncate">{listing.name}</p>
                    <p className="text-xs text-background/50 truncate">
                      {listing.landlord?.fullName} ·{" "}
                      {listing.unitTypes?.length
                        ? `From Ksh ${Math.min(...listing.unitTypes.map((u: any) => u.monthlyRent)).toLocaleString()}/mo`
                        : listing.address}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        listing.status === "ACTIVE"
                          ? "bg-primary/20 text-primary"
                          : listing.status === "PENDING"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : listing.status === "REMOVED"
                          ? "bg-destructive/20 text-destructive"
                          : "bg-background/10 text-background/50"
                      }`}
                    >
                      {listing.status}
                    </span>
                    <Eye className="h-4 w-4 text-background/30" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail panel */}
        {selectedListing && (
          <div className="w-80 shrink-0 rounded-xl border border-background/10 bg-background/5 p-5 space-y-4 h-fit sticky top-6">
            {detail ? (
              <>
                <div>
                  <h3 className="font-bold text-background">{detail.name}</h3>
                  <p className="text-xs text-background/50 mt-1">{detail.address}</p>
                </div>

                {detail.photos?.length > 0 && (
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <Image
                        src={`${API_URL}${detail.photos[0].url}`}
                        alt={detail.name}
                        fill
                        sizes="320px"
                        className="object-cover"
                      />
                    {detail.photos.length > 1 && (
                      <span className="absolute bottom-2 right-2 rounded bg-foreground/70 px-1.5 py-0.5 text-xs text-background">
                        +{detail.photos.length - 1} photos
                      </span>
                    )}
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-background/50">Type</span>
                    <span className="text-background">{detail.propertyType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-background/50">Unit Types</span>
                    <span className="text-background">{detail.unitTypes?.length ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-background/50">Starting Rent</span>
                    <span className="text-background font-medium">
                      {detail.unitTypes?.length
                        ? `Ksh ${Math.min(...detail.unitTypes.map((u: any) => u.monthlyRent)).toLocaleString()}/mo`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-background/50">Total Floors</span>
                    <span className="text-background">{detail.totalFloors}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-background/50">Total Units</span>
                    <span className="text-background">{detail.totalUnits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-background/50">Saves</span>
                    <span className="text-background">{detail._count?.savedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-background/50">Inquiries</span>
                    <span className="text-background">{detail._count?.conversations}</span>
                  </div>
                </div>

                <div className="border-t border-background/10 pt-3">
                  <p className="text-xs font-semibold text-background/50 uppercase tracking-wide mb-2">
                    Landlord
                  </p>
                  <p className="text-sm font-medium text-background">{detail.landlord?.fullName}</p>
                  <p className="text-xs text-background/50">{detail.landlord?.email}</p>
                  <p className="text-xs text-background/50">{detail.landlord?.phone ?? "No phone"}</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      detail.landlord?.verification === "VERIFIED"
                        ? "bg-primary/20 text-primary"
                        : "bg-background/10 text-background/50"
                    }`}
                  >
                    {detail.landlord?.verification}
                  </span>
                </div>

                <p className="text-xs text-background/50 leading-relaxed line-clamp-4">
                  {detail.description}
                </p>

                <div className="flex flex-col gap-2 pt-2">
                  {detail.status === "PENDING" && (
                    <>
                      <Button
                        onClick={() =>
                          approveMutation.mutate({ id: detail.id, action: "approve" })
                        }
                        disabled={approveMutation.isPending}
                        className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Approve listing
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          approveMutation.mutate({ id: detail.id, action: "reject" })
                        }
                        disabled={approveMutation.isPending}
                        className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject listing
                      </Button>
                    </>
                  )}

                  {detail.status === "ACTIVE" && (
                    <select
                      value={detail.status}
                      onChange={(e) =>
                        statusMutation.mutate({ id: detail.id, status: e.target.value })
                      }
                      className="w-full rounded-md border border-background/20 bg-background/10 px-3 py-2 text-sm text-background"
                    >
                      {["ACTIVE", "EXPIRED", "PENDING", "REMOVED"].map((s) => (
                        <option key={s} value={s} className="text-foreground bg-background">
                          {s}
                        </option>
                      ))}
                    </select>
                  )}

                  <Link href={`/listings/${detail.slug}`} target="_blank">
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-background/20 text-background hover:bg-background/10"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View public page
                    </Button>
                  </Link>

                  <Button
                    onClick={() => setShowInspectionModal(true)}
                    className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700 font-semibold"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Inspection & Verification
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      if (confirm("Permanently delete this listing from the database?")) {
                        deleteMutation.mutate(detail.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete from database
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-background" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Admin Inspection & Verification Modal */}
      {showInspectionModal && detail && (
        <InspectionModal
          property={detail}
          onClose={() => setShowInspectionModal(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-listing-detail", selectedListing?.id] });
            queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
          }}
        />
      )}
    </div>
  );
}

const DEFAULT_AMENITIES_LIST = [
  "Water Supply",
  "Electricity",
  "Parking",
  "Security",
  "WiFi/Internet",
  "Lift / Elevator",
  "Garbage Collection",
  "CCTV",
];

const ROOM_CATEGORIES = [
  "Exterior / Compound",
  "Living Area",
  "Kitchen",
  "Bedroom",
  "Bathroom",
  "Shared Areas",
];

function InspectionModal({ property, onClose, onSaved }: { property: any; onClose: () => void; onSaved: () => void }) {
  const [amenities, setAmenities] = useState<Array<{ name: string; available: boolean }>>(() => {
    if (property.amenities && property.amenities.length > 0) {
      return property.amenities.map((a: any) => ({ name: a.name, available: a.available }));
    }
    return DEFAULT_AMENITIES_LIST.map((name) => ({ name, available: true }));
  });

  const [conditionReport, setConditionReport] = useState<any>(() => {
    if (property.conditionReport) return property.conditionReport;
    return {
      floors: { items: [{ name: "Tiling Grout", status: "No issues" }, { name: "Floor Condition", status: "No issues" }] },
      utilities: { items: [{ name: "Plumbing", status: "No issues" }, { name: "Water Pressure", status: "No issues" }, { name: "Sockets/Switches", status: "No issues" }] },
      walls: { items: [{ name: "Paint Finish", status: "No issues" }, { name: "Cracks/Damage", status: "No issues" }] },
    };
  });

  // Photo upload state with 2-tier hierarchy
  const [targetType, setTargetType] = useState<"PROPERTY" | "UNIT_TYPE">("PROPERTY");
  const [selectedUnitTypeId, setSelectedUnitTypeId] = useState<string>(
    property.unitTypes?.[0]?.id || ""
  );
  const [photoCategory, setPhotoCategory] = useState("Living Area");
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  const handleUploadCategorizedPhotos = async () => {
    if (!uploadFiles || uploadFiles.length === 0) {
      toast.error("Please select photo files to upload");
      return;
    }

    if (targetType === "UNIT_TYPE" && !selectedUnitTypeId) {
      toast.error("Please select a Unit Type target");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      if (targetType === "PROPERTY") {
        formData.append("propertyId", property.id);
      } else {
        formData.append("unitTypeId", selectedUnitTypeId);
      }
      formData.append("category", photoCategory);
      Array.from(uploadFiles).forEach((file) => formData.append("photos", file));

      const res = await fetch(`${API_URL}/api/admin/photos`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      toast.success(`Uploaded ${uploadFiles.length} photo(s) successfully!`);
      setUploadFiles(null);
      onSaved();
    } catch (e: any) {
      toast.error("Failed to upload photos");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string, type: "property" | "unitType") => {
    setDeletingPhotoId(photoId);
    try {
      const res: any = await api.delete(`/api/admin/photos/${photoId}?type=${type}`);
      if (res?.status === 200 || res?.data?.ok) {
        toast.success("Photo removed successfully");
        onSaved();
      }
    } catch (err: any) {
      toast.error("Failed to delete photo");
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const confirmedCount = amenities.filter((a) => a.available).length;
  const notFoundCount = amenities.filter((a) => !a.available).length;

  const toggleAmenity = (name: string) => {
    setAmenities((prev) =>
      prev.map((a) => (a.name === name ? { ...a, available: !a.available } : a))
    );
  };

  const toggleConditionItem = (section: string, itemName: string) => {
    setConditionReport((prev: any) => {
      const sectionData = prev[section] || { items: [] };
      const updatedItems = sectionData.items.map((i: any) =>
        i.name === itemName
          ? { ...i, status: i.status === "No issues" ? "Issue Found" : "No issues" }
          : i
      );
      return {
        ...prev,
        [section]: { ...sectionData, items: updatedItems },
      };
    });
  };

  const handleSaveInspection = async () => {
    setIsSaving(true);
    try {
      await api.patch(`/api/admin/listings/${property.id}/inspection`, {
        amenities,
        conditionReport,
      });
      toast.success("Inspection amenities & condition report saved!");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error("Failed to save inspection data");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-xs overflow-y-auto py-8">
      <div className="w-full max-w-3xl rounded-2xl bg-background border border-border p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Nyumba.ke Official Inspection Dashboard</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Verify property amenities, upload room-categorized inspection photos, and record findings.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-muted">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Amenity Verification Check (Matching UI design) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">Amenity Verification Check</h3>
            <span className="text-xs font-semibold text-primary">Team Field Verification</span>
          </div>

          {/* Top Summary Stat Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-center">
              <p className="text-2xl font-extrabold text-emerald-600">{confirmedCount}</p>
              <p className="text-xs font-semibold text-emerald-700/80 mt-0.5">Confirmed</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 text-center">
              <p className="text-2xl font-extrabold text-red-500">{notFoundCount}</p>
              <p className="text-xs font-semibold text-red-500/80 mt-0.5">Not Found</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-center">
              <p className="text-2xl font-extrabold text-slate-700">{amenities.length}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">Total Checked</p>
            </div>
          </div>

          {/* Amenity Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {amenities.map((item: any) => (
              <div
                key={item.name}
                onClick={() => toggleAmenity(item.name)}
                className={`flex items-center justify-between rounded-xl border p-3.5 cursor-pointer transition-all ${
                  item.available
                    ? "border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50"
                    : "border-red-200 bg-red-50/40 hover:bg-red-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-white text-xs font-bold ${
                      item.available ? "bg-emerald-500" : "bg-red-500"
                    }`}
                  >
                    {item.available ? "✓" : "✕"}
                  </span>
                  <span className="text-sm font-semibold text-foreground">{item.name}</span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    item.available
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-red-100 text-red-800 border border-red-200"
                  }`}
                >
                  {item.available ? "Available" : "Not Found"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Hierarchical Inspection Photo Manager & Uploader */}
        <div className="border-t border-border pt-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
              Hierarchical Inspection Photo Upload
            </h3>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Admin Asset Manager
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Upload and organize field inspection photos into the precise property hierarchy (Building vs. Unit Type) and room categories.
          </p>

          {/* STEP 1: HIERARCHY TARGET SELECTOR */}
          <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-3">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
              Step 1: Select Hierarchy Target Level
            </label>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setTargetType("PROPERTY")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  targetType === "PROPERTY"
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background text-foreground border-border hover:bg-muted"
                }`}
              >
                🏢 Property / Building Level (Exterior, Gate, Shared)
              </button>

              {property.unitTypes?.map((ut: any) => (
                <button
                  key={ut.id}
                  type="button"
                  onClick={() => {
                    setTargetType("UNIT_TYPE");
                    setSelectedUnitTypeId(ut.id);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    targetType === "UNIT_TYPE" && selectedUnitTypeId === ut.id
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  🚪 {ut.name} ({ut.count} units)
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: HOUSE AREA / ROOM CATEGORY SELECTOR */}
          <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-3">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider block">
              Step 2: Select Room Area / House Category
            </label>
            <div className="flex flex-wrap gap-2">
              {ROOM_CATEGORIES.map((cat) => {
                let icon = "📷";
                if (cat.includes("Living")) icon = "🛋️";
                if (cat.includes("Kitchen")) icon = "🍳";
                if (cat.includes("Master")) icon = "🛏️";
                if (cat.includes("Bedroom") && !cat.includes("Master")) icon = "🛏️";
                if (cat.includes("Bathroom")) icon = "🚿";
                if (cat.includes("Exterior")) icon = "🌳";
                if (cat.includes("Shared")) icon = "🏢";

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setPhotoCategory(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      photoCategory === cat
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-background text-muted-foreground border-border hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3: UPLOAD FILE INPUT & BUTTON */}
          <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">
                  Target:{" "}
                  <span className="text-emerald-700 font-extrabold">
                    {targetType === "PROPERTY"
                      ? "Building / Property Level"
                      : property.unitTypes?.find((u: any) => u.id === selectedUnitTypeId)?.name}
                  </span>{" "}
                  → Category: <span className="text-emerald-700 font-extrabold">{photoCategory}</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Select one or multiple high-resolution photos for this section
                </p>
              </div>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                {uploadFiles ? `${uploadFiles.length} file(s) selected` : "No files selected"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setUploadFiles(e.target.files)}
                className="w-full text-xs text-foreground file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
              />
              <Button
                onClick={handleUploadCategorizedPhotos}
                disabled={isUploading || !uploadFiles}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2 rounded-xl"
              >
                {isUploading ? "Uploading..." : "Upload Photos"}
              </Button>
            </div>
          </div>

          {/* STEP 4: MANAGED EXISTING PHOTOS PREVIEW & DELETE */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Currently Uploaded Photos for Selected Target
            </h4>

            {(() => {
              const currentPhotos =
                targetType === "PROPERTY"
                  ? property.photos || []
                  : property.unitTypes?.find((u: any) => u.id === selectedUnitTypeId)?.photos || [];

              if (currentPhotos.length === 0) {
                return (
                  <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-xl">
                    No photos uploaded for this target level yet.
                  </p>
                );
              }

              return (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-56 overflow-y-auto p-1">
                  {currentPhotos.map((photo: any) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-4/3 rounded-xl overflow-hidden border border-border bg-slate-100"
                    >
                      <img
                        src={photo.url?.startsWith("http") ? photo.url : `${API_URL}${photo.url}`}
                        alt={photo.category}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90 transition-opacity" />
                      <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded-md">
                        {photo.category || "General"}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleDeletePhoto(photo.id, targetType === "PROPERTY" ? "property" : "unitType")
                        }
                        disabled={deletingPhotoId === photo.id}
                        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs font-bold hover:bg-red-700 shadow-md transition-transform transform hover:scale-110"
                        title="Delete photo"
                      >
                        {deletingPhotoId === photo.id ? "..." : "✕"}
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Condition Report Checklist Editor */}
        <div className="border-t border-border pt-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">Official Condition Report Checklist</h3>
            <span className="text-xs font-semibold text-primary">Field Agents Log</span>
          </div>

          {["floors", "utilities", "walls"].map((section) => {
            const sectionData = conditionReport[section];
            if (!sectionData?.items) return null;
            return (
              <div key={section} className="rounded-xl border border-border overflow-hidden bg-card">
                <div className="bg-muted/40 px-4 py-2.5 border-b border-border">
                  <h4 className="font-bold text-xs capitalize text-foreground">{section} Inspection</h4>
                </div>
                <div className="divide-y divide-border/60">
                  {sectionData.items.map((item: any) => (
                    <div
                      key={item.name}
                      onClick={() => toggleConditionItem(section, item.name)}
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-white text-xs font-bold ${
                            item.status === "No issues" ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        >
                          ✓
                        </span>
                        <span className="text-sm font-semibold text-foreground">{item.name}</span>
                      </div>
                      <span
                        className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                          item.status === "No issues"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action CTAs */}
        <div className="border-t border-border pt-4 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSaveInspection}
            disabled={isSaving}
            className="bg-emerald-600 text-white hover:bg-emerald-700 font-semibold px-6"
          >
            {isSaving ? "Saving..." : "Save Inspection Data"}
          </Button>
        </div>
      </div>
    </div>
  );
}
