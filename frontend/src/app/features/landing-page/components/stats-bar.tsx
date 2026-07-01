import { Building2, Home, Users } from "lucide-react";

const STATS = [
  { icon: Home, value: "1+", label: "Active listings" },
  { icon: Building2, value: "12", label: "Nairobi areas" },
  { icon: Users, value: "100%", label: "Direct contact" },
];

export function StatsBar() {
  return (
    <section className="bg-foreground px-6 py-12 text-background">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
        {STATS.map(({ icon: Icon, value, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 text-center"
          >
            <Icon className="h-6 w-6 text-secondary" />
            <span className="text-3xl font-bold">{value}</span>
            <span className="text-sm text-background/70">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
