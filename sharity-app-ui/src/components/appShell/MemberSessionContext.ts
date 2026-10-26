import { createContext } from "react";

// Navigation and headers share the same verified session state.
export const MemberSessionContext = createContext<{
  authenticated: boolean;
  onSignedOut: () => void;
} | null>(null);
