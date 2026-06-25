@skills @web @smoke
Feature: Skill Detail (SK-2, SK-3, SK-4, SK-5)

  Scenario: Admin opens skill detail from specialization
    Given I am authenticated as admin
    And specialization "Legal" has skill "contract-review"
    When I navigate to the specialization detail page for "Legal"
    And I click the skill "contract-review"
    Then I am on "/specialization/{specializationId}/skills/{skillId}"
    And I see the skill name "contract-review"
    And I see the skill description
    And I see the skill rule (instructions) content

  Scenario: Skill detail shows rule and script list
    Given I am authenticated as admin
    And specialization "Legal" has skill "contract-review"
    And skill "contract-review" has a rule with workflow instructions
    And skill "contract-review" has scripts "scripts/validate.py" and "scripts/run-check.sh"
    When I navigate to the skill detail page for "contract-review"
    Then I see the rule content in a readable format
    And I see script "scripts/validate.py" in the scripts list
    And I see script "scripts/run-check.sh" in the scripts list
    And the first script's code is displayed by default

  Scenario: Selecting a script switches displayed code
    Given I am authenticated as admin
    And specialization "Legal" has skill "contract-review"
    And skill "contract-review" has scripts "scripts/validate.py" and "scripts/run-check.sh"
    When I navigate to the skill detail page for "contract-review"
    And I select script "scripts/run-check.sh"
    Then I see the code content of "scripts/run-check.sh"
    And I do not see the code content of "scripts/validate.py" as the active view

  Scenario: Skill with no scripts hides script viewer
    Given I am authenticated as admin
    And specialization "Legal" has skill "legal-research"
    And skill "legal-research" has a rule but no scripts
    When I navigate to the skill detail page for "legal-research"
    Then I see the rule content
    And I see "No scripts bundled with this skill."

  Scenario: Python script uses Python highlighting
    Given I am authenticated as admin
    And skill "contract-review" has script "scripts/validate.py" with language "python"
    When I view that script on the skill detail page
    Then the code viewer applies Python syntax highlighting

  Scenario: Node.js script uses JavaScript highlighting
    Given I am authenticated as admin
    And a skill has script "scripts/build.js" with language "nodejs"
    When I view that script on the skill detail page
    Then the code viewer applies JavaScript syntax highlighting

  Scenario: Bash script uses shell highlighting
    Given I am authenticated as admin
    And a skill has script "scripts/setup.sh" with language "bash"
    When I view that script on the skill detail page
    Then the code viewer applies Bash/shell syntax highlighting

  Scenario: Unknown skill ID returns not found
    Given I am authenticated as admin
    And a specialization "Legal" exists with 0 skills
    When I navigate to "/specialization/{specializationId}/skills/nonexistent-id"
    Then I see "Skill not found."
    And I see a link back to the parent specialization detail page
