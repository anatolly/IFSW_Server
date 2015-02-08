Feature: DICOM_file_processing_check


  Scenario: test uploading DICOM
  #Given I am on test cucumber site
    When I upload a valid DICOM file
    Then I should see http status 200
    And Body contains property "$.envelope.PatientID" with value 123565



    Scenario: test downloading DICOM
      When I make request to download a valid DICOM file with id 2
      Then I should see http status 200
      And Size of the downloaded file should coincide the size of the test DICOM file
