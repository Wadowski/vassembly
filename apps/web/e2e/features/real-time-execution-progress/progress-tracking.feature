@real-time-execution-progress @web @smoke
Feature: Real-Time Agent Execution Progress Tracking
  As a user
  I want to see my agent execution progress in real-time
  So that I can monitor task completion and debug issues

  Background:
    Given I am logged in
    And I have a task in-progress with execution progress tracking

  Scenario: Task starts, events appear in list in real-time
    When I navigate to the task detail page
    Then the ProgressList is visible and empty or loading
    When the task execution begins and first agent starts
    Then I see a "started" event for the agent in the ProgressList without page refresh
    And the events are ordered by timestamp with oldest first

  Scenario: Click event, modal opens with correct data
    When I navigate to the task detail page
    And the task has multiple progress events
    And I click on the first progress event
    Then the ProgressDetailModal opens with glassmorphic styling
    And I see the agent name in the modal header
    And I see the status badge showing the event state
    And I see the duration displayed in the modal
    And I see token usage displayed with input, output, and total counts
    And I see the request JSON formatted in the modal
    And I see the response JSON formatted in the modal

  @slow @skip-diagnostic-checks
  Scenario: Relative timestamps update every 60 seconds
    Given the test skips diagnostic checks
    When I navigate to the task detail page
    And the ProgressDetailModal is open showing "started 2 minutes ago"
    And I wait 60 seconds
    Then the relative time text updates to show "started 3 minutes ago" without manual refresh
    And the modal remains open

  Scenario: Polling stops when task completes
    When I navigate to the task detail page
    And I verify polling is active with requests every 1 second
    And the backend marks the task as completed
    Then polling stops after the task completion status is received
    And no new polling requests occur
    And the ProgressTracker hides or shows completion message

  Scenario: Page refresh shows same events persisted from database
    When I navigate to the task detail page
    And the task has 5 recorded progress events
    And I refresh the page
    Then all 5 progress events are displayed in the ProgressList
    And no events are lost or duplicated
    And the data matches the database

  Scenario: Error state - polling fails, retry button shows, polling resumes on recovery
    When I navigate to the task detail page
    And polling is active
    And the GraphQL query fails with a 500 error
    Then an error banner or toast appears
    And a retry button is visible in the error UI
    And polling continues in the background with exponential backoff
    When the API recovers and responds successfully
    Then the error banner dismisses automatically
    And polling resumes normal updates
    And new events appear in the ProgressList

  Scenario: Modal closes on Escape key and focus returns to list
    When I navigate to the task detail page
    And I click on a progress event to open the modal
    Then the ProgressDetailModal is open
    When I press the Escape key
    Then the modal closes with a smooth animation
    And the ProgressItem that was clicked regains focus
    And tab focus is no longer trapped inside the modal
