import type { AppRoute } from "../../types/navigation";
export type FooterLink =
  | { label: string; slug: string; route?: never }
  | { label: string; route: AppRoute; slug?: never };
export type PublicSiteFooterLinkGroup = { title: string; links: FooterLink[] };
export const footerGroups: PublicSiteFooterLinkGroup[] = [
  {
    title: "Shop",
    links: [
      { label: "All products", route: "marketplaces" },
      { label: "Digital goods & gift cards", route: "digitalMarketplace" },
      { label: "Jewellery", route: "jewelryMarketplace" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "About Sharity", slug: "about-us" },
      { label: "Careers", slug: "careers" },
      { label: "Press Center", slug: "press" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Help Center", slug: "help-center" },
      { label: "Contact Support", slug: "contact-us" },
      { label: "Safety Center", slug: "safety" },
    ],
  },
  {
    title: "Policies",
    links: [
      { label: "Terms of Use", slug: "terms" },
      { label: "Privacy Policy", slug: "privacy" },
      { label: "Community Guidelines", slug: "guidelines" },
    ],
  },
];
export function publicContentPath(slug: string) {
  const section = ["privacy", "terms", "guidelines"].includes(slug)
    ? "legal"
    : ["help-center", "safety", "contact-us"].includes(slug)
      ? "support"
      : "company";
  return `/app/${section}/${slug}`;
}
export function footerLinkPath(link: FooterLink) {
  if (link.slug) return publicContentPath(link.slug);
  return (
    (
      {
        marketplaces: "/app/marketplaces",
        digitalMarketplace: "/app/marketplace/digital",
        jewelryMarketplace: "/app/marketplace/jewellery",
        sellerVerification: "/app/sell",
        chat: "/chat",
        orders: "/app/orders",
      } as Partial<Record<AppRoute, string>>
    )[link.route!] || "/app/"
  );
}
