import type { FooterProps } from '@vassembly/ui-footer';
import type {
  LayoutDrawerPreset,
  LayoutHeaderPreset,
  LayoutPreset,
  LayoutVariant,
} from './types';
import { LAYOUT_VARIANT_PRESETS } from './variantPresets';

export interface ResolveLayoutConfigParams {
  variant: LayoutVariant;
  footer?: Partial<FooterProps>;
  header?: Partial<LayoutHeaderPreset>;
  drawer?: Partial<LayoutDrawerPreset>;
}

export function resolveLayoutConfig(
  params: ResolveLayoutConfigParams,
): LayoutPreset {
  const base = LAYOUT_VARIANT_PRESETS[params.variant];
  const header: LayoutHeaderPreset = {
    ...base.header,
    ...params.header,
    logo: { ...base.header.logo, ...params.header?.logo },
    navLinks: params.header?.navLinks ?? base.header.navLinks,
  };
  const drawer: LayoutDrawerPreset = {
    ...base.drawer,
    ...params.drawer,
    user: params.drawer?.user ?? base.drawer.user,
    sections: params.drawer?.sections ?? base.drawer.sections,
    branding: params.drawer?.branding ?? base.drawer.branding,
    isAuthenticated:
      params.drawer?.isAuthenticated ?? base.drawer.isAuthenticated,
    onLogin: params.drawer?.onLogin ?? base.drawer.onLogin,
    onRegister: params.drawer?.onRegister ?? base.drawer.onRegister,
    onLogout: params.drawer?.onLogout ?? base.drawer.onLogout,
  };
  return {
    footer: { ...base.footer, ...params.footer },
    header,
    drawer,
  };
}
