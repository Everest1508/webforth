/**
 * Content shape for the website builder.
 * Used in drafts, Git content files, and site rendering.
 */

export type BlockType =
  | "hero"
  | "features"
  | "cta"
  | "testimonials"
  | "text"
  | "image"
  | "nav";

export interface SectionStyle {
  maxWidth?: "sm" | "md" | "lg" | "full";
  padding?: "none" | "sm" | "md" | "lg";
  backgroundColor?: string;
  textColor?: string;
  minHeight?: string;
}

export interface HeroBlock {
  type: "hero";
  id: string;
  heading: string;
  subheading?: string;
  primaryButton?: { label: string; url: string };
  secondaryButton?: { label: string; url: string };
  backgroundImage?: string;
  layout?: "left" | "center" | "right";
  style?: SectionStyle;
}

export interface FeatureItem {
  title: string;
  description: string;
  icon?: string;
}

export interface FeaturesBlock {
  type: "features";
  id: string;
  heading: string;
  subheading?: string;
  items: FeatureItem[];
  columns?: 2 | 3 | 4;
  style?: SectionStyle;
}

export interface CtaBlock {
  type: "cta";
  id: string;
  heading: string;
  subheading?: string;
  buttonLabel: string;
  buttonUrl: string;
  backgroundColor?: string;
  style?: SectionStyle;
}

export interface TestimonialItem {
  quote: string;
  author: string;
  role?: string;
  avatar?: string;
}

export interface TestimonialsBlock {
  type: "testimonials";
  id: string;
  heading: string;
  items: TestimonialItem[];
}

export interface TextBlock {
  type: "text";
  id: string;
  heading?: string;
  body: string;
  alignment?: "left" | "center" | "right";
  style?: SectionStyle;
}

export interface ImageBlock {
  type: "image";
  id: string;
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  style?: SectionStyle;
}

export type ContentBlock =
  | HeroBlock
  | FeaturesBlock
  | CtaBlock
  | TestimonialsBlock
  | TextBlock
  | ImageBlock;

export interface PageContent {
  slug: string;
  title: string;
  metaDescription?: string;
  ogImage?: string;
  blocks: ContentBlock[];
}

export interface NavItem {
  label: string;
  url: string;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

export interface GlobalContent {
  siteName: string;
  logoUrl?: string;
  footerText?: string;
  socialLinks?: { platform: string; url: string }[];
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    fontChoice?: string;
    palette?: ColorPalette;
  };
  navigation: NavItem[];
}

export interface SiteContent {
  pages: PageContent[];
  global: GlobalContent;
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  pages: [
    {
      slug: "home",
      title: "Home",
      metaDescription: "Welcome to our site",
      blocks: [
        {
          type: "hero",
          id: "hero-1",
          heading: "Welcome to Our Site",
          subheading: "Edit this content in the dashboard.",
          primaryButton: { label: "Get Started", url: "/" },
          layout: "center",
        },
        {
          type: "text",
          id: "text-1",
          body: "<p>This is editable content. Users with editor permissions can change headings, images, and more.</p>",
          alignment: "center",
        },
      ],
    },
  ],
  global: {
    siteName: "Web Builder",
    navigation: [
      { label: "Home", url: "/" },
    ],
    footerText: "Built with Next.js",
  },
};
