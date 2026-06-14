@auth @web
Feature: Account Deletion

  Background:
    Given I am logged in

  Scenario: Display account deletion warning
    When I am on the settings page
    And I open the account deletion modal
    Then I see "Delete your account?"
    And I see "I understand this cannot be undone."

  Scenario: Display confirmation button in deletion modal
    When I am on the settings page
    And I open the account deletion modal
    Then I see "Delete account"

  Scenario: Display cancel button in deletion modal
    When I am on the settings page
    And I open the account deletion modal
    Then I see "Cancel"

  Scenario: Close modal when clicking cancel
    When I am on the settings page
    And I open the account deletion modal
    And I cancel account deletion
    Then I am on "/settings"

  Scenario: Require password confirmation for account deletion
    When I am on the settings page
    And I open the account deletion modal
    Then I see "Type DELETE to confirm"
    And I see "I understand this cannot be undone."

  Scenario: Show validation error for empty password confirmation
    When I am on the settings page
    And I open the account deletion modal
    And I confirm account deletion
    Then I see "Confirm that you understand the consequences."

  Scenario: Show error for incorrect password confirmation
    When I am on the settings page
    And I open the account deletion modal
    And I check "I understand this cannot be undone."
    And I fill in "Type DELETE to confirm" with "delete"
    And I confirm account deletion
    Then I see "Type DELETE exactly in uppercase."

  Scenario: Successfully delete account with correct password
    When I am on the settings page
    And I open the account deletion modal
    And I check "I understand this cannot be undone."
    And I fill in "Type DELETE to confirm" with "DELETE"
    And I confirm account deletion
    Then I am redirected to "/login"

  Scenario: Logged out after account deletion
    When I am on the settings page
    And I open the account deletion modal
    And I check "I understand this cannot be undone."
    And I fill in "Type DELETE to confirm" with "DELETE"
    And I confirm account deletion
    And I navigate to "/settings"
    Then I am redirected to "/login"

  Scenario: Prevent account recreation with same email immediately
    When I am on the settings page
    And I open the account deletion modal
    And I check "I understand this cannot be undone."
    And I fill in "Type DELETE to confirm" with "DELETE"
    And I confirm account deletion
    When I navigate to "/register"

  Scenario: Disable delete button during deletion request
    When I am on the settings page
    And I open the account deletion modal
    And I check "I understand this cannot be undone."
    And I fill in "Type DELETE to confirm" with "DELETE"
    And I start account deletion
    Then the delete account confirmation button should be disabled
