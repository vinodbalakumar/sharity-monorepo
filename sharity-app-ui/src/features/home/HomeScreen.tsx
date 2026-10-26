import { InteriorShell } from "../../components/appShell";
import type { VisitorContextResponse } from "../../services/publicContentApi";
import type { AppRoute } from "../../types/navigation";
import { StorefrontContent } from "../marketplace/StorefrontContent";
type Props = {
  onNavigate: (route: AppRoute) => void;
  onOpenDigitalProduct: (id: string) => void;
  visitorContext: VisitorContextResponse | null;
};
export function HomeScreen({ onNavigate, onOpenDigitalProduct }: Props) {
  return (
    <InteriorShell
      activeLabel="Home"
      title="Your marketplace"
      onNavigate={onNavigate}
    >
      <StorefrontContent
        onNavigate={onNavigate}
        onOpenProduct={onOpenDigitalProduct}
      />
    </InteriorShell>
  );
}
