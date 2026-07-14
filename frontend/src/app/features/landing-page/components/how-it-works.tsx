import { MapPin, ShieldCheck, Phone } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: MapPin,
    title: "GPS Lock",
    description:
      "Our landlords pin the exact GPS location of every property — so you see the real location before you travel.",
  },
  {
    number: "02",
    icon: ShieldCheck,
    title: "Admin Verification",
    description:
      "Every landlord is manually verified by our team. Only verified landlords can post active listings.",
  },
  {
    number: "03",
    icon: Phone,
    title: "Call Directly",
    description:
      "Contact the landlord directly. No agent, no commission, no middleman. Just you and the landlord.",
  },

   {
    number: "01",
    icon: MapPin,
    title: "GPS Lock",
    description:
      "Browse by area, type, and budget. All listings are from real landlords.",
  },
  



  
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-20">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
        <p className="mt-2 text-muted-foreground">Three steps to your next home</p>

        <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-3">
          {STEPS.map(({ number, icon: Icon, title, description }) => (
            <div key={number} className="flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </span>
              <span className="mt-3 text-xs font-semibold tracking-widest text-muted-foreground/50">
                {number}
              </span>
              <h3 className="mt-1 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}