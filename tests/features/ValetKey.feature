# for the cucumber tests
# run cucumber-js -t @auth
# TARGET -- @valetkey


@valetkey
Feature: Shared links (ValetKeys) to get temporary access to the specific file
  As an authenticated user of IFSW service
  I want to grant a temporary shared link.
  As a non-authenticated user
  I want to get the shared fle using the temporary shared link

  Scenario: test authentication
  #Given I am on test cucumber site
    When I sign in as an appuser "aaa@aaa"
    Then I should see http status 200


  Scenario: test authenticated uploading
#Given I am on test cucumber site
    When I upload a valid DICOM file
    Then I should see http status 201


  Scenario: test nonauthenticated issuing ValetKeys
    Given I am unauthenticated user
    When I require a new ValetKey
    Then I should see http status 404


  Scenario: test authentication
  #Given I am on test cucumber site
    When I sign in as an appuser "aaa@aaa"
    Then I should see http status 200


  Scenario: test authenticated issuing ValetKeys
   # Given I am unauthenticated user
    When I require a new ValetKey
    Then I should see http status 200

  Scenario: test nonauthenticated download using the LAST ValetKey
    Given I am unauthenticated user
    When I use the LAST ValetKey
    Then I should see http status 200
    And Size of the LAST downloaded file should coincide the size of the test DICOM file

