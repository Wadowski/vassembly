@task-plan @web
Feature: Aggregated skills per task (UI-3)

  Background:
    Given I am logged in
    And a system agent preference is configured

  Scenario: Aggregated skill tags on task detail
    Given a task has comments using skills:
      | comment | skills |
      | 1       | a      |
      | 2       | a, b   |
      | 3       | c      |
    When I navigate to the task detail page
    Then the task detail aggregated skills section shows deduplicated skill tags "a", "b", and "c"
    And the aggregated skills display matches the specializations aggregation pattern
