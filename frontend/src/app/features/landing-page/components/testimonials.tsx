const TESTIMONIALS = [
  {
    quote:
      "I was so tired of fake listings and dishonest agents. Nyumba.ke was a total game-changer. The listing photos were honest and accurate. I could book a viewing with confidence.",
    name: "Jane Wambui",
    location: "Tenant in Kilimani",
    stars: 5,
  },
  {
    quote:
      "Finally a platform that doesn't waste my time. I found my current place in under two days. The verified status means no surprises when you arrive.",
    name: "Mark Otieno",
    location: "Tenant in Westlands",
    stars: 5,
  },
  {
    quote:
      "The GPS pin was accurate to the gate. My agent takes you to Hunter Spine, but Nyumba.ke takes you to the exact place. Zero confusion.",
    name: "Sarah Kiprorsh",
    location: "Tenant in Parklands",
    stars: 5,
  },
];

export function Testimonials() {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          What our tenants say
        </h2>
        <p className="mt-2 text-center text-muted-foreground">
          Real stories from real Nairobians
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map(({ quote, name, location, stars }) => (
            <div
              key={name}
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex gap-0.5 text-secondary">
                {[...Array(stars)].map((_, i) => (
                  <span key={i} className="text-lg">★</span>
                ))}
              </div>
              <p className="mt-4 text-sm italic text-muted-foreground leading-relaxed">
                "{quote}"
              </p>
              <div className="mt-5 border-t border-border pt-4">
                <p className="font-semibold text-sm">{name}</p>
                <p className="text-xs text-muted-foreground">{location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
