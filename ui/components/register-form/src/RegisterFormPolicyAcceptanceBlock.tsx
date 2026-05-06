import { Checkbox } from '@vassembly/ui-checkbox';
import type { CheckboxChecked } from '@vassembly/ui-checkbox';

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

  return (
    <>
      <Checkbox
        checked={acceptedPrivacyPolicy}
        onCheckedChange={handlePrivacyChange}
        label="I accept the Privacy Policy"
        isRequired
        isDisabled={isLoading}
      />
      <Checkbox
        checked={acceptedTerms}
        onCheckedChange={handleTermsChange}
        label="I accept the Terms and Conditions"
        isRequired
        isDisabled={isLoading}
      />
    </>
  );
};
