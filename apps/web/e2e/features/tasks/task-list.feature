@tasks @web
Feature: Task List Homepage

  Background:
    Given I am logged in

  Scenario: Navigate to home and see recent tasks
    Given the user has 1 recent tasks
    Then I see "E2E task 1"
    And the list displays tasks sorted by creation date (newest first)

  Scenario: Load more button appears when more than 10 tasks exist
    Given the user has 15 recent tasks
    When I navigate to "/"
    Then I see a "Load More" button

  Scenario: Load more button fetches additional tasks
    Given the user has 15 recent tasks
    And I navigate to "/"
    When I click "Load More"
    Then the list shows additional tasks

  Scenario: Search by task title filters results in real-time
    Given the user has tasks with titles:
      | title                    |
      | Customer feedback review |
      | Invoice processing       |
      | Report generation        |
    When I navigate to "/"
    And I fill in the search field with "Report"
    Then the list displays only tasks matching "Report"

  Scenario: Search with no matches displays empty results
    Given the user has tasks with titles:
      | title              |
      | Analyze data       |
      | Create summary     |
    When I navigate to "/"
    And I fill in the search field with "NonExistent"
    Then the search results are empty

  Scenario: No tasks state displays empty message
    When I navigate to "/"
    Then I see "What's next?"

  Scenario: New task appears in list after creation
    When I navigate to "/"
    When I create a task with description "New task via form"
    Then the task "New task via form" appears in the list

  Scenario: Cross-user isolation - user cannot see other user's tasks
    Given another user "other@example.com" exists with tasks
    When I navigate to "/"
    Then I see only my own tasks
    And I do not see tasks from other users

  Scenario: Network error leaves task list empty
    Given the task list fetch fails
    When I navigate to "/"
    Then I see "What's next?"
    And I do not see a list of recent tasks

  Scenario: Pagination resets on page reload
    Given the user has 15 recent tasks
    And I navigate to "/"
    When I click "Load More"
    Then the list shows additional tasks
    When I reload the page
    Then the first page of tasks is displayed

  Scenario: Oversized page parameter loads home page normally
    When I navigate to "/?page=999999"
    Then I see "What's next?"

  Scenario: Search persists while loading more results
    Given the user has 15 recent tasks matching "Report"
    When I navigate to "/"
    And I fill in the search field with "Report"
    When I click "Load More"
    Then the search filter remains active
    And the results show additional tasks matching "Report"
