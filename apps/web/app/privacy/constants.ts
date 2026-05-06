import type { LegalSection } from '../legal/types';

export const PRIVACY_SECTIONS: readonly LegalSection[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    paragraphs: [
      'This Privacy Policy describes how we collect, use, and disclose information when you use our services. By accessing or using the service, you agree to the practices described here.',
      'This policy applies to information collected through our website, applications, and related tools. We may update it from time to time; the “last updated” reference in product notices will reflect material changes when applicable.',
    ],
  },
  {
    id: 'information-we-collect',
    title: 'Information We Collect',
    paragraphs: [
      'We may collect information you provide directly, such as account registration details, profile information, communications with support, and content you submit through the product.',
      'We may automatically collect certain technical and usage data, including device type, browser language, approximate location derived from IP address, log events, and cookies or similar technologies used for security and product improvement.',
    ],
  },
  {
    id: 'how-we-use-information',
    title: 'How We Use Information',
    paragraphs: [
      'We use collected information to provide and maintain the service, authenticate users, personalize experience, analyze usage to improve features, communicate regarding security or legal matters, and comply with applicable law.',
      'We do not sell your personal information. Processing may include service providers acting on our instructions under appropriate agreements.',
    ],
  },
  {
    id: 'data-sharing',
    title: 'Data Sharing',
    paragraphs: [
      'We may share information with vendors that assist with hosting, analytics, email delivery, security monitoring, and customer support, subject to confidentiality and purpose limitations.',
      'We may disclose information if required by law, to protect rights and safety, or as part of a business transfer such as a merger or acquisition, in accordance with applicable requirements.',
    ],
  },
  {
    id: 'your-rights',
    title: 'Your Rights',
    paragraphs: [
      'Depending on your jurisdiction, you may have rights to access, correct, delete, or export certain personal data, and to object to or restrict certain processing.',
      'You may contact us using the details below to exercise applicable rights. We may need to verify your identity before fulfilling requests.',
    ],
  },
  {
    id: 'contact-us',
    title: 'Contact Us',
    paragraphs: [
      'If you have questions about this Privacy Policy or our data practices, please contact us using the contact options provided in the application or on our website.',
    ],
  },
];
