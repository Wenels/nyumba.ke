"use client";

import { useEffect, useState } from "react";
import { Building2, Home, Users } from "lucide-react";

interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
}

function CountUp({ end, duration = 5000, suffix = "" }: CountUpProps) {
  const [count, setCount] = useState(0);
  const [start, setStart] = useState(false);
  const [elementRef, setElementRef] = useState<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!elementRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStart(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(elementRef);

    return () => {
      observer.disconnect();
    };
  }, [elementRef]);

  useEffect(() => {
    if (!start) return;

    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing: easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      
      const currentCount = Math.floor(ease * end);
      setCount(currentCount);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [start, end, duration]);

  return (
    <span ref={setElementRef}>
      {count}
      {suffix}
    </span>
  );
}

const STATS = [
  { icon: Home, end: 1, suffix: "+", label: "Active listings" },
  { icon: Building2, end: 12, suffix: "", label: "Nairobi areas" },
  { icon: Users, end: 100, suffix: "%", label: "Direct contact" },
];

export function StatsBar() {
  return (
    <section className="bg-foreground px-6 py-12 text-background">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
        {STATS.map(({ icon: Icon, end, suffix, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-2 text-center"
          >
            <Icon className="h-6 w-6 text-secondary animate-pulse" />
            <span className="text-3xl font-bold tracking-tight">
              <CountUp end={end} suffix={suffix} duration={2000} />
            </span>
            <span className="text-sm text-background/70">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

