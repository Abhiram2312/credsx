import { useReducedMotion } from "motion/react";
import { useLayoutEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

export function usePrefersReducedMotion() {
  const fromMotion = useReducedMotion();
  const [fromMedia, setFromMedia] = useState(() => window.matchMedia(QUERY).matches);

  useLayoutEffect(() => {
    const media = window.matchMedia(QUERY);
    const apply = () => setFromMedia(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return Boolean(fromMotion) || fromMedia;
}
