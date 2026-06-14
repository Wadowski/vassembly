@agents @web @smoke
Feature: Agent Management (Web UI)

  Background:
    Given I am logged in

  Scenario: Navigate to agents list page
    When I open the agents list
    Then I see the agents list page
    And I see a "Create Agent" button

  Scenario: Display user's agents in list
    Given an agent exists for the current user with name "Agent 1"
    And an agent exists for the current user with name "Agent 2"
    When I open the agents list
    Then I see agent "Agent 1" in the list
    And I see agent "Agent 2" in the list

  Scenario: Empty state when no agents exist
    When I open the agents list
    Then I see "No data"
    And I see a "Create Agent" button

  Scenario: Search agents by name
    Given an agent exists for the current user with name "Python Developer"
    And an agent exists for the current user with name "JavaScript Helper"
    When I open the agents list
    And I fill in the search box with "Python"
    Then I see agent "Python Developer" in the list
    And I do not see agent "JavaScript Helper" in the list

  Scenario: Search returns empty state when no matches
    Given an agent exists for the current user with name "Python Developer"
    When I open the agents list
    And I fill in the search box with "Ruby"
    Then I see "No data"

  Scenario: Navigate to create agent form
    When I open the agents list
    And I click the create agent button
    Then I am on "/agents/create"
    And I see the agent creation form

  Scenario: Create agent from form
    Given a connected AI integration exists for the current user
    When I open the agent create form
    And I fill in "Name" with "My New Agent"
    And I select "coding" for "Category"
    And I fill in "Description" with "Does important work"
    And I fill in "Rule" with "Follow these rules..."
    And I select the AI integration "E2E Web AI Credential"
    And I click "Create agent"
    Then I see the agent snackbar "Agent created successfully"
    And I am on "/agents"
    And I see agent "My New Agent" in the list

  Scenario: Form validation blocks empty submit
    When I open the agent create form
    And I submit the agent form
    Then I see the agent form error "Name is required."
    And I am still on "/agents/create"

  Scenario: Form validation requires description
    When I open the agent create form
    And I fill in "Name" with "Agent"
    And I select "coding" for "Category"
    And I submit the agent form
    Then I see the agent form error "Description is required."

  Scenario: Form validation requires instructions
    When I open the agent create form
    And I fill in "Name" with "Agent"
    And I select "coding" for "Category"
    And I fill in "Description" with "Description"
    And I submit the agent form
    Then I see the agent form error "Rule is required."

  Scenario: Edit agent from list
    Given an agent exists for the current user with name "Agent to Edit"
    When I open the agents list
    And I click the edit button for "Agent to Edit"
    Then I am on "/agents/{agentId}/edit"
    And the form shows "Agent to Edit" in the name field

  Scenario: Form pre-fills with agent data when editing
    Given an agent exists for the current user with name "Old Name" with description "Old Desc" and instructions "Old Rules"
    When I open the agent edit page
    Then the form shows "Old Name" in the name field
    And the form shows "Old Desc" in the description field
    And the form shows "Old Rules" in the instructions field

  Scenario: Save edited agent
    Given a connected AI integration exists for the current user
    And an agent exists for the current user with name "Old Name"
    When I open the agent edit page
    And I fill in "Name" with "New Name"
    And I fill in "Description" with "New Description"
    And I select the AI integration "E2E Web AI Credential"
    And I click "Update agent"
    Then I see the agent snackbar "Agent updated successfully"
    And I am on "/agents"
    And I see agent "New Name" in the list
    And I do not see agent "Old Name" in the list

  Scenario: Delete agent from list
    Given an agent exists for the current user with name "Agent to Delete"
    When I open the agents list
    And I click the delete button for "Agent to Delete"
    Then I see a confirmation modal
    And the modal contains "Are you sure you want to delete Agent to Delete?"
    And I confirm the delete dialog
    Then I see the agent snackbar "Agent deleted"
    And I do not see agent "Agent to Delete" in the list

  Scenario: Cancel delete operation
    Given an agent exists for the current user with name "Agent to Keep"
    When I open the agents list
    And I click the delete button for "Agent to Keep"
    And I see the confirmation modal
    And I click "Cancel"
    Then I do not see the confirmation modal
    And I see agent "Agent to Keep" in the list

  Scenario: User cannot see other user's agents
    Given an agent exists for another user with name "Other User's Agent"
    When I open the agents list
    Then I do not see agent "Other User's Agent" in the list

  Scenario: User cannot edit other user's agent via direct URL
    Given an agent exists for another user
    When I open the agent edit page
    Then I see "Agent not found"

  Scenario: Restore deleted agent from list
    Given an agent exists for the current user with name "Agent to Restore"
    And the agent is deleted
    When I open the agents list
    And I filter agents by status "Archived"
    And I click the restore button for "Agent to Restore"
    And I confirm the restore dialog
    Then I see the agent snackbar "Agent restored"
    And I filter agents by status "Active"
    And I see agent "Agent to Restore" in the list

  Scenario: Network error shows empty list
    Given the agents list fetch fails
    When I open the agents list
    Then I see "No data"

  Scenario: Session expires during form submission
    Given a connected AI integration exists for the current user
    When I open the agent create form
    And I fill in "Name" with "My Agent"
    And I select "coding" for "Category"
    And I fill in "Description" with "Description"
    And I fill in "Rule" with "Instructions"
    And I select the AI integration "E2E Web AI Credential"
    And my session expires
    And I try to open the agent create form
    Then I am redirected to "/login"
