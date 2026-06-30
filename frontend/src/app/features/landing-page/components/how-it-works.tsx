import { Search, MapPin, Phone } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: Search,
    title: "Search & filter",
    description: "Browse by area, type, and budget. All listings are from real landlords.",
  },
  {
    number: "02",
    icon: MapPin,
    title: "View on the map",
    description: "Every listing has an exact pin — see the actual location before you travel.",
  },
  {
    number: "03",
    icon: Phone,
    title: "Call directly",
    description: "Get the landlord's number and call directly. No agent, no commission.",
  },
];

export function HowItWorks() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
        <p className="mt-2 text-muted-foreground">Three steps to your next home</p>

        <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-3">
          {STEPS.map(({ number, icon: Icon, title, description }) => (
            <div key={number} className="flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10">
                <Icon className="h-6 w-6 text-secondary" />
              </span>
              <span className="mt-3 text-xs font-medium text-muted-foreground/50">{number}</span>
              <h3 className="mt-1 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
