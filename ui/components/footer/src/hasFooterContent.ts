import type { FooterProps } from './types';

export const hasRenderableCopyright = (copyright: FooterProps['copyright']): boolean => {
  if (!copyright) return false;
  if (typeof copyright === 'string') return !!copyright.trim();
  return true;
};

const hasBrand = (brand: FooterProps['brand']): boolean => {
  return !!(brand?.logo || brand?.tagline);
};

const hasContact = (contact: FooterProps['contact']): boolean => {
  return !!(contact.email || contact.phone || contact.address);
};

export const hasFooterContent = (props: FooterProps): boolean => {
  if (hasBrand(props.brand)) return true;
  if (props.sitemap?.length) return true;
  if (props.company?.length) return true;
  if (props.legal?.length) return true;
  if (hasContact(props.contact)) return true;
  if (props.social?.length) return true;
  if (hasRenderableCopyright(props.copyright)) return true;
  return false;
};
