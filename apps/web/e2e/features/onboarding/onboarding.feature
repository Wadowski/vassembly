@onboarding @web
Feature: User Onboarding

  @smoke
  Scenario: New user is redirected to onboarding after registration
    Given a visitor completes registration
    When the account is created
    Then I am on "/onboarding"
    And I see "Complete your account setup"
    And I see "Verify email address"

  @smoke
  Scenario: User verifies email via link
    Given an authenticated user with incomplete onboarding
    And the user has received a verification email
    When I open the email verification link with a valid unexpired token
    Then I am redirected to "/onboarding"
    And Step 1 shows as complete on the hub

  @smoke
  Scenario: User creates first AI integration and completes onboarding
    Given an authenticated user with incomplete onboarding and no active AI credentials
    When I create my first AI integration during onboarding
    Then all product routes are accessible without onboarding redirect

  @smoke
  Scenario: User stays on onboarding after AI integration to review MCP step
    Given an authenticated user with incomplete onboarding and no active AI credentials
    When I create my first AI integration during onboarding without finishing
    Then I am on "/onboarding"
    And I see "Connect MCPs"
    And I see "Finish onboarding"

  @smoke
  Scenario: Incomplete user is redirected from a restricted route
    Given an authenticated user with incomplete onboarding
    When I navigate to "/agents"
    Then I am redirected to "/onboarding"

  Scenario: Admin user bypasses onboarding
    Given I am logged in
    And onboarding.completedAt is null
    And the current user has the admin role
    When I navigate to "/agents"
    Then no redirect to "/onboarding" occurs
    And I am on "/agents"

  Scenario: Existing user is grandfathered at deploy
    Given a user who registered before the onboarding feature was deployed
    When I navigate to "/agents"
    Then no redirect to "/onboarding" occurs
    And I am on "/agents"

  Scenario: Incomplete user visits /settings
    Given an authenticated user with incomplete onboarding
    When I navigate to "/settings"
    Then I am on "/settings"
    And no redirect to "/onboarding" occurs

  Scenario: User resends verification email
    Given an authenticated user with incomplete onboarding
    And the resend cooldown has elapsed
    When I navigate to "/onboarding"
    And I activate "Resend email" on the onboarding hub
    Then I see a success message

  Scenario: Completed user visits /onboarding
    Given an authenticated user with completed onboarding
    When I navigate to "/onboarding"
    Then I am on "/"

  Scenario: returnUrl is captured pre-onboarding and honored on completion
    Given an authenticated user with verified email and incomplete onboarding
    And the returnUrl was captured before the redirect to "/onboarding"
    When I create my first AI integration during onboarding
    Then I am redirected to the captured returnUrl
    And all product routes are accessible without onboarding redirect

  Scenario: Verification token is expired
    Given an authenticated user with incomplete onboarding
    When the token has passed its expiry time
    And I open the expired email verification link
    Then I see "This verification link has expired"
    And I see the option to resend a verification email

  Scenario: Verification token is already used
    Given an authenticated user with incomplete onboarding
    And the user has received a verification email
    When I open the email verification link with a valid unexpired token
    And the user or another session uses the same token again
    Then I see "Invalid or expired verification link"

  Scenario: Verification link for a non-existent or deleted token
    Given an authenticated user with incomplete onboarding
    When a malformed or unknown token is submitted
    And I open the email verification link with the invalid token
    Then I see "Invalid or expired verification link"

  Scenario: User requests resend within cooldown window
    Given an authenticated user with incomplete onboarding
    And the user requested a verification email less than the cooldown period ago
    When I navigate to "/onboarding"
    And I activate "Resend email" on the onboarding hub
    Then the resend cooldown is shown on the onboarding hub

  Scenario: Resend requested for already-verified user
    Given an authenticated user with incomplete onboarding
    And verifiedAt is already set on the user record
    When the resend verification endpoint is called
    Then the response status is 409

  Scenario: Incomplete user calls a protected API endpoint directly
    Given an authenticated user with incomplete onboarding
    When I send an authenticated request to a protected API endpoint outside onboarding scope
    Then the API response indicates onboarding is incomplete

  Scenario: Incomplete user navigates to /agents/ai-integrations/create directly
    Given an authenticated user with incomplete onboarding
    When I navigate to "/agents/ai-integrations/create"
    Then I am on "/agents/ai-integrations/create"
    And no redirect to "/onboarding" occurs

  Scenario: Step 2 accessed before Step 1 is complete
    Given an authenticated user with incomplete onboarding
    When I navigate to "/onboarding"
    Then Step 2 is locked on the hub
    And I see a prompt that Step 1 must be completed first

  Scenario: User closes verification email and returns later
    Given a user registered and received a verification email
    When I log in again in a new session
    Then I am redirected to "/onboarding"
    And Step 1 shows as pending on the hub

  Scenario: Network failure when completing onboarding step
    Given an authenticated user with incomplete onboarding
    When I navigate to "/onboarding"
    And the network is unavailable
    When the user submits an action that would complete a step
    Then I see a retry-capable error message on the onboarding hub

  Scenario: User's session expires while on /onboarding
    Given the user is on the onboarding hub
    When my session expires
    And I re-authenticate after session expiry on the onboarding hub
    Then the onboarding gate is re-evaluated correctly

  Scenario: returnUrl is an external or unsafe URL
    Given an authenticated user with verified email and incomplete onboarding
    And a returnUrl was captured that is not on the safe allowlist
    When I create my first AI integration during onboarding
    Then I am redirected to home instead of the unsafe URL

  Scenario: Server error when setting verifiedAt
    Given an authenticated user with incomplete onboarding
    And the server returns a 500 error for "/auth/verify-email" requests
    When the user clicks a valid verification link
    Then I see a generic retry message without internal error details
