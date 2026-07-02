@skill-script-execution
Feature: Skill script execution

  Scenario: run_skill_script tool is registered for system agents
    Given system agent "E2E skill-resolve caller" is seeded with skill-run-script assigned
    When internal tool handlers are created for a task context
    Then skill-run-script handler should be registered
