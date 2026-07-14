import { XCircle, CheckCircle2 } from "lucide-react";

const WITHOUT = [
  '"Always photos already, when can I visit?"',
  '"Every listing I visited looked nothing like the ad."',
  '"Paid a viewing fee to an agent who vanished."',
  '"The Google Map pin was 2km away from the house."',
];

const WITH = [
  "GPS-confirmed accurate locations.",
  "Direct landlord contact — no agents.",
  "Verified live availability status.",
  "Zero upfront viewing fees to agents.",
];

export function Comparison() {
  return (
    <section className="px-6 py-20 bg-muted/30">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          Why Nyumba.ke?
        </h2>
        <p className="mt-2 text-center text-muted-foreground">
          The difference is clear
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Without */}
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
            <div className="mb-5 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <h3 className="font-semibold text-destructive">
                Without Nyumba.ke
              </h3>
            </div>
            <ul className="space-y-4">
              {WITHOUT.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive/50" />
                  <span className="text-sm italic text-muted-foreground">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* With */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
            <div className="mb-5 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-primary">
                With Nyumba.ke ✓
              </h3>
            </div>
            <ul className="space-y-4">
              {WITH.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
