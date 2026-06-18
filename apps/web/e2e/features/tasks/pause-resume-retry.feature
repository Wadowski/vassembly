@tasks @web @smoke
Feature: Pause, Resume and Retry Task

  Background:
    Given I am logged in
    And a system agent preference is configured

  Scenario: Pause an in-progress task
    Given a task exists with status "in-progress"
    And the task detail page is open
    When I click the pause button in the task detail header
    Then the pause API request PATCH "/tasks/{taskId}/pause" is sent
    And the task status becomes "paused"
    And the pause button is not visible
    And the resume button is visible next to the status badge
    And the status badge displays "Paused"
    And LLM execution for that task stops
    And no new progress events are recorded until resume
    And task detail polling stops

  Scenario: Resume a paused task and task completes
    Given a task exists with status "paused"
    And the task has at least one progress event with state "completed"
    And the task detail page is open
    When I click the resume button in the task detail header
    Then the resume API request PATCH "/tasks/{taskId}/resume" is sent
    And the task status becomes "in-progress"
    And the resume button is not visible
    And the pause button is visible
    And task detail polling resumes every 3 seconds
    And when execution finishes the task status becomes "done"
    And I see the output in the AI Response section

  Scenario: Retry a paused task restarts from scratch
    Given a task exists with status "paused"
    And the task has progress events with state "completed"
    And the task detail page is open
    When I click the retry button in the task detail header
    Then the retry API request PATCH "/tasks/{taskId}/retry" is sent
    And the task status becomes "in-progress"
    And the retry button is not visible
    And the pause button is visible
    And task detail polling resumes every 3 seconds
    And when execution finishes the task status becomes "done"

  Scenario: Retry a failed task restarts from scratch
    Given a task exists with status "failed"
    And the task detail page is open
    When I click the retry button in the task detail header
    Then the retry API request PATCH "/tasks/{taskId}/retry" is sent
    And the task status becomes "in-progress"
    And the retry button is not visible
    And the pause button is visible
    And task detail polling resumes every 3 seconds
    And when execution finishes the task status becomes "done"

  Scenario: Pause button shown only for in-progress tasks
    Given a task exists with status "in-progress"
    And the task detail page is open
    Then the pause button is visible
    And the resume button is not visible
    And the retry button is not visible
    Given a task exists with status "done"
    And the task detail page is open
    Then the pause button is not visible
    And the resume button is not visible
    And the retry button is not visible
    And the status badge displays "Done"
    Given a task exists with status "failed"
    And the task detail page is open
    Then the pause button is not visible
    And the resume button is not visible
    Given a task exists with status "paused"
    And the task detail page is open
    Then the pause button is not visible

  Scenario: Resume and retry buttons both shown for paused task
    Given a task exists with status "paused"
    And the task detail page is open
    Then the pause button is not visible
    And the resume button is visible next to the status badge
    And the retry button is visible next to the status badge
    And the status badge displays "Paused"

  Scenario: Retry button shown for failed task
    Given a task exists with status "failed"
    And the task detail page is open
    Then the pause button is not visible
    And the resume button is not visible
    And the retry button is visible next to the status badge
    And the status badge displays "Failed"

  Scenario: Task completes before pause is processed (race)
    Given a task exists with status "in-progress"
    And the task detail page shows the pause button
    When the task execution completes and status becomes "done"
    And I click the pause button in the task detail header
    Then PATCH "/tasks/{taskId}/pause" returns 409
    And the UI shows an error snackbar indicating the task can no longer be paused
    And the task status remains "done"
    And the pause button is not visible after refresh

  Scenario: Resume after credential change fails gracefully
    Given a task exists with status "paused"
    And my preferred AI credential has been removed from Settings
    And the task detail page is open
    When I click the resume button in the task detail header
    Then the task status becomes "failed"
    And I see "Missing AI credential configuration"
    And the resume button is not visible
    And the user can navigate to Settings to configure a credential

  Scenario: Double-click pause prevents duplicate requests
    Given a task exists with status "in-progress"
    And the task detail page is open
    When I double-click the pause button rapidly
    Then only one pause API request is processed meaningfully
    And the pause button is disabled after the first click
    And the task ends in status "paused"

  Scenario: Pause while nested agent call is running
    Given a task is in-progress with a nested agent invocation in flight
    And the task detail page is open
    When I click the pause button in the task detail header
    Then the task status becomes "paused"
    And progress events show completed steps up to the last finished step

  Scenario: Multi-tab does not sync pause in real time
    Given a task exists with status "in-progress"
    And I have the same task detail page open in two browser tabs
    When I pause the task in Tab A
    Then Tab A shows status "paused" and the resume button
    And Tab B shows "paused" after task detail polling updates

  Scenario: Paused task stays paused indefinitely with no auto-expiry
    Given a task exists with status "paused"
    And the task detail page is open
    When I wait 10 seconds
    Then the task status remains "paused"
    And the status badge displays "Paused"
    And the resume button is visible next to the status badge
