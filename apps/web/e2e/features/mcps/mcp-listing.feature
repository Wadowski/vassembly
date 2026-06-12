@mcps @smoke
Feature: MCP Listing Page

  Background:
    Given I am logged in
    And the MCP catalog is seeded

  Scenario: Display MCP catalog cards
    When I navigate to "/mcps"
    Then I see "Gmail MCP"
    And I see "Brave Search MCP"
    And I see "No MCPs configured yet. Browse below to get started."

  Scenario: Open MCP detail page from catalog card
    When I navigate to "/mcps"
    And I click on the MCP "Brave Search MCP"
    Then I see the MCP detail page
    And I see "Brave Search MCP" on the MCP detail page
    And I see "Comprehensive search capabilities" on the MCP detail page

  Scenario: Search MCP catalog
    When I navigate to "/mcps"
    And I search MCPs for "Brave"
    Then I see "Brave Search MCP"
    And I do not see the MCP "Gmail MCP"

  Scenario: Filter MCP catalog by tag
    When I navigate to "/mcps"
    And I filter MCPs by tag "search"
    Then I see "Brave Search MCP"
    And I do not see the MCP "Gmail MCP"

  Scenario: Show configured MCP in YOUR MCPs section
    Given I have configured the MCP with slug "brave-search-mcp"
    When I navigate to "/mcps"
    Then I see "Brave Search MCP"
    And I do not see "No MCPs configured yet. Browse below to get started."
