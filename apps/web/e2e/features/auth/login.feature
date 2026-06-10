@auth @smoke
Feature: User Login

  Background:
    Given a registered user exists with email "e2e@vassembly.test" and password "Password123"

  Scenario: Successfully login with valid credentials
    When I navigate to "/login"
    And I fill in "Email" with "e2e@vassembly.test"
    And I fill in "Password" with "Password123"
    And I click "Sign in"
    Then I see a success message
    And I am on "/"

  Scenario: Display error with invalid credentials
    When I navigate to "/login"
    And I fill in "Email" with "wrong@example.com"
    And I fill in "Password" with "WrongPass"
    And I click "Sign in"
    Then I see "Invalid credentials"

  Scenario: Show validation errors for empty form
    When I navigate to "/login"
    And I click "Sign in"
    Then I see "Email is required"
    And I see "Password is required"
