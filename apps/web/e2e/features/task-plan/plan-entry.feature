@task-plan @web @smoke
Feature: Plan as distinct task process list entry (UI-1)

  Background:
    Given I am logged in
    And a system agent preference is configured

  Scenario: Plan entry visible on task detail
    Given the plan short name is "contract-risk-review"
    And a task comment has an associated task plan instance with items:
      | order | agentName        | skillName         | description           | status  |
      | 1     | Legal researcher | contract-review   | Extract key clauses   | done    |
      | 2     | Legal validator  | clause-extraction | Validate findings     | pending |
    When I navigate to the task detail page
    Then a distinct plan entry appears in the task activity feed separate from the agent response
    When I expand the plan entry for that comment
    Then I see plan step groups with per-item status for the ordered plan items
