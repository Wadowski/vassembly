@specializations @web @smoke
Feature: Specialization Detail (Admin UI)

  Background:
    Given I am logged in
    And the current user has the admin role
    And the MCP catalog is seeded

  Scenario: Admin views specialization detail with agents and MCPs
    Given a specialization "Legal" exists with 3 agents and 2 linked MCPs
    When I navigate to "/specialization"
    And I click the specialization "Legal" in the list
    Then I see the specialization detail page
    And I am on "/specialization/{specializationId}"
    And I see "Legal" as the specialization name
    And I see "Covers legal research, contract drafting, and regulatory compliance."
    And I see "Linked Agents"
    And I see linked agent "Legal researcher"
    And I see linked agent "Legal worker"
    And I see linked agent "Legal validator"
    And I see "Mapped MCPs"
    And I see MCP "Brave Search MCP" mapped to the specialization
    And I see MCP "Gmail MCP" mapped to the specialization

  Scenario: Detail shows unlinked agents with not provisioned indicator
    Given a specialization "Finance" exists with 2 provisioned agents and 1 missing agent slots
    When I navigate to the specialization detail page for "Finance"
    Then I see the specialization detail page
    And I see "Linked Agents"
    And I see linked agent "Finance researcher"
    And I see linked agent "Finance worker"
    And I see "Not provisioned" for the missing agent slot

  Scenario: Non-admin cannot access specialization detail
    Given I am logged in
    And a specialization "legal" exists with description "Legal domain specialization."
    When I navigate to "/specialization/{specializationId}"
    Then I see "Specialization management is available to administrators only."
