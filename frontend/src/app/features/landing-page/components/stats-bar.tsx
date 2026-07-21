import { Home, Users, Map, ShieldCheck } from "lucide-react";

const STATS = [
  { icon: Home, value: "200+", label: "VERIFIED PROPERTIES" },
  { icon: Users, value: "1,400+", label: "TENANTS PLACED" },
  { icon: Map, value: "15", label: "NAIROBI WARDS" },
  { icon: ShieldCheck, value: "100%", label: "ENGINEER INSPECTED" },
];

export function StatsBar() {
  return (
    <section className="bg-foreground px-6 py-12 text-background">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 sm:grid-cols-4">
        {STATS.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex flex-col items-center gap-2 text-center">
            <Icon className="h-6 w-6 text-secondary" />
            <span className="text-3xl font-bold">{value}</span>
            <span className="text-xs font-semibold tracking-widest text-background/50">
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}