@multi-specialization-tasks @web
Feature: Activity feed visibility for classifier invocations (AF)

  Background:
    Given I am logged in
    And a system agent preference is configured

  @AF-1
  Scenario: Classifier entry visible with full detail
    Given I submit "Create a summary in my Notion about the 20 most popular meals"
    And my comment triggers Specialization Classifier invocation
    When classification completes and I view the task detail activity feed
    Then a classifier entry appears with the agent name "Specialization classifier"
    And the entry shows the input message, the raw output, duration, and token usage (when available)
    And the entry shows the parsed outcome: matched existing specialization names and/or newly created specialization names

  @AF-2
  Scenario: Platform-credential classifier call still recorded
    Given I submit "Draft a non-disclosure agreement for a new vendor"
    And the Specialization Classifier is invoked using a platform-scoped credential
    When the invocation completes
    Then a progress event for this invocation is recorded for the comment
    And the activity feed renders the classifier entry exactly as it would for a user-credentialed invocation

  @AF-3
  Scenario: Skipped classification shown with reason
    Given my comment's description is too short to classify
    When the Specialization Classifier tool handler returns a "skipped" result
    And I view the classifier entry in the activity feed
    Then the activity feed shows a classifier entry with status "Skipped"
    And the entry shows the skip reason for example "short_description"

  @AF-4
  Scenario: New specialization name shown on the classifier entry
    Given my comment causes a new "airtable" specialization to be created
    When I view the classifier entry in the activity feed
    Then the entry indicates a new specialization "airtable" was created as an outcome of this classification

  @AF-5
  Scenario: Classifier entry precedes downstream subagent entries
    Given my comment triggers classification followed by researcher, Task Planner, worker, and validator invocations
    When I view the activity feed for that comment turn
    Then the classifier entry's timestamp is earlier than the researcher entries' timestamps
    And the classifier entry renders above the researcher/Task Planner/worker/validator entries in the feed
