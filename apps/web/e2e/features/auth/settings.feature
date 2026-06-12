@auth @web @mode:serial
Feature: User Account Settings

  Background:
    Given I am logged in

  Scenario: Navigate to settings from layout
    When I navigate to "/"
    And I open the navigation menu
    Then I see the account settings option
    When I navigate to settings from the menu
    Then I am on "/settings"

  Scenario: Update profile display name
    When I am on the settings page
    And I fill in the settings field "First name" with "Updated Name"
    And I click the settings button "Save"
    Then I see "Profile saved."

  Scenario: Show validation error for empty display name
    When I am on the settings page
    And I fill in the settings field "First name" with ""
    And I click the settings button "Save"
    Then I should see field error "Name must be between 1 and 80 characters."

  Scenario: Show validation error for display name exceeding length
    When I am on the settings page
    And I fill in the settings field "First name" with "This is a very long display name that exceeds the maximum character limit allowed by the system"
    And I click the settings button "Save"
    Then I should see field error "Name must be between 1 and 80 characters."

  Scenario: Successfully change password with valid old and new password
    When I am on the settings page
    And I fill in the settings field "Current password" with "SecurePass123!"
    And I fill in the settings field "New password" with "NewSecurePass123!"
    And I fill in the settings field "Confirm password" with "NewSecurePass123!"
    And I click the settings button "Save new password"
    Then I see "Password updated."

  Scenario: Show validation error for empty current password
    When I am on the settings page
    And I fill in the settings field "New password" with "NewSecurePass123!"
    And I fill in the settings field "Confirm password" with "NewSecurePass123!"
    And I click the settings button "Save new password"
    Then I should see field error "Current password is required."

  Scenario: Show validation error for empty new password
    When I am on the settings page
    And I fill in the settings field "Current password" with "SecurePass123!"
    And I click the settings button "Save new password"
    Then I should see field error "Confirmation is required."

  Scenario: Show validation error for password mismatch
    When I am on the settings page
    And I fill in the settings field "Current password" with "SecurePass123!"
    And I fill in the settings field "New password" with "NewSecurePass123!"
    And I fill in the settings field "Confirm password" with "DifferentPass123!"
    And I click the settings button "Save new password"
    Then I should see field error "Password confirmation must match."

  Scenario: Show error for incorrect current password
    When I am on the settings page
    And I fill in the settings field "Current password" with "WrongPassword123!"
    And I fill in the settings field "New password" with "NewSecurePass123!"
    And I fill in the settings field "Confirm password" with "NewSecurePass123!"
    And I click the settings button "Save new password"
    Then I see "Password change rejected. Confirm your current password."

  Scenario: Show validation error for weak new password
    When I am on the settings page
    And I fill in the settings field "Current password" with "SecurePass123!"
    And I fill in the settings field "New password" with "weak"
    And I fill in the settings field "Confirm password" with "weak"
    And I click the settings button "Save new password"
    Then I should see field error "Password must contain at least one special character."

  Scenario: Sign out clears session and redirects to login
    When I am on the settings page
    And I click the settings button "Sign out"
    And I confirm sign out in the modal
    Then I am redirected to "/login"

  Scenario: Cannot access settings after sign out
    When I am on the settings page
    And I click the settings button "Sign out"
    And I confirm sign out in the modal
    And I navigate to "/settings"
    Then I am redirected to "/login"

  Scenario: Display account deletion option
    When I am on the settings page
    Then I see "Delete account"

  Scenario: Navigate to delete account confirmation
    When I am on the settings page
    And I open the account deletion modal
    Then I see "Delete your account?"

  Scenario: Session expiry redirects to login
    When I am on the settings page
    And my session expires
    And I navigate to "/settings"
    Then I am redirected to "/login"
