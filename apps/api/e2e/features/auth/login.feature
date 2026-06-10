@auth @api @smoke
Feature: User Login (REST API)

  Scenario: Successfully login with valid credentials
    Given a registered user exists with email "testuser@example.com" and password "SecurePass123"
    When I send a POST request to "/auth/login" with JSON body:
      """
      {
        "email": "testuser@example.com",
        "password": "SecurePass123"
      }
      """
    Then the response status is 200
    And the response contains "accessToken"
    And the response contains "refreshToken"

  Scenario: Reject login with wrong password
    Given a registered user exists with email "testuser@example.com" and password "SecurePass123"
    When I send a POST request to "/auth/login" with JSON body:
      """
      {
        "email": "testuser@example.com",
        "password": "WrongPassword"
      }
      """
    Then the response status is 401
    And the response contains "message" with text "Invalid credentials"
