import { describe, expect, it } from 'vitest';

import { CURRENT_DATE_TIME_SECTION_HEADING, SYSTEM_AGENT_NAME } from '@vassembly/constants';

import {
  ASSISTANT_ORCHESTRATION_SECTION_HEADING,
  formatAssistantOrchestrationSection,
} from './formatAssistantOrchestrationSection';
import { formatIntentCategoriesSection } from './formatIntentCategoriesSection';
import { formatIntentRoutingSection } from './formatIntentRoutingSection';
import {
  formatTaskWorkerOrchestrationSection,
  MAX_TASK_WORKER_VALIDATOR_RETRIES,
  TASK_WORKER_ORCHESTRATION_SECTION_HEADING,
} from './formatTaskWorkerOrchestrationSection';
import {
  formatSkillPlannerScriptSection,
  SKILL_PLANNER_SCRIPT_SECTION_HEADING,
} from './formatSkillPlannerScriptSection';
import {
  formatSpecializationResearcherSkillsSection,
  isSpecializationResearcherAgentName,
  SPECIALIZATION_RESEARCHER_SKILLS_SECTION_HEADING,
} from './formatSpecializationResearcherSkillsSection';
import {
  formatSpecializationWorkerExecutionSection,
  isSpecializationWorkerAgentName,
  SPECIALIZATION_WORKER_EXECUTION_SECTION_HEADING,
} from './formatSpecializationWorkerExecutionSection';
import {
  formatSubagentOutputPolicySection,
  SUBAGENT_OUTPUT_POLICY_SECTION_HEADING,
} from './formatSubagentOutputPolicySection';
import { buildSystemAgentSystemMessage } from './index';

const FIXED_NOW = new Date('2026-06-28T09:31:00.000Z');

describe('formatIntentCategoriesSection', () => {
  it('should include all category slugs and descriptions', () => {
    const section = formatIntentCategoriesSection();

    expect(section).toContain('Valid slugs: task');
    expect(section).toContain('### task');
    expect(section).toContain('Examples:');
  });
});

describe('formatIntentRoutingSection', () => {
  it('should map each slug to a worker agent name', () => {
    const section = formatIntentRoutingSection();

    expect(section).toContain('- task → "Task worker"');
  });
});

describe('formatSubagentOutputPolicySection', () => {
  it('should require structured subagent output without user-facing filler', () => {
    const section = formatSubagentOutputPolicySection();

    expect(section).toContain(SUBAGENT_OUTPUT_POLICY_SECTION_HEADING);
    expect(section).toContain('consumed by another agent');
    expect(section).toContain('No conversational filler');
  });
});

describe('formatTaskWorkerOrchestrationSection', () => {
  it('should require Task planner, mandatory validators, and retry loop', () => {
    const section = formatTaskWorkerOrchestrationSection();

    expect(section).toContain(TASK_WORKER_ORCHESTRATION_SECTION_HEADING);
    expect(section).toContain('Task planner');
    expect(section).toContain('Validators are mandatory');
    expect(section).toContain(`Retry at most ${MAX_TASK_WORKER_VALIDATOR_RETRIES} times`);
    expect(section).toContain('Forbidden before step 2 completes');
    expect(section).toContain('never asks the user questions');
    expect(section).toContain('invoke_skill_planner when New skill needed is set');
  });
});

describe('formatSpecializationResearcherSkillsSection', () => {
  it('should forbid inventing skill names not in the catalog', () => {
    const section = formatSpecializationResearcherSkillsSection();

    expect(section).toContain(SPECIALIZATION_RESEARCHER_SKILLS_SECTION_HEADING);
    expect(section).toContain('Never invent');
    expect(section).toContain('## Available Skills');
  });
});

describe('isSpecializationResearcherAgentName', () => {
  it('should identify provisioned specialization researchers', () => {
    expect(isSpecializationResearcherAgentName({ name: 'Legal researcher' })).toBe(true);
  });
});

describe('formatSpecializationWorkerExecutionSection', () => {
  it('should require action results instead of work descriptions', () => {
    const section = formatSpecializationWorkerExecutionSection();

    expect(section).toContain(SPECIALIZATION_WORKER_EXECUTION_SECTION_HEADING);
    expect(section).toContain('DO IT using skills');
    expect(section).toContain('invoke_skill_planner');
  });
});

describe('isSpecializationWorkerAgentName', () => {
  it('should identify provisioned specialization workers', () => {
    expect(isSpecializationWorkerAgentName({ name: 'Legal worker' })).toBe(true);
  });

  it('should exclude system task worker agents', () => {
    expect(isSpecializationWorkerAgentName({ name: 'Task worker' })).toBe(false);
  });
});

describe('formatSkillPlannerScriptSection', () => {
  it('should forbid inline commands and require script creators', () => {
    const section = formatSkillPlannerScriptSection();

    expect(section).toContain(SKILL_PLANNER_SCRIPT_SECTION_HEADING);
    expect(section).toContain('Never embed executable code or shell commands');
    expect(section).toContain('Skill script creator (python)');
    expect(section).toContain('Skill script creator (bash)');
    expect(section).toContain('run_skill_script scripts/<filename>');
  });
});

describe('formatAssistantOrchestrationSection', () => {
  it('should require Task worker before final response', () => {
    const section = formatAssistantOrchestrationSection();

    expect(section).toContain(ASSISTANT_ORCHESTRATION_SECTION_HEADING);
    expect(section).toContain('Intent classifier');
    expect(section).toContain('Task worker');
    expect(section).toContain('Stopping after intent classification is forbidden');
  });
});

