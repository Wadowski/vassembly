import { BulbIcon, PowerButtonIcon, SendEmailIcon } from '@vassembly/ui-system-design/icons';
import type { StepperStep } from '@vassembly/ui-system-design/stepper';

export const ONBOARDING_STEPPER_STEPS: readonly StepperStep[] = [
  {
    id: 'email',
    icon: <SendEmailIcon />,
    title: 'Verify email address',
    description: 'Confirm your email to secure your account.',
  },
  {
    id: 'ai-integration',
    icon: <BulbIcon />,
    title: 'Create first AI integration',
    description: 'Connect an AI provider to use platform agents.',
  },
  {
    id: 'mcp-connections',
    icon: <PowerButtonIcon />,
    title: 'Connect MCPs',
    description: 'Turn on ready-to-use tool connections for your agents.',
  },
];

export const TOTAL_ONBOARDING_STEPS = ONBOARDING_STEPPER_STEPS.length;
