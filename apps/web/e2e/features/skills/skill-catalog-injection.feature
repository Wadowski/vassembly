@skills @web
Feature: Skill Catalog Injection (SK-10)

  Scenario: Agent with specializationId receives catalog
    Given system agent "Legal researcher" has specializationId for specialization "Legal"
    And specialization "Legal" has enabled non-archived skills "contract-review" and "legal-research"
    And specialization "Legal" has disabled skill "deprecated-review"
    And specialization "Legal" has archived skill "old-research"
    When the system agent "Legal researcher" is invoked
    Then the system message includes a skill catalog section
    And each catalog entry shows name and description only with no rule body
    And disabled and archived skills are omitted from the skill catalog

  Scenario: Agent without specializationId receives no catalog
    Given system agent "Assistant" has no specializationId
    When the system agent "Assistant" is invoked
    Then the system message contains only the agent's base rule
    And no skill catalog section is appended

  Scenario: Personal agents never receive skill catalog
    Given I am authenticated as admin
    And a connected AI integration exists for the current user
    And an agent exists for the current user with name "Personal Helper"
    When the personal agent "Personal Helper" is invoked
    Then no skill catalog is injected
