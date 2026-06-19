@agents @web @smoke
Feature: System Agent Form (Web UI)

  Background:
    Given I am logged in
    And the current user has the admin role

  Scenario: System agent create form accepts field input
    When I open the system agent create form
    And I fill in "Name" with "E2E System Agent"
    And I select "Utility" for system agent "Category"
    And I fill in "Description" with "Created during e2e"
    And I fill in "Rule" with "Follow these platform rules"
    Then the system agent form shows "E2E System Agent" in the name field
    And the system agent form shows "Created during e2e" in the description field
    And the system agent form shows "Follow these platform rules" in the rule field

  Scenario: System agent edit form accepts rule changes
    Given the system agent "Question worker" is available for editing
    When I open the system agent edit page
    And I fill in "Rule" with "Updated rule text for e2e"
    Then the system agent form shows "Updated rule text for e2e" in the rule field

  Scenario: System agent edit form accepts name and description changes
    Given the system agent "Question worker" is available for editing
    When I open the system agent edit page
    And I fill in "Name" with "Question worker e2e"
    And I fill in "Description" with "Updated description for e2e"
    Then the system agent form shows "Question worker e2e" in the name field
    And the system agent form shows "Updated description for e2e" in the description field
