@skills @web
Feature: Skill Resolve (SK-11, SK-12)

  Scenario: skill-resolve returns rule for valid skill
    Given skill "contract-review" exists for specialization "Legal"
    And specialization "Legal" has disabled skill "legal-research"
    And specialization "Legal" has archived skill "old-research"
    When resolve_skill is called with specialization "Legal" and skillName "contract-review"
    Then the tool returns the full rule Markdown body for "contract-review"
    When resolve_skill is called with specialization "Legal" and skillName "legal-research"
    Then resolve_skill returns a not-found error
    When resolve_skill is called with specialization "Legal" and skillName "old-research"
    Then resolve_skill returns a not-found error

  Scenario: skill-resolve rejects unknown skill name
    Given a specialization "Legal" exists with 0 skills
    When resolve_skill is called with specialization "Legal" and skillName "nonexistent"
    Then resolve_skill returns a not-found error

  Scenario: Worker uses skill-resolver via use_agent
    Given system agent "Skill resolver" is seeded with skill-resolve assigned
    And system agent "Legal worker" has specializationId for specialization "Legal"
    And system agent "Legal worker" is assigned internal tool "agent-use"
    And skill "contract-review" exists for specialization "Legal"
    When system agent "Legal worker" calls use_agent for "Skill resolver" with skillName "contract-review"
    Then the use_agent result includes the full rule for "contract-review"

  Scenario: skill-resolve assigned manually by admin
    Given I am logged in
    And the current user has the admin role
    And the system agent "Skill resolver" is available for editing
    When I open the system agent edit page
    Then internal tool "skill - resolve" is available on the system agent form
    And internal tool "skill - resolve" is assigned on the system agent form
    Given system agent "Legal worker" has specializationId for specialization "Legal"
    When I open the system agent edit page for "Legal worker"
    Then internal tool "skill - resolve" is not assigned on the system agent form
