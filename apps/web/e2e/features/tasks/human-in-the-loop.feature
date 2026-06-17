@tasks @web @smoke
Feature: Human-in-the-loop task questioning

  Background:
    Given I am logged in
    And a system agent preference is configured

  Scenario: Waiting task shows question form and status
    Given a task is waiting with pending questions:
      | question              | inputType |
      | Which region applies? | text      |
    And the task detail page is open
    Then the status badge displays "Waiting for input"
    And I see the task question form
    And the pause button is not visible
    And the resume button is not visible

  Scenario: Submitting the last answer moves task back to in-progress
    Given a task is waiting with pending questions:
      | question              | inputType |
      | Preferred file format | text      |
    And the task detail page is open
    When I fill in the task question answer "CSV"
    And I click the task question submit button
    Then the submit answer API request is sent successfully
    And the task status becomes "In progress"
    And the task question form is not visible
    And I see the answered question "Preferred file format" in the history

  Scenario: Multiple pending questions can be answered in any order
    Given a task is waiting with pending questions:
      | question    | inputType |
      | First item  | text      |
      | Second item | text      |
      | Third item  | text      |
    And the task detail page is open
    When I answer the task question "Second item" with "answer-two"
    And I answer the task question "First item" with "answer-one"
    And I answer the task question "Third item" with "answer-three"
    Then the task status becomes "In progress"
    And the task question form is not visible
    And I see 3 answered questions in the history

  Scenario: Task question navigation between pending questions
    Given a task is waiting with pending questions:
      | question   | inputType |
      | Question A | text      |
      | Question B | text      |
    And the task detail page is open
    Then the task question progress shows "Question 1 of 2"
    When I click the task question next button
    Then the task question progress shows "Question 2 of 2"
    And I see the task question text "Question B"
    When I click the task question previous button
    Then the task question progress shows "Question 1 of 2"

  Scenario: Boolean question can be answered
    Given a task is waiting with pending questions:
      | question             | inputType |
      | Include attachments? | boolean   |
    And the task detail page is open
    When I select the boolean task question answer "Yes"
    And I click the task question submit button
    Then the submit answer API request is sent successfully
    And the task status becomes "In progress"

  Scenario: Task detail polling continues while waiting
    Given a task is waiting with pending questions:
      | question       | inputType |
      | Need more info | text      |
    And the task detail page is open
    Then task detail polling continues while waiting

  Scenario: Task questions polling is active while waiting
    Given a task is waiting with pending questions:
      | question       | inputType |
      | Need more info | text      |
    And the task detail page is open
    Then task questions polling is active

  Scenario: Waiting notification appears when task enters waiting state
    Given a task exists with status "in-progress"
    And the task detail page is open
    When the task enters waiting state with pending questions:
      | question            | inputType |
      | Confirm deployment? | text      |
    Then I see the waiting for input notification
    And the status badge displays "Waiting for input"
