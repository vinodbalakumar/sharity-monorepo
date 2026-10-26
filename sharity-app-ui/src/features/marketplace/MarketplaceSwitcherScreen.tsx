import { InteriorShell } from "../../components/appShell";
import type { AppRoute } from "../../types/navigation";
import { StorefrontContent } from "./StorefrontContent";
export function MarketplaceSwitcherScreen({
  onNavigate,
  onOpenDigitalProduct,
}: {
  onNavigate: (route: AppRoute) => void;
  onOpenDigitalProduct: (id: string) => void;
}) {
  return (
    <InteriorShell
      activeLabel="Marketplace"
      title="All products"
      onNavigate={onNavigate}
    >
      <StorefrontContent
        showHero={false}
        onNavigate={onNavigate}
        onOpenProduct={onOpenDigitalProduct}
      />
    </InteriorShell>
  );
}
