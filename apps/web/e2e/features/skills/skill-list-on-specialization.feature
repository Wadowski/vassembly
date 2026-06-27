@skills @web @smoke
Feature: Skills on Specialization Detail (SK-1, SK-6, SK-9)

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

  Scenario: Admin sees skill mutation controls on specialization detail
    Given I am authenticated as admin
    And a specialization "Legal" exists with 1 skills
    When I navigate to the specialization detail page for "Legal"
    Then I am on a specialization detail page or skill detail page
    And I see a "Create skill" button
    And I see an "Archive" button for skill "contract-review"

  Scenario: Admin archives a skill from specialization detail
    Given I am authenticated as admin
    And a specialization "Legal" exists with 1 skills
    And skill "contract-review" exists and is not archived
    When I navigate to the specialization detail page for "Legal"
    And I archive the skill "contract-review" from the admin UI
    Then skill "contract-review" no longer appears in the active skills list

  Scenario: Archived skill is excluded from active specialization queries
    Given I am authenticated as admin
    And a specialization "Legal" exists with 1 skills
    And skill "contract-review" is archived
    When skillsBySpecialization is queried for specialization "Legal"
    Then archived skills are excluded by default
