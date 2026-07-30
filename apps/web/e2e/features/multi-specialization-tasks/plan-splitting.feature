@multi-specialization-tasks @web
Feature: Multi-specialization plan splitting (MSP)

  Background:
    Given I am logged in
    And a system agent preference is configured

  @MSP-1
  Scenario: Research step ordered before delivery step
    Given a comment has specializationIds "food & nutrition" and "notion"
    And the "food & nutrition" worker step produces the list of 20 popular meals
    And the "notion" worker step creates a Notion page from that list
    When the Task Planner composes the plan
    And I navigate to the task detail page
    And I expand the plan entry for that comment
    Then the "Food & nutrition worker" item has order 1
    And the "Notion worker" item has order 2
    And the "Notion worker" item's description references consuming the food & nutrition worker's output

  @MSP-2
  Scenario: Two independent specializations share the same order
    Given a comment has specializationIds "engineering" and "finance"
    And neither specialization's output is required as input to the other
    When the Task Planner composes the plan
    And I navigate to the task detail page
    And I expand the plan entry for that comment
    Then both the "Engineering worker" and "Finance worker" items have the same order value

  @MSP-3
  Scenario: Slack-only action has no forced ordering delay
    Given a comment has specializationIds ["slack"] only
    When the Task Planner composes the plan
    And I navigate to the task detail page
    And I expand the plan entry for that comment
    Then the "Slack worker" item has order 1
