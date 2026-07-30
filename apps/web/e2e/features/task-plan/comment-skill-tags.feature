@task-plan @web
Feature: Skill tags per comment (UI-2)

  Background:
    Given I am logged in
    And a system agent preference is configured

  Scenario: Skill tags shown at comment level
    Given a task comment uses skills "contract-review" and "clause-extraction"
    When I navigate to the task detail page
    Then skill tags "contract-review" and "clause-extraction" are shown on that comment in the activity feed
