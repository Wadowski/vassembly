import type { FooterProps } from '@vassembly/ui-footer';
import type {
  LayoutDrawerPreset,
  LayoutHeaderPreset,
  LayoutPreset,
  LayoutVariant,
} from './types';
import { buildMainDrawerSections } from './presets/main';
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
  const isAuthenticated =
    params.drawer?.isAuthenticated ?? base.drawer.isAuthenticated;
  const userRole = params.drawer?.userRole ?? base.drawer.userRole;
  const isAdmin = userRole?.trim().toLowerCase() === 'admin';
  const drawerSections =
    params.variant === 'main'
      ? buildMainDrawerSections({ isAuthenticated, isAdmin })
      : base.drawer.sections;
  const drawer: LayoutDrawerPreset = {
    ...base.drawer,
    ...params.drawer,
    user: params.drawer?.user ?? base.drawer.user,
    sections: params.drawer?.sections ?? drawerSections,
    branding: params.drawer?.branding ?? base.drawer.branding,
    isAuthenticated,
    onLogin: params.drawer?.onLogin ?? base.drawer.onLogin,
    onRegister: params.drawer?.onRegister ?? base.drawer.onRegister,
    onLogout: params.drawer?.onLogout ?? base.drawer.onLogout,
    onOpenSettings: params.drawer?.onOpenSettings ?? base.drawer.onOpenSettings,
  };
  return {
    footer: { ...base.footer, ...params.footer },
    header,
    drawer,
  };
}
