@mcps @configuration @smoke
Feature: MCP Configuration

  Background:
    Given I am logged in
    And the MCP catalog is seeded

  Scenario: Navigate to MCP detail and see configuration form
    When I navigate to "/mcps"
    And I click on the MCP "Brave Search MCP"
    Then I see the MCP detail page
    And I see the configuration form for "Brave Search MCP"

  Scenario: Configure MCP for first time with test connection success
    When I navigate to "/mcps"
    And I click on the MCP "Brave Search MCP"
    And I fill the MCP form field "apiKey" with "test-api-key-12345"
    And I click the Test Connection button
    Then the Test Connection button shows success
    And I see "Connection verified" on the form

  Scenario: Save configuration after successful test
    When I navigate to "/mcps"
    And I click on the MCP "Brave Search MCP"
    And I fill the MCP form field "apiKey" with "test-api-key-12345"
    And I click the Test Connection button
    And I click the Save Configuration button
    Then I am redirected to the MCP list
    And I see a "configured" badge for "Brave Search MCP"

  Scenario: Update existing MCP configuration
    Given I have configured the MCP with slug "brave-search-mcp"
    When I navigate to "/mcps"
    And I click on the MCP "Brave Search MCP"
    And I fill the MCP form field "apiKey" with "updated-api-key-99999"
    And I click the Test Connection button
    And I click the Save Configuration button
    Then I am redirected to the MCP list
    And I see a "configured" badge for "Brave Search MCP"

  Scenario: Remove MCP configuration
    Given I have configured the MCP with slug "brave-search-mcp"
    When I navigate to "/mcps"
    And I click on the MCP "Brave Search MCP"
    And I click the Remove Configuration button
    And I confirm the remove modal
    Then I am redirected to the MCP list
    And I do not see a "configured" badge for "Brave Search MCP"

  Scenario: Search still works with configured MCP
    Given I have configured the MCP with slug "brave-search-mcp"
    When I navigate to "/mcps"
    And I search MCPs for "Brave"
    Then I see "Brave Search MCP"
    And I see a "configured" badge for "Brave Search MCP"

  Scenario: Required field blocks test button
    When I navigate to "/mcps"
    And I click on the MCP "Brave Search MCP"
    Then the Test Connection button is disabled

  Scenario: Test connection shows error on provider error
    When I navigate to "/mcps"
    And I click on the MCP "Brave Search MCP"
    And I fill the MCP form field "apiKey" with "invalid"
    And I click the Test Connection button
    Then the form shows error for "apiKey" field
    And the Save Configuration button is disabled

  Scenario: Save without test keeps save button disabled
    When I navigate to "/mcps"
    And I click on the MCP "Brave Search MCP"
    And I fill the MCP form field "apiKey" with "test-api-key-12345"
    Then the Save Configuration button is disabled

  Scenario: Session expires on save redirects to login
    Given I have configured the MCP with slug "brave-search-mcp"
    When I navigate to "/mcps"
    And I click on the MCP "Brave Search MCP"
    And I fill the MCP form field "apiKey" with "updated-key"
    And I click the Test Connection button
    And the session expires before save
    And I click the Save Configuration button
    Then I see error snackbar message

  Scenario: Network loss on test shows error and retry
    When I navigate to "/mcps"
    And I click on the MCP "Brave Search MCP"
    And I fill the MCP form field "apiKey" with "test-api-key-12345"
    And I click the Test Connection button when network is unavailable
    Then I see network error message on the form
    And I see a Retry button

  Scenario: Server error on save preserves form
    When I navigate to "/mcps"
    And I click on the MCP "Brave Search MCP"
    And I fill the MCP form field "apiKey" with "test-api-key-12345"
    And I click the Test Connection button
    And the server fails on configuration save
    And I click the Save Configuration button
    Then I see error snackbar message
    And the form still shows "test-api-key-12345" in the apiKey field

  Scenario: Multiple MCPs can be configured independently
    When I navigate to "/mcps"
    And I click on the MCP "Brave Search MCP"
    And I fill the MCP form field "apiKey" with "brave-key-123"
    And I click the Test Connection button
    And I click the Save Configuration button
    Then I am redirected to the MCP list
    And I see a "configured" badge for "Brave Search MCP"
    When I click on the MCP "Gmail MCP"
    And I fill the MCP form field "clientId" with "valid-id"
    And I fill the MCP form field "clientSecret" with "gmail-secret"
    And I select "Full access" in the "scopes" field
    And I check the "acceptTerms" checkbox
    And I click the Test Connection button
    And I click the Save Configuration button
    Then I am redirected to the MCP list
    And I see a "configured" badge for "Gmail MCP"
    And I see a "configured" badge for "Brave Search MCP"
