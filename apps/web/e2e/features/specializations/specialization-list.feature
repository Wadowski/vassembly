@specializations @web @smoke
Feature: Specialization List (Admin UI)

  Background:
    Given I am logged in
    And the current user has the admin role

  Scenario: Admin views paginated specialization list with search
    Given 21 specializations exist for list pagination
    And a specialization "legal" exists with description "Covers legal research, contract drafting, and regulatory compliance."
    And a specialization "engineering" exists with description "Software development, architecture, and DevOps tasks."
    When I navigate to "/specialization"
    Then I see the specializations list page
    And I see specialization list pagination controls
    When I search specializations for "legal"
    Then I see specialization "legal" in the list
    And I do not see specialization "engineering" in the list

  Scenario: Empty catalog shows empty state message
    When I navigate to "/specialization"
    Then I see the specializations list page
    And I see "No specializations have been created yet. They are generated automatically as users submit tasks."

  Scenario: Non-admin cannot access specializations list
    Given I am logged in
    When I navigate to "/specialization"
    Then I see "Specialization management is available to administrators only."
