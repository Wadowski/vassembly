import type { ReactNode } from 'react';

export type FooterNavLink = {
  label: string;
  href: string;
};

export type FooterBrandContent = {
  logo?: ReactNode;
  tagline?: ReactNode;
};

export type FooterContactField = {
  label?: string;
  value: string;
  href?: string;
};

export type FooterContactContent = {
  email?: FooterContactField;
  phone?: FooterContactField;
  address?: ReactNode;
};

export type FooterSocialItem = {
  href: string;
  ariaLabel: string;
  icon: ReactNode;
};

export interface FooterProps {
  className?: string;
  id?: string;
  brand?: FooterBrandContent;
  sitemap?: readonly FooterNavLink[];
  company?: readonly FooterNavLink[];
  legal?: readonly FooterNavLink[];
  contact?: FooterContactContent;
  social?: readonly FooterSocialItem[];
  copyright?: ReactNode;
}

export interface FooterLinkColumnProps {
  ariaLabel: string;
  title: string;
  links: readonly FooterNavLink[];
  className?: string;
}

export interface FooterContactBlockProps {
  contact: FooterContactContent;
  className?: string;
}

export interface FooterCompanyLegalSlotProps {
  company?: readonly FooterNavLink[];
  legal?: readonly FooterNavLink[];
}

export interface FooterContactSocialSlotProps {
  contact?: FooterContactContent;
  social?: readonly FooterSocialItem[];
}
