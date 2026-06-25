@skills @web @smoke
Feature: Skills on Specialization Detail (SK-1, SK-6)

  Scenario: Specialization with skills shows skills panel
    Given I am authenticated as admin
    And a specialization "Legal" exists with 2 skills
    When I navigate to the specialization detail page for "Legal"
    Then I see a "Skills" section
    And I see skill "contract-review" with its description
    And I see skill "legal-research" with its description

  Scenario: Specialization with no skills shows empty state
    Given I am authenticated as admin
    And a specialization "Finance" exists with 0 skills
    When I navigate to the specialization detail page for "Finance"
    Then I see a "Skills" section
    And I see "No skills linked to this specialization yet."

  Scenario: Non-admin cannot access specialization detail
    Given I am authenticated without admin role
    And a specialization "Legal" exists with 0 skills
    When I navigate to "/specialization/{specializationId}"
    Then I see the admin-only access message

  Scenario: No create/edit/delete UI on skill pages
    Given I am authenticated as admin
    And a specialization "Legal" exists with 1 skills
    When I navigate to the specialization detail page for "Legal"
    Then I am on a specialization detail page or skill detail page
    And there is no "Create skill" button
    And there is no edit or delete action on any skill item
    When I click the skill "contract-review"
    Then I am on a specialization detail page or skill detail page
    And there is no "Create skill" button
    And there is no edit or delete action on any skill item
