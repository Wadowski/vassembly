import { describe, expect, it } from 'vitest';

import { formatTaskPlannerPlanningSection } from './formatTaskPlannerPlanningSection';

describe('formatTaskPlannerPlanningSection', () => {
  it('should allow worker researcher and validator roles in plan items', () => {
    const section = formatTaskPlannerPlanningSection();

    expect(section).toContain('worker, researcher, or validator');
    expect(section).toContain('**Worker** — default for execution steps');
    expect(section).toContain("**Validator** — to verify the user's original request");
    expect(section).toContain('**Researcher** — when subject-matter data must be gathered');
    expect(section).toContain('Never assign a methodologist');
  });

  it('should preserve core planning rules', () => {
    const section = formatTaskPlannerPlanningSection();

    expect(section).toContain('Never call ask_user or ask anyone to do work');
    expect(section).toContain('Exactly one agent per plan item');
    expect(section).toContain('methodologist summaries');
    expect(section).toContain('prompt-only skills');
    expect(section).toContain(
      'Your final action in this turn MUST be a single persist_task_plan tool call',
    );
  });
});
