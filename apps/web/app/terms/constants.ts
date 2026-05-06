import type { LegalSection } from '../legal/types';

export const TERMS_SECTIONS: readonly LegalSection[] = [
  {
    id: 'acceptance-of-terms',
    title: 'Acceptance of Terms',
    paragraphs: [
      'By accessing or using the service, you agree to be bound by these Terms and Conditions and our applicable policies. If you do not agree, you must not use the service.',
      'You represent that you have the legal capacity to enter into these terms and, if you use the service on behalf of an organization, that you are authorized to bind that organization.',
    ],
  },
  {
    id: 'use-license',
    title: 'Use License',
    paragraphs: [
      'Subject to your compliance with these terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the service for its intended purpose.',
      'You may not copy, modify, distribute, sell, lease, reverse engineer, or attempt to extract source code except as permitted by law or with our prior written consent.',
    ],
  },
  {
    id: 'disclaimer',
    title: 'Disclaimer',
    paragraphs: [
      'The service is provided on an “as is” and “as available” basis. To the fullest extent permitted by law, we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.',
      'We do not warrant that the service will be uninterrupted, secure, or error-free, or that defects will be corrected.',
    ],
  },
  {
    id: 'limitation-of-liability',
    title: 'Limitation of Liability',
    paragraphs: [
      'To the maximum extent permitted by applicable law, we and our affiliates, officers, directors, employees, and suppliers will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data, or goodwill.',
      'Our aggregate liability arising out of or relating to the service will not exceed the greater of amounts you paid us for the service in the twelve months before the claim or one hundred currency units, where permitted by law.',
    ],
  },
  {
    id: 'user-responsibilities',
    title: 'User Responsibilities',
    paragraphs: [
      'You are responsible for maintaining the confidentiality of your account credentials and for activity under your account. You agree to provide accurate information and to comply with applicable laws and third-party rights.',
      'You must not misuse the service, including by probing, scanning, or testing vulnerabilities without authorization, sending malware, harassing others, or circumventing access controls.',
    ],
  },
  {
    id: 'modification-of-terms',
    title: 'Modification of Terms',
    paragraphs: [
      'We may modify these terms from time to time. We will provide notice of material changes as appropriate through the service or other reasonable means. Continued use after changes become effective constitutes acceptance of the revised terms.',
    ],
  },
  {
    id: 'governing-law',
    title: 'Governing Law',
    paragraphs: [
      'These terms are governed by the laws of the jurisdiction we designate in our product documentation, without regard to conflict of law principles, except where mandatory consumer protections apply in your jurisdiction.',
    ],
  },
  {
    id: 'contact-us',
    title: 'Contact Us',
    paragraphs: [
      'For questions regarding these Terms and Conditions, please contact us using the contact information provided in the application or on our website.',
    ],
  },
];
