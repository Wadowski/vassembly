@tasks @web @smoke
Feature: Progress polling restart after resume and retry

  Background:
    Given I am logged in
    And a system agent preference is configured

  Scenario: Progress polling continues after pause and resume
    Given a task is running and generating progress events
    And the task detail page is open
    And task progress polling is active
    When I click the pause button in the task detail header
    Then the task status becomes "paused"
    And progress events stop appearing
    When I click the resume button in the task detail header
    Then the task status becomes "in-progress"
    And progress events resume appearing

  Scenario: Progress polling restarts after task fails and user retries
    Given a task is running and generating progress events
    And the task detail page is open
    And task progress polling is active
    When the task fails after progress is completed
    Then the task status becomes "failed"
    And progress events stop appearing
    And the retry button is visible next to the status badge
    When I click the retry button in the task detail header
    Then the task status becomes "in-progress"
    And progress events resume appearing
    And new progress events show different execution attempt

  Scenario: Progress polling resumes and shows new events on retry with incremented attempt
    Given a failed task with completed progress from the first execution attempt
    And the task detail page is open
    And the progress execution attempt number is 1
    When I click the retry button in the task detail header
    And the task status becomes "in-progress"
    And task progress polling restarts after retry
    Then progress events show new execution with attempt number incremented
