@agents @mcps @web @smoke
Feature: Agent MCP Assignment (Web UI)

  Background:
    Given I am logged in
    And the MCP catalog is seeded

  Scenario: Empty MCP picker when no MCPs are configured
    When I open the agent create form
    Then I see the MCP assignment empty state

  Scenario: Assign configured MCP when creating an agent
    Given I have configured the MCP with slug "brave-search-mcp"
    And a connected AI integration exists for the current user
    When I open the agent create form
    And I add MCP "Brave Search MCP" to the agent form
    And I fill in "Name" with "MCP Research Agent"
    And I select "coding" for "Category"
    And I fill in "Description" with "Uses Brave Search tools"
    And I fill in "Rule" with "Search the web when needed"
    And I select the AI integration "E2E Web AI Credential"
    And I click "Create agent"
    Then I see the agent snackbar "Agent created successfully"
    And I am on "/agents"
    And I see agent "MCP Research Agent" in the list

  Scenario: Show assigned MCP on agent edit form
    Given I have configured the MCP with slug "brave-search-mcp"
    And an agent exists for the current user with name "Assigned MCP Agent" assigned to MCP slug "brave-search-mcp"
    When I open the agent edit page
    Then I see MCP "Brave Search MCP" assigned on the agent form
    And I see "1/5 MCPs assigned" on the MCP assignment picker

  Scenario: Remove MCP from agent edit form
    Given I have configured the MCP with slug "brave-search-mcp"
    And a connected AI integration exists for the current user
    And an agent exists for the current user with name "Remove MCP Agent" assigned to MCP slug "brave-search-mcp"
    When I open the agent edit page
    And I remove MCP "Brave Search MCP" from the agent form
    And I select the AI integration "E2E Web AI Credential"
    And I click "Update agent"
    Then I see the agent snackbar "Agent updated successfully"
    When I open the agent edit page
    Then I do not see MCP "Brave Search MCP" assigned on the agent form
