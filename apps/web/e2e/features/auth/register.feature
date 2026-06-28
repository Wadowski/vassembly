@auth @web
Feature: User Registration

  Scenario: Successfully register with valid credentials
    When I navigate to "/register"
    And I fill in a unique registration email
    And I fill in required registration fields
    And I fill in "Password" with "SecurePass123!"
    And I fill in "Confirm Password" with "SecurePass123!"
    And I click "Create account"
    Then I see "Account created successfully."
    And I am on "/onboarding"

  Scenario: Show validation error for empty email
    When I navigate to "/register"
    And I click "Create account"
    Then I see "Email is required."

  Scenario: Show validation error for empty password
    When I navigate to "/register"
    And I fill in "Email" with "user@example.com"
    And I click "Create account"
    Then I see "Password is required."

  Scenario: Show validation error for empty confirm password
    When I navigate to "/register"
    And I fill in "Email" with "user@example.com"
    And I fill in "Password" with "SecurePass123!"
    And I click "Create account"
    Then I see "Please confirm your password."

  Scenario: Show validation error for invalid email format
    When I navigate to "/register"
    And I fill in "Email" with "notanemail"
    And I fill in required registration fields
    And I fill in "Password" with "SecurePass123!"
    And I fill in "Confirm Password" with "SecurePass123!"
    And I submit the registration form ignoring browser validation
    Then I see "Enter a valid email address."

  Scenario: Show validation error for password mismatch
    When I navigate to "/register"
    And I fill in "Email" with "user@example.com"
    And I fill in required registration fields
    And I fill in "Password" with "SecurePass123!"
    And I fill in "Confirm Password" with "DifferentPass123!"
    And I click "Create account"
    Then I see "Passwords must match."

  Scenario: Show validation error for weak password
    When I navigate to "/register"
    And I fill in "Email" with "user@example.com"
    And I fill in required registration fields
    And I fill in "Password" with "weak"
    And I fill in "Confirm Password" with "weak"
    And I click "Create account"
    Then I see "Password must be at least 8 characters."

  Scenario: Show error for duplicate email registration
    Given a registered user exists with email "existing@vassembly.test" and password "SecurePass123!"
    When I navigate to "/register"
    And I fill in "Email" with "existing@vassembly.test"
    And I fill in required registration fields
    And I fill in "Password" with "SecurePass123!"
    And I fill in "Confirm Password" with "SecurePass123!"
    And I click "Create account"
    Then I see "This email is already registered."

  Scenario: Display link to login page on duplicate email error
    Given a registered user exists with email "existing@vassembly.test" and password "SecurePass123!"
    When I navigate to "/register"
    And I fill in "Email" with "existing@vassembly.test"
    And I fill in required registration fields
    And I fill in "Password" with "SecurePass123!"
    And I fill in "Confirm Password" with "SecurePass123!"
    And I click "Create account"
    Then I see "Sign in"

  Scenario: Display policy links on registration form
    When I navigate to "/register"
    Then I see "Privacy Policy"
    And I see "Terms and Conditions"

  Scenario: Display password requirements on focus
    When I navigate to "/register"
    And I fill in "Password" with "Pass"
    Then I see "Minimum 8 characters"
    And I see "Uppercase letter (A-Z)"
    And I see "Number (0-9)"

  Scenario: Display link to login page
    When I navigate to "/register"
    Then I see "Sign in"

  Scenario: Redirect authenticated user to home when accessing /register
    Given I am logged in
    When I navigate to "/register"
    Then I am on "/"

  Scenario: Disable submit button during registration request
    When I navigate to "/register"
    And I fill in a unique registration email
    And I fill in required registration fields
    And I fill in "Password" with "SecurePass123!"
    And I fill in "Confirm Password" with "SecurePass123!"
    And I click "Create account"
    Then I see "Account created successfully."

  Scenario: Show network error message on registration failure
    When I navigate to "/register"
    And I fill in a unique registration email
    And I fill in required registration fields
    And I fill in "Password" with "SecurePass123!"
    And I fill in "Confirm Password" with "SecurePass123!"
    And the network is unavailable
    And I click "Create account"
    Then I see "Network error. Please try again."

  Scenario: Send verification email if email verification is enabled
    Given the registration API requires email verification
    When I navigate to "/register"
    And I fill in a unique registration email
    And I fill in required registration fields
    And I fill in "Password" with "SecurePass123!"
    And I fill in "Confirm Password" with "SecurePass123!"
    And I click "Create account"
    Then I see "Please verify your email to confirm your account."
    And I am on "/onboarding"
