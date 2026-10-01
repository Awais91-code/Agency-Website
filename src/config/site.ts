export const siteConfig = {
  name: "Agency",
  shortName: "Agency",
  description:
    "A modern digital agency platform for strategy, design, development, automation and client experience.",
  email: "hello@agency.example",
  navigation: [
    { label: "Services", href: "/services" },
    { label: "Work", href: "/work" },
    { label: "Blog", href: "/blog" },
    { label: "Process", href: "/process" },
    { label: "Book", href: "/book" },
    { label: "About", href: "/about" },
  ],
  footerNavigation: [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: "Work", href: "/work" },
    { label: "Blog", href: "/blog" },
    { label: "About", href: "/about" },
    { label: "Process", href: "/process" },
    { label: "Book", href: "/book" },
    { label: "Contact", href: "/contact" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
