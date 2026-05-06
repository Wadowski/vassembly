import type { Metadata } from 'next';

import { LegalDocumentShell } from '../legal/LegalDocumentShell';
import { TERMS_SECTIONS } from './constants';

export const metadata: Metadata = {
  title: 'Terms and Conditions',
  description:
    'Read the terms that govern your use of our website and services.',
};

export function TermsAndConditionsPage() {
  return <LegalDocumentShell title="Terms and Conditions" sections={TERMS_SECTIONS} />;
}

export default TermsAndConditionsPage;
