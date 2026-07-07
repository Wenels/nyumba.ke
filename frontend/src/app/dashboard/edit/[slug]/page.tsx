"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import type { Listing } from "@/app/features/listings/hooks/use-listings";

const PROPERTY_TYPES = [
  "Bedsitter", "1 Bedroom", "2 Bedrooms", "3 Bedrooms",
  "4+ Bedrooms", "Bungalow", "Maisonette", "Studio",
];

const editSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  price: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().int().positive()),
  bedrooms: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().int().min(0)),
  bathrooms: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().int().min(0)),
  propertyType: z.string().min(1),
  address: z.string().min(5),
});

type EditValues = {
  title: string;
  description: string;
  price: string;
  bedrooms: string;
  bathrooms: string;
  propertyType: string;
  address: string;
};

export default function EditListingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["listings", slug],
    queryFn: () => api.get(`/api/listings/${slug}`) as Promise<{ listing: Listing }>,
    enabled: !!slug,
  });

  const listing = data?.listing;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditValues, any, z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    if (listing) {
      reset({
        title: listing.title,
        description: listing.description,
        price: String(listing.price),
        bedrooms: String(listing.bedrooms),
        bathrooms: String(listing.bathrooms),
        propertyType: listing.propertyType,
        address: listing.address,
      });
    }
  }, [listing, reset]);

  async function onSubmit(values: z.infer<typeof editSchema>) {
    try {
      await api.patch(`/api/listings/${slug}`, values);
      toast.success("Listing updated!");
      router.push("/dashboard/listings");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? (err.body as { error?: string })?.error
          : "Something went wrong";
      toast.error("Update failed", { description: message });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center text-destructive">
        Listing not found.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit listing</h1>
        <p className="mt-1 text-muted-foreground truncate">{listing.title}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="font-semibold">Basic information</h2>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</Label>
            <Input className="mt-1.5" {...register("title")} />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</Label>
            <textarea
              rows={4}
              className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              {...register("description")}
            />
            {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Monthly rent (Ksh)</Label>
              <Input type="number" className="mt-1.5" {...register("price")} />
              {errors.price && <p className="mt-1 text-xs text-destructive">{errors.price.message}</p>}
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Property type</Label>
              <select
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register("propertyType")}
              >
                {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bedrooms</Label>
              <Input type="number" min={0} className="mt-1.5" {...register("bedrooms")} />
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bathrooms</Label>
              <Input type="number" min={0} className="mt-1.5" {...register("bathrooms")} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="font-semibold">Location</h2>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Address</Label>
            <Input className="mt-1.5" {...register("address")} />
            {errors.address && <p className="mt-1 text-xs text-destructive">{errors.address.message}</p>}
          </div>
          <p className="text-sm text-muted-foreground">
            To update the map pin, delete and re-post this listing.
          </p>
        </div>

        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
