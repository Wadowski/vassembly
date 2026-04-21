import { HeaderBrand } from './HeaderBrand';
import { HeaderNav } from './HeaderNav';
import { HeaderRoot } from './HeaderRoot';
import headerStyles from './Header.module.scss';
import { HeaderUtilities } from './HeaderUtilities';
import { MenuTriggerCTA } from './MenuTriggerCTA';
import type { HeaderProps } from './types';

export const Header = (props: HeaderProps): JSX.Element => {
  const {
    logo,
    onMenuPress,
    isMenuOpen,
    menuSurfaceId,
    navLinks,
    utilitiesSlot,
    navAriaLabel,
    menuAriaLabel,
    className,
    id,
    isSticky,
  } = props;

  const isExpanded: boolean = isMenuOpen ?? false;

  return (
    <HeaderRoot className={className} id={id} isSticky={isSticky}>
      <div className={headerStyles.leftGroup}>
        <HeaderBrand>{logo}</HeaderBrand>
        <HeaderNav links={navLinks ?? []} navAriaLabel={navAriaLabel} />
      </div>
      <div className={headerStyles.rightGroup}>
        <HeaderUtilities>{utilitiesSlot}</HeaderUtilities>
        <MenuTriggerCTA
          onPress={onMenuPress}
          isExpanded={isExpanded}
          controlsId={menuSurfaceId}
          ariaLabel={menuAriaLabel}
        />
      </div>
    </HeaderRoot>
  );
};

Header.displayName = 'Header';
