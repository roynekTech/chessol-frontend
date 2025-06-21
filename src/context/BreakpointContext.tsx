import React, { createContext, useContext, useEffect, useState } from "react";

// Match Tailwind's default breakpoints
const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
};

type Breakpoint = "mobile" | "tablet" | "desktop";

interface BreakpointContextType {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: Breakpoint;
  width: number;
}

const BreakpointContext = createContext<BreakpointContextType | undefined>(
  undefined
);

export const useBreakpoint = () => {
  const ctx = useContext(BreakpointContext);
  if (!ctx)
    throw new Error("useBreakpoint must be used within BreakpointProvider");
  return ctx;
};

export const BreakpointProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : BREAKPOINTS.desktop
  );

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  let breakpoint: Breakpoint = "mobile";
  if (width >= BREAKPOINTS.desktop) breakpoint = "desktop";
  else if (width >= BREAKPOINTS.tablet) breakpoint = "tablet";

  return (
    <BreakpointContext.Provider
      value={{
        isMobile: breakpoint === "mobile",
        isTablet: breakpoint === "tablet",
        isDesktop: breakpoint === "desktop",
        breakpoint,
        width,
      }}
    >
      {children}
    </BreakpointContext.Provider>
  );
};
