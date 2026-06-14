@agents @web @smoke
Feature: Agent Internal Tools Assignment (Web UI)

  Background:
    Given I am logged in

  Scenario: Internal tools picker shows catalog on create form
    When I open the agent create form
    Then I see the internal tools picker on the agent form
    And I see the internal tools catalog loaded on the agent form

  Scenario: Internal tools picker is separate from MCP picker
    When I open the agent create form
    Then I see distinct MCP and internal tools sections on the agent form

  Scenario: Assign internal tools when creating an agent
    Given a connected AI integration exists for the current user
    When I open the agent create form
    And I add internal tool "Use agent" to the agent form
    And I add internal tool "List agents" to the agent form
    And I fill in "Name" with "Internal Tools Agent"
    And I select "coding" for "Category"
    And I fill in "Description" with "Uses platform internal tools"
    And I fill in "Rule" with "Delegate to other agents when needed"
    And I select the AI integration "E2E Web AI Credential"
    And I click "Create agent"
    Then I see the agent snackbar "Agent created successfully"
    And I am on "/agents"
    And I see agent "Internal Tools Agent" in the list

  Scenario: Show assigned internal tools on agent edit form
    Given an agent exists for the current user with name "Assigned Tools Agent" assigned to internal tool id "use-agent"
    When I open the agent edit page
    Then I see internal tool "Use agent" assigned on the agent form

  Scenario: Remove internal tool from agent edit form
    Given a connected AI integration exists for the current user
    And an agent exists for the current user with name "Remove Tools Agent" assigned to internal tool ids "use-agent" and "list-agents"
    When I open the agent edit page
    And I remove internal tool "List agents" from the agent form
    And I select the AI integration "E2E Web AI Credential"
    And I click "Update agent"
    Then I see the agent snackbar "Agent updated successfully"
    When I open the agent edit page
    Then I see internal tool "Use agent" assigned on the agent form
    And I do not see internal tool "List agents" assigned on the agent form
