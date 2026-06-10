@mcps @graphql @smoke
Feature: MCP Configuration (GraphQL Queries)

  Scenario: Fetch list of configured MCPs
    Given I am logged in
    And an MCP exists with name "Claude 3 Opus" and type "model"
    And an MCP exists with name "GPT-4 Turbo" and type "model"
    When I send a GraphQL query:
      """
      {
        mcps {
          id
          name
          type
        }
      }
      """
    Then the response status is 200
    And the response contains 2 items in "data.mcps"
    And one item has "name" = "Claude 3 Opus"
    And one item has "name" = "GPT-4 Turbo"

  Scenario: Fetch single MCP by ID
    Given I am logged in
    And an MCP exists with name "Claude 3 Opus"
    When I send a GraphQL query:
      """
      {
        mcp(id: "{mcpId}") {
          id
          name
          type
          config
        }
      }
      """
    Then the response status is 200
    And the response contains "data.mcp.name" = "Claude 3 Opus"
