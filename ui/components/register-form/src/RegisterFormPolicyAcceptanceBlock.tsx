import type { MouseEvent } from 'react';
import { Checkbox } from '@vassembly/ui-checkbox';
import type { CheckboxChecked } from '@vassembly/ui-checkbox';
import { Text } from '@vassembly/ui-text';
import { Button } from '@vassembly/ui-button';

import styles from './RegisterFormPolicyAcceptanceBlock.module.scss';

export interface RegisterFormPolicyAcceptanceBlockProps {
  acceptedPrivacyPolicy: boolean;
  acceptedTerms: boolean;
  isLoading: boolean;
  onAcceptedPrivacyPolicyChange: (isChecked: boolean) => void;
  onAcceptedTermsChange: (isChecked: boolean) => void;
}

const mapToBoolean = (next: CheckboxChecked): boolean => next === true;

export const RegisterFormPolicyAcceptanceBlock = (
  props: RegisterFormPolicyAcceptanceBlockProps,
) => {
  const {
    acceptedPrivacyPolicy,
    acceptedTerms,
    isLoading,
    onAcceptedPrivacyPolicyChange,
    onAcceptedTermsChange,
  } = props;

  const handlePrivacyChange = (next: CheckboxChecked): void => {
    onAcceptedPrivacyPolicyChange(mapToBoolean(next));
  };

  const handleTermsChange = (next: CheckboxChecked): void => {
    onAcceptedTermsChange(mapToBoolean(next));
  };

  const handlePolicyLinkClick = (event: React.MouseEvent<HTMLElement>): void => {
    event.stopPropagation();
  };

  const policyLinkClassName = styles.policyLink;

  const privacyPolicyLabel = (
    <>
      <Text variant="label" as="span">
        I agree to the{' '}
      </Text>
      <Button
        as="a"
        href="/privacy"
        variant="text"
        color="tertiary"
        text="Privacy Policy"
        textVariant="label"
        onClick={handlePolicyLinkClick}
        className={policyLinkClassName}
      />
    </>
  );

  const termsLabel = (
    <>
      <Text variant="label" as="span">
        I agree to the{' '}
      </Text>
      <Button
        as="a"
        href="/terms"
        variant="text"
        color="tertiary"
        text="Terms and Conditions"
        textVariant="label"
        onClick={handlePolicyLinkClick}
        className={policyLinkClassName}
      />
    </>
  );

  return (
    <>
      <Checkbox
        checked={acceptedPrivacyPolicy}
        onCheckedChange={handlePrivacyChange}
        label={privacyPolicyLabel}
        isRequired
        isDisabled={isLoading}
      />
      <Checkbox
        checked={acceptedTerms}
        onCheckedChange={handleTermsChange}
        label={termsLabel}
        isRequired
        isDisabled={isLoading}
      />
    </>
  );
};
