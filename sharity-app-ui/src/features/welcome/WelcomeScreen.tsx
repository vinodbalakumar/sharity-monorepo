import { InteriorShell } from "../../components/appShell";
import { PublicSiteFooter } from "../../components/publicSite/PublicSiteFooter";
import type { VisitorContextResponse } from "../../services/publicContentApi";
import type { AppRoute } from "../../types/navigation";
import { StorefrontContent } from "../marketplace/StorefrontContent";
import { footerGroups } from "./welcomeContent";
type Props = {
  onBrowse: () => void;
  onGetStarted: () => void;
  onOpenPublicContent: (slug: string) => void;
  onOpenMarketplace: (
    route: "digitalMarketplace" | "jewelryMarketplace",
  ) => void;
  onSearchMarketplace: (query: string) => void;
  onSignIn: () => void;
  visitorContext: VisitorContextResponse | null;
  notice?: string;
  onNavigate: (route: AppRoute) => void;
  onOpenProduct: (id: string) => void;
};
export function WelcomeScreen(props: Props) {
  return (
    <InteriorShell
      publicMode
      activeLabel="Home"
      title="Welcome to Sharity"
      onNavigate={props.onNavigate}
    >
      <StorefrontContent
        landing
        notice={props.notice}
        onNavigate={props.onNavigate}
        onOpenProduct={props.onOpenProduct}
        onCreateAccount={props.onGetStarted}
      />
      <PublicSiteFooter
        groups={footerGroups}
        onLinkPress={props.onOpenPublicContent}
        onBrandPress={() => props.onNavigate("welcome")}
        visitorContext={props.visitorContext}
      />
    </InteriorShell>
  );
}
