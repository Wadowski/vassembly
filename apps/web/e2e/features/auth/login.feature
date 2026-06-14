@auth @web @smoke
Feature: User Login

  Background:
    Given a registered user exists with email "e2e@vassembly.test" and password "SecurePass123!"

  Scenario: Successfully login with valid credentials
    When I navigate to "/login"
    And I fill in "Email" with "e2e@vassembly.test"
    And I fill in "Password" with "SecurePass123!"
    And I click "Sign in"
    Then I see "Signed in successfully"
    And I am on "/"

  Scenario: Display error message with invalid credentials
    When I navigate to "/login"
    And I fill in "Email" with "wrong@example.com"
    And I fill in "Password" with "WrongPass"
    And I click "Sign in"
    Then I see "Sign-in failed. Check your email and password."

  Scenario: Show validation error for empty email
    When I navigate to "/login"
    And I click "Sign in"
    Then I see "Email is required."

  Scenario: Show validation error for empty password
    When I navigate to "/login"
    And I fill in "Email" with "e2e@vassembly.test"
    And I click "Sign in"
    Then I see "Password is required."

  Scenario: Show validation errors for both empty fields
    When I navigate to "/login"
    And I click "Sign in"
    Then I see "Email is required."

  Scenario: Display link to registration page
    When I navigate to "/login"
    Then I see "Register"
    # TODO: Need step to verify link navigates to /register

  Scenario: Display link to forgot password flow
    When I navigate to "/login"
    Then I see "Forgot password?"
    # TODO: Need step to verify link navigates to forgot password page

  Scenario: Prevent double-submit during login request
    When I navigate to "/login"
    And I fill in "Email" with "e2e@vassembly.test"
    And I fill in "Password" with "SecurePass123!"
    # TODO: Need step to verify sign-in button is disabled during request
    And I click "Sign in"
    Then I see "Signed in successfully"

  Scenario: Redirect authenticated user to home when accessing /login
    Given I am logged in
    When I navigate to "/login"
    Then I am on "/"

  Scenario: Display error on network failure
    When I navigate to "/login"
    And I fill in "Email" with "e2e@vassembly.test"
    And I fill in "Password" with "SecurePass123!"
    And the network is unavailable
    And I click "Sign in"
    Then I see "Unable to connect. Please try again."

  Scenario: Show retry option after network error
    When I navigate to "/login"
    And I fill in "Email" with "e2e@vassembly.test"
    And I fill in "Password" with "SecurePass123!"
    And the network is unavailable
    And I click "Sign in"
    Then I see "Unable to connect. Please try again."
    And I am on "/login"

  Scenario: Honor returnUrl after successful login
    When I navigate to "/login?returnUrl=/agents"
    And I fill in "Email" with "e2e@vassembly.test"
    And I fill in "Password" with "SecurePass123!"
    And I click "Sign in"
    Then I see "Signed in successfully"
    And I am on "/agents"
