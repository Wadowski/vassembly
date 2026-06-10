@auth @api @smoke
Feature: User Registration (REST API)

  Scenario: Successfully register a new user
    When I send a POST request to "/auth/register" with JSON body:
      """
      {
        "email": "newuser@example.com",
        "password": "SecurePass123",
        "name": "New User"
      }
      """
    Then the response status is 201
    And the response contains "email" with value "newuser@example.com"
    And the response contains "id"

  Scenario: Reject duplicate email registration
    Given a registered user exists with email "existing@example.com" and password "Pass123"
    When I send a POST request to "/auth/register" with JSON body:
      """
      {
        "email": "existing@example.com",
        "password": "SecurePass123",
        "name": "Another User"
      }
      """
    Then the response status is 409
    And the response contains "message" with text "Email already registered"

  Scenario: Reject invalid email format
    When I send a POST request to "/auth/register" with JSON body:
      """
      {
        "email": "notanemail",
        "password": "SecurePass123",
        "name": "User"
      }
      """
    Then the response status is 400
    And the response contains "message" with text "Invalid email"
