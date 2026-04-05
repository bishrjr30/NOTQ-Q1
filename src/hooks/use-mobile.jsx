// src/hooks/use-mobile.jsx

import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(undefined);

  React.useEffect(() => {
    // حماية أثناء الـ build أو SSR
    if (typeof window === "undefined" || typeof window.matchMedia === "undefined") {
      setIsMobile(false);
      return;
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    mql.addEventListener?.("change", onChange);
    // أول مرة
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    return () => {
      mql.removeEventListener?.("change", onChange);
    };
  }, []);

  return !!isMobile;
}
