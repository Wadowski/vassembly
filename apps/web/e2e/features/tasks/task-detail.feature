@tasks @web
Feature: Task Detail Page

  Background:
    Given I am logged in
    And a system agent preference is configured

  Scenario: Navigate from list to detail page
    Given I navigate to "/"
    And a task "Process invoice data" exists
    When I click on the task "Process invoice data"
    Then I am on the task detail page for that task

  Scenario: Back link returns to task list
    Given I navigate to a task detail page
    When I click the back link
    Then I am on "/"

  Scenario: Deep link to task/:id opens detail page
    Given a task with ID "task-123" exists
    When I navigate directly to "/tasks/task-123"
    Then I see the task detail page for task-123

  Scenario: Task title displayed when populated by LLM
    Given a task is completed with title "Customer Sentiment Analysis Complete"
    When I navigate to its detail page
    Then I see the title "Customer Sentiment Analysis Complete"

  Scenario: Task title shows placeholder when null
    Given a task is in-progress with no title yet
    When I navigate to its detail page
    Then I see a title placeholder like "Task details"

  Scenario: Unassigned agent shows empty progress state
    Given a task without an assigned agent exists
    When I navigate to its detail page
    Then I see "No progress data available" in the execution progress tracker

  Scenario: Empty description displays placeholder message
    Given a task with an empty description exists
    When I navigate to its detail page
    Then I see "No description"

  Scenario: Task in-progress status with polling
    Given I navigate to an in-progress task detail page
    Then the task detail polls for updates every 3 seconds
    And I can verify polling activity in the network tab

  Scenario: Task completed displays title and output
    Given a completed task with output "Summary: All invoices processed successfully"
    When I navigate to its detail page
    Then I see the title populated
    And I see the output "Summary: All invoices processed successfully"

  Scenario: Task failed displays error message
    Given a failed task with error message "Missing AI credential configuration"
    When I navigate to its detail page
    Then I see the error state
    And I see "Missing AI credential configuration"

  Scenario: Cross-user access denied with 404
    Given another user "other@example.com" has a task
    When I navigate to that task's detail page
    Then I see a 404 or access denied page

  Scenario: Unauthenticated user redirected to login
    When I log out
    And I navigate to "/tasks/task-123"
    Then I am redirected to "/login"

  Scenario: Network error during initial load shows skeleton then error
    Given a task exists for the detail page
    And the GraphQL fetch fails on first attempt
    When I navigate to its detail page
    Then I see a loading skeleton
    And then I see an error message
    And I can click "Back to tasks"

  Scenario: Polling stops on page unmount
    Given I navigate to an in-progress task detail page
    And polling is active
    When I navigate away from the detail page
    Then the polling subscription is cleaned up
