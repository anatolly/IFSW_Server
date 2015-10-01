# for the cucumber tests
# run cucumber-js -t @auth
# TARGET -- @auth


@auth
Feature: Authenticated access to storage
  As an authenticated user of IFSW service
  I want to upload and download my data

  Scenario: test nonauthenticated uploading
    Given I am unauthenticated user
    When I upload a valid DICOM file
    Then I should see http status 403


  Scenario: test authentication
  #Given I am on test cucumber site
    When I sign in as an appuser "aaa@aaa"
    Then I should see http status 200


  Scenario: test authenticated uploading
#Given I am on test cucumber site
    When I upload a valid DICOM file
    Then I should see http status 201


  Scenario: test authenticated downloading of the file
    When I make AUTHENTICATED request to download a LAST uploaded file
    Then I should see http status 200
    And Size of the LAST downloaded file should coincide the size of the test DICOM file

  Scenario: test authenticated delete of the file
    When I make AUTHENTICATED request to delete a LAST uploaded file
    Then I should see http status 200
