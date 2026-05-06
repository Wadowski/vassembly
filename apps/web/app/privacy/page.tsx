import type { Metadata } from 'next';

import { LegalDocumentShell } from '../legal/LegalDocumentShell';
import { PRIVACY_SECTIONS } from './constants';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Learn how we collect, use, and protect information when you use our services.',
};

export function PrivacyPolicyPage() {
  return <LegalDocumentShell title="Privacy Policy" sections={PRIVACY_SECTIONS} />;
}

export default PrivacyPolicyPage;
