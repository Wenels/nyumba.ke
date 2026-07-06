"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPicker } from "@/app/features/listings/components/map-picker";
import { api, ApiError } from "@/lib/api";

const PROPERTY_TYPES = [
  "Bedsitter",
  "1 Bedroom",
  "2 Bedrooms",
  "3 Bedrooms",
  "4+ Bedrooms",
  "Bungalow",
  "Maisonette",
  "Studio",
];


const listingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  price: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().int().positive("Price must be positive")),
  bedrooms: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().int().min(0, "Invalid")),
  bathrooms: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().int().min(0, "Invalid")),
  propertyType: z.string().min(1, "Select a property type"),
  address: z.string().min(5, "Enter a valid address"),
});

type ListingValues = {
  title: string;
  description: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  propertyType: string;
  address: string;
};

export default function PostListingPage() {
  const router = useRouter();
  const [lat, setLat] = useState(-1.2921);
  const [lng, setLng] = useState(36.8219);
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ListingValues, any, z.infer<typeof listingSchema>>({
    resolver: zodResolver(listingSchema),
    defaultValues: { bedrooms: "1", bathrooms: "1" },
  });

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPhotos((prev) => [...prev, ...files].slice(0, 10));
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(values: z.infer<typeof listingSchema>) {
    setIsSubmitting(true);
    try {
      // 1. Create the listing
      const res = (await api.post("/api/listings", {
        ...values,
        latitude: lat,
        longitude: lng,
      })) as { listing: { id: string; slug: string } };

      const { id } = res.listing;

      // 2. Upload photos if any
      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach((photo) => formData.append("photos", photo));

        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/listings/${id}/photos`,
          {
            method: "POST",
            body: formData,
            credentials: "include",
          }
        );
      }

      toast.success("Listing posted!", {
        description: "Your listing is now live on Nyumba.ke.",
      });

      router.push("/dashboard/listings");
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { error?: string };
        toast.error("Failed to post listing", {
          description: body?.error || "Something went wrong.",
        });
      } else {
        toast.error("Could not reach the server");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Post a listing</h1>
        <p className="mt-1 text-muted-foreground">
          Fill in the details below to list your property.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic info */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="font-semibold">Basic information</h2>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Title
            </Label>
            <Input
              placeholder="e.g. Spacious 2 Bedroom in Kilimani"
              className="mt-1.5"
              {...register("title")}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Description
            </Label>
            <textarea
              placeholder="Describe the property — size, amenities, nearby landmarks, lease terms..."
              rows={4}
              className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              {...register("description")}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Monthly rent (Ksh)
              </Label>
              <Input
                type="number"
                placeholder="e.g. 25000"
                className="mt-1.5"
                {...register("price")}
              />
              {errors.price && (
                <p className="mt-1 text-xs text-destructive">{errors.price.message}</p>
              )}
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Property type
              </Label>
              <select
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("propertyType")}
              >
                <option value="">Select type...</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.propertyType && (
                <p className="mt-1 text-xs text-destructive">{errors.propertyType.message}</p>
              )}
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Bedrooms
              </Label>
              <Input
                type="number"
                min={0}
                className="mt-1.5"
                {...register("bedrooms")}
              />
              {errors.bedrooms && (
                <p className="mt-1 text-xs text-destructive">{errors.bedrooms.message}</p>
              )}
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Bathrooms
              </Label>
              <Input
                type="number"
                min={0}
                className="mt-1.5"
                {...register("bathrooms")}
              />
              {errors.bathrooms && (
                <p className="mt-1 text-xs text-destructive">{errors.bathrooms.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="font-semibold">Location</h2>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Address
            </Label>
            <Input
              placeholder="e.g. Menelik Road, Kilimani, Nairobi"
              className="mt-1.5"
              {...register("address")}
            />
            {errors.address && (
              <p className="mt-1 text-xs text-destructive">{errors.address.message}</p>
            )}
          </div>

          <MapPicker
            lat={lat}
            lng={lng}
            onChange={(newLat, newLng) => {
              setLat(newLat);
              setLng(newLng);
            }}
          />
        </div>

        {/* Photos */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div>
            <h2 className="font-semibold">Photos</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Upload up to 10 photos. First photo will be the cover image.
            </p>
          </div>

          <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border p-8 hover:border-secondary transition-colors">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Click to upload photos (JPEG, PNG, WebP — max 5MB each)
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handlePhotoChange}
            />
          </label>

          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {photos.map((photo, i) => (
                <div key={i} className="group relative aspect-square rounded-lg overflow-hidden border border-border">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Photo ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 rounded bg-foreground/70 px-1.5 py-0.5 text-xs text-background">
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

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            {isSubmitting ? "Posting..." : "Post listing"}
          </Button>
        </div>
      </form>
    </div>
  );
}
