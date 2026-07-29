@task-plan @web
Feature: Regular user tags only vs admin links (UI-4)

  Background:
    Given I am logged in
    And a system agent preference is configured
    And a task comment uses skill "contract-review"

  Scenario: Regular user sees non-interactive tags
    When I navigate to the task detail page
    Then skill tags on the comment and aggregated task view are plain non-clickable labels

  Scenario: Admin sees clickable skill links
    Given the current user has the admin role
    When I navigate to the task detail page
    Then each skill tag on the comment and aggregated task view links to that skill's detail page