describe('buildSystemAgentSystemMessage', () => {
  const baseRule = 'Base orchestration rule.';

  it('should append categories and output policy for intent classifier', () => {
    const result = buildSystemAgentSystemMessage({
      name: SYSTEM_AGENT_NAME.IntentClassifier,
      rule: baseRule,
      now: FIXED_NOW,
    });

    expect(result.startsWith(baseRule)).toBe(true);
    expect(result).toContain(SUBAGENT_OUTPUT_POLICY_SECTION_HEADING);
    expect(result).toContain('## Categories');
    expect(result).toContain('### task');
    expect(result).toContain(CURRENT_DATE_TIME_SECTION_HEADING);
  });

  it('should append routing and mandatory orchestration for assistant', () => {
    const result = buildSystemAgentSystemMessage({
      name: SYSTEM_AGENT_NAME.Assistant,
      rule: baseRule,
      now: FIXED_NOW,
    });

    expect(result).not.toContain(SUBAGENT_OUTPUT_POLICY_SECTION_HEADING);
    expect(result).toContain('## Routing');
    expect(result).toContain(ASSISTANT_ORCHESTRATION_SECTION_HEADING);
    expect(result).toContain('Never skip this step');
  });

  it('should append planning policy and output policy for task planner', () => {
    const plannerRule = 'Plan agent work.';

    const result = buildSystemAgentSystemMessage({
      name: SYSTEM_AGENT_NAME.TaskPlanner,
      rule: plannerRule,
      now: FIXED_NOW,
    });

    expect(result.startsWith(plannerRule)).toBe(true);
    expect(result).toContain(SUBAGENT_OUTPUT_POLICY_SECTION_HEADING);
    expect(result).toContain('## Planning policy');
    expect(result).toContain('Never call ask_user');
    expect(result).toContain(CURRENT_DATE_TIME_SECTION_HEADING);
  });

  it('should append orchestration chain, output policy, and datetime for task worker', () => {
    const workerRule = 'Plan the work.';

    const result = buildSystemAgentSystemMessage({
      name: SYSTEM_AGENT_NAME.TaskWorker,
      rule: workerRule,
      now: FIXED_NOW,
    });

    expect(result.startsWith(workerRule)).toBe(true);
    expect(result).toContain(SUBAGENT_OUTPUT_POLICY_SECTION_HEADING);
    expect(result).toContain(TASK_WORKER_ORCHESTRATION_SECTION_HEADING);
    expect(result).toContain('Task planner');
    expect(result).toContain(CURRENT_DATE_TIME_SECTION_HEADING);
    expect(result).toContain('Sunday, June 28, 2026 · 09:31 UTC');
  });

  it('should append script policy section and datetime for skill planner', () => {
    const plannerRule = 'Create skills for planning gaps.';

    const result = buildSystemAgentSystemMessage({
      name: SYSTEM_AGENT_NAME.SkillPlanner,
      rule: plannerRule,
      now: FIXED_NOW,
    });

    expect(result.startsWith(plannerRule)).toBe(true);
    expect(result).toContain(SKILL_PLANNER_SCRIPT_SECTION_HEADING);
    expect(result).toContain('run_skill_script scripts/<filename>');
    expect(result).toContain(CURRENT_DATE_TIME_SECTION_HEADING);
  });

  it('should append skill catalog policy and output policy for specialization researchers', () => {
    const result = buildSystemAgentSystemMessage({
      name: 'Legal researcher',
      rule: 'Research domain topics.',
      skillsCatalogSection: '## Available Skills\n\n- **ping-host**: Ping a host',
      now: FIXED_NOW,
    });

    expect(result).toContain(SPECIALIZATION_RESEARCHER_SKILLS_SECTION_HEADING);
    expect(result).toContain('## Available Skills');
    expect(result).toContain('ping-host');
  });

  it('should append execution policy and output policy for specialization workers', () => {
    const workerRule = 'Execute domain work.';

    const result = buildSystemAgentSystemMessage({
      name: 'Legal worker',
      rule: workerRule,
      now: FIXED_NOW,
    });

    expect(result.startsWith(workerRule)).toBe(true);
    expect(result).toContain(SUBAGENT_OUTPUT_POLICY_SECTION_HEADING);
    expect(result).toContain(SPECIALIZATION_WORKER_EXECUTION_SECTION_HEADING);
    expect(result).toContain('DO IT using skills');
    expect(result).toContain(CURRENT_DATE_TIME_SECTION_HEADING);
  });

  it('should append skills catalog section when provided', () => {
    const catalogSection = '## Available Skills\n\n- **contract-review**: Review contracts';

    const result = buildSystemAgentSystemMessage({
      name: SYSTEM_AGENT_NAME.TaskWorker,
      rule: baseRule,
      skillsCatalogSection: catalogSection,
      now: FIXED_NOW,
    });

    expect(result).toContain(catalogSection);
    expect(result).toContain(CURRENT_DATE_TIME_SECTION_HEADING);
    expect(result.indexOf(catalogSection)).toBeLessThan(
      result.indexOf(CURRENT_DATE_TIME_SECTION_HEADING),
    );
  });

  it('should append skills catalog after intent classifier sections', () => {
    const catalogSection = '## Available Skills\n\n- **legal-research**: Research law';

    const result = buildSystemAgentSystemMessage({
      name: SYSTEM_AGENT_NAME.IntentClassifier,
      rule: baseRule,
      skillsCatalogSection: catalogSection,
      now: FIXED_NOW,
    });

    expect(result).toContain('## Categories');
    expect(result).toContain(catalogSection);
    expect(result).toContain(CURRENT_DATE_TIME_SECTION_HEADING);
    expect(result.indexOf(catalogSection)).toBeLessThan(
      result.indexOf(CURRENT_DATE_TIME_SECTION_HEADING),
    );
  });
});
