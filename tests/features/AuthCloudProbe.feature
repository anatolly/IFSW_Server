# for the cucumber tests
# run cucumber-js -tar @auth



@auth
Feature: file_processing_with_authentication_check


  Scenario: test nonauthenticated uploading
  #Given I am on test cucumber site
    When I upload a valid DICOM file in AUTH mode
    Then I should see http status 403


  Scenario: test authentication
  #Given I am on test cucumber site
    When I sign in as an appuser "aaa@aaa"
    Then I should see http status 200


  Scenario: test authenticated uploading
#Given I am on test cucumber site
    When I upload a valid DICOM file in AUTH mode
    Then I should see http status 200


  Scenario: test authenticated downloading DICOM
    When I make AUTHENTICATED request to download a LAST uploaded DICOM file
    Then I should see http status 200
    And Size of the LAST downloaded file should coincide the size of the test DICOM file



#    And Body contains property "$.envelope.PatientID" with value 123565

#  Scenario: test nonauthenticaed uploading
 # #Given I am on test cucumber site
  #  When I upload a valid DICOM file
 #   Then I should see http status 200
  #  And Body contains property "$.envelope.PatientID" with value 123565


   # Scenario: test downloading DICOM
    #  When I make request to download a valid DICOM file with id 15
     # Then I should see http status 200
      #And Size of the downloaded file for id 15 should coincide the size of the test DICOM file

