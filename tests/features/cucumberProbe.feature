Feature: Cucumber probe

Scenario: test badRequest-HTTP-status
Given I am on test cucumber site
When I make request to test controller page with param "NOK"
Then I should see http status 400

Scenario: test OK-HTTP-status
Given I am on test cucumber site
When I make request to test controller page with param "OK"
Then I should see http status 200


