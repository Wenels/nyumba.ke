"use client";

import { useEffect, useRef, useState } from "react";
import { Home, Users, Map, ShieldCheck, LucideIcon } from "lucide-react";

interface StatItem {
  icon: LucideIcon;
  target: number;
  suffix: string;
  formatComma?: boolean;
  label: string;
}

const STATS: StatItem[] = [
  { icon: Home, target: 200, suffix: "+", label: "VERIFIED PROPERTIES" },
  { icon: Users, target: 1400, suffix: "+", formatComma: true, label: "TENANTS PLACED" },
  { icon: Map, target: 15, suffix: "", label: "NAIROBI WARDS" },
  { icon: ShieldCheck, target: 100, suffix: "%", label: "ENGINEER INSPECTED" },
];

function CountUpNumber({
  target,
  suffix,
  formatComma,
  isVisible,
}: {
  target: number;
  suffix: string;
  formatComma?: boolean;
  isVisible: boolean;
}) {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (!isVisible) {
      setCount(0);
      return;
    }

    let startTimestamp: number | null = null;
    const duration = 6000; // 6 seconds smooth animation

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // Smooth ease-out expo animation curve
      const easeOutProgress = 1 - Math.pow(2, -10 * progress);
      const currentCount = Math.floor(easeOutProgress * target);

      setCount(currentCount);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible, target]);

  const formattedValue = formatComma
    ? count.toLocaleString()
    : count.toString();

  return (
    <span>
      {formattedValue}
      {suffix}
    </span>
  );
}

export function StatsBar() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section ref={sectionRef} className="bg-foreground px-6 py-12 text-background">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 sm:grid-cols-4">
        {STATS.map(({ icon: Icon, target, suffix, formatComma, label }) => (
          <div key={label} className="flex flex-col items-center gap-2 text-center">
            <Icon className="h-6 w-6 text-secondary" />
            <span className="text-3xl font-bold tracking-tight">
              <CountUpNumber
                target={target}
                suffix={suffix}
                formatComma={formatComma}
                isVisible={isVisible}
              />
            </span>
            <span className="text-xs font-semibold tracking-widest text-background/50">
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}