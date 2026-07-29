@task-plan @web @smoke
Feature: agentResponse and plan are separate artifacts (UI-5)

  Background:
    Given I am logged in
    And a system agent preference is configured

  Scenario: agentResponse is post-work result, plan is a linked entry
    Given a comment execution produced a plan instance and completed with agent response:
      | planShortName         | agentResponseOutcome                                      | planItemDescription              |
      | contract-risk-review  | The NDA contains three high-risk clauses in section 4.2. | Step 1: Extract key clauses      |
    When I navigate to the task detail page
    Then the plan entry renders as a separate task activity feed item linked to the plan instance
    And the agent response renders as the existing markdown feed item with the post-work user-facing result
    And the agent response does not contain the structured plan text
    And the plan entry and agent response both remain visible
