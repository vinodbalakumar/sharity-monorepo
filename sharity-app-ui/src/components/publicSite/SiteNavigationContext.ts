import { createContext } from "react";
import type { AppRoute } from "../../types/navigation";
export const SiteNavigationContext = createContext<{
  navigate: (route: AppRoute) => void;
  openPublicContent: (slug: string) => void;
} | null>(null);
