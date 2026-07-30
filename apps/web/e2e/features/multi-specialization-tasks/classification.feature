@multi-specialization-tasks @web @smoke
Feature: Multi-specialization classification (MSC)

  Background:
    Given I am logged in
    And a system agent preference is configured

  @MSC-1
  Scenario: Meals + Notion request receives both specializations
    Given a "food & nutrition" specialization already exists
    And a "notion" specialization already exists
    And I submit "Create a summary in my Notion about the 20 most popular meals"
    When the Specialization Classifier processes my comment
    And I navigate to the task detail page
    Then the comment's specializationIds includes the "food & nutrition" specialization ID
    And the comment's specializationIds includes the "notion" specialization ID
    And no third, unrelated specialization is added
    And specialization tags "food & nutrition" and "notion" are shown on that comment in the activity feed

  @MSC-2
  Scenario: One existing match plus one new specialization
    Given a "legal" specialization already exists for mixed classification
    And no specialization exists for "airtable"
    And I submit a comment requiring both legal review and an Airtable update
    When the Specialization Classifier returns output containing a "legal" line and a "NEW:airtable|Track vendor contract status in Airtable" line
    Then the comment's specializationIds includes the "legal" specialization ID
    And a new "airtable" specialization is created
    And the comment's specializationIds includes the "airtable" specialization ID
    And neither branch is discarded in favor of the other

  @MSC-3
  Scenario: Slack mention creates a tool specialization
    Given no specialization exists for "slack"
    And I submit "Post today's release notes to our team Slack channel"
    When the Specialization Classifier processes my comment
    Then a new "slack" specialization is created
    And the comment's specializationIds includes the "slack" specialization ID

  @MSC-3
  Scenario: Tool specialization name aligns with MCP catalog hint
    Given the MCP catalog includes an MCP named "notion" with a short description
    And no specialization exists for "notion"
    When the Specialization Classifier processes a comment mentioning "my Notion workspace"
    Then the classifier's context includes the MCP catalog hint for "notion"
    And the newly created specialization is named "notion", matching the MCP catalog name

  @MSC-4
  Scenario: Classifier output at the cap
    Given a comment genuinely spans 5 distinct domains
    When the Specialization Classifier returns 5 valid specialization lines/NEW entries
    Then all 5 specializations are accepted and applied to the comment

  @MSC-4
  Scenario: Classifier output exceeding the cap
    Given a comment's raw classifier output contains more than 5 valid specialization lines/NEW entries
    When normalizeGeneratedSpecializations processes the output for my comment
    Then only the 5 most central specializations are retained
    And the excess entries are not applied to the comment

  @MSC-5
  Scenario: Two genuinely distinct domains both assigned
    Given a comment requires both "engineering" work and "finance" work with no shared platform dependency
    When the Specialization Classifier processes the comment
    Then both "engineering" and "finance" specialization IDs are returned
    And the classifier is not instructed anywhere in its rule to minimize the specialization count

  @MSC-6
  Scenario: Single-domain request gets one specialization
    Given I submit "Draft a non-disclosure agreement for a new vendor"
    And a "legal" specialization already exists
    When the Specialization Classifier processes my comment
    Then exactly 1 specialization ID for "legal" is returned
