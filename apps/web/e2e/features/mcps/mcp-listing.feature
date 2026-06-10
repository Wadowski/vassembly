@mcps @smoke
Feature: MCP Listing Page

  Scenario: Display list of configured MCPs
    Given I am logged in
    And an MCP catalog exists with the following entries:
      | name              | provider   | description                    |
      | Claude 3 Opus     | Anthropic  | Most capable model             |
      | GPT-4 Turbo       | OpenAI     | Advanced reasoning capabilities |
    When I navigate to "/mcps"
    Then I see "Claude 3 Opus"
    And I see "GPT-4 Turbo"
    And I see "Anthropic"
    And I see "OpenAI"

  Scenario: Open MCP details drawer
    Given I am logged in
    And an MCP exists with name "Claude 3 Opus"
    When I navigate to "/mcps"
    And I click on the MCP "Claude 3 Opus"
    Then I see the MCP details drawer
    And I see "Claude 3 Opus" in the drawer
