@mcps @agents @web @smoke @mode:serial
Feature: MCP Agents Section (Web UI)

  Background:
    Given I am logged in
    And the MCP catalog is seeded

  Scenario: Agents section hidden when MCP is not configured
    When I navigate to "/mcps"
    And I click on the MCP "Brave Search MCP"
    Then I see the MCP detail page
    And I do not see the MCP agents section on the detail page

  Scenario: Agents section lists assigned agents
    Given I have configured the MCP with slug "brave-search-mcp"
    And an agent exists for the current user with name "Brave Research Bot" assigned to MCP slug "brave-search-mcp"
    When I navigate to "/mcps"
    And I click on the MCP "Brave Search MCP"
    Then I see the MCP agents section on the detail page
    And I see agent "Brave Research Bot" in the MCP agents section

  Scenario: Unassign agent from MCP detail page
    Given I have configured the MCP with slug "brave-search-mcp"
    And an agent exists for the current user with name "Bot To Unassign" assigned to MCP slug "brave-search-mcp"
    When I navigate to "/mcps"
    And I click on the MCP "Brave Search MCP"
    And I click "Remove from agent" for agent "Bot To Unassign" on the MCP detail page
    And I confirm the unassign MCP modal
    Then I do not see agent "Bot To Unassign" in the MCP agents section
    And I see the MCP agents empty state

  Scenario: Same MCP can be assigned to multiple agents
    Given I have configured the MCP with slug "brave-search-mcp"
    And an agent exists for the current user with name "Shared MCP Agent A" assigned to MCP slug "brave-search-mcp"
    And an agent exists for the current user with name "Shared MCP Agent B" assigned to MCP slug "brave-search-mcp"
    When I navigate to "/mcps"
    And I click on the MCP "Brave Search MCP"
    Then I see agent "Shared MCP Agent A" in the MCP agents section
    And I see agent "Shared MCP Agent B" in the MCP agents section
