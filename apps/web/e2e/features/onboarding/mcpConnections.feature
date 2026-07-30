@onboarding @web @mcp
Feature: Onboarding MCP connections step

  Scenario: Step 3 is locked before AI integration is created
    Given an authenticated user with incomplete onboarding
    When I navigate to "/onboarding"
    Then Step 3 is locked on the hub

  Scenario: Incomplete user can access /mcps during onboarding
    Given an authenticated user with verified email and incomplete onboarding
    When I navigate to "/mcps"
    Then I am on "/mcps"
    And no redirect to "/onboarding" occurs

  Scenario: Incomplete user can access /mcps detail during onboarding
    Given an authenticated user with verified email and incomplete onboarding
    When I navigate to "/mcps/wikipedia-mcp"
    Then I am on "/mcps/wikipedia-mcp"
    And no redirect to "/onboarding" occurs

  Scenario: MCP connections CTA navigates to /mcps
    Given an authenticated user with incomplete onboarding and an active AI credential
    When I navigate to "/onboarding"
    And I activate "Manage individual connections" on the onboarding hub
    Then I am on "/mcps"
