@auth @api @smoke
Feature: User Registration (REST API)

  Scenario: Successfully register a new user
    When I send a POST request to "/user/register" with JSON body:
      """
      {
        "email": "newuser@example.com",
        "password": "SecurePass123!",
        "firstName": "New",
        "lastName": "User"
      }
      """
    Then the response status is 201
    And the response contains "user.email" with value "newuser@example.com"
    And the response contains "user.id"

  Scenario: Reject duplicate email registration
    Given a registered user exists with email "existing@example.com" and password "SecurePass123!"
    When I send a POST request to "/user/register" with JSON body:
      """
      {
        "email": "existing@example.com",
        "password": "SecurePass123!",
        "firstName": "Another",
        "lastName": "User"
      }
      """
    Then the response status is 400
    And the response contains "message" with text "Email already exists"

  Scenario: Reject invalid email format
    When I send a POST request to "/user/register" with JSON body:
      """
      {
        "email": "notanemail",
        "password": "SecurePass123!",
        "firstName": "User",
        "lastName": "Name"
      }
      """
    Then the response status is 400
    And the response contains "message"
