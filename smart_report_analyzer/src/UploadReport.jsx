import React, { useState } from "react";
import axios from "axios";
import "./App.css";

const UploadReport = () => {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
  };

  const handleFileUpload = async () => {
    if (!file) {
      setError("Please select a PDF file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const response = await axios.post("http://localhost:5000/upload-report", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Backend Response:", response.data); // Log the response from the backend

      if (response.data && response.data.data) {
        setAnalysis(response.data.data); // Set the parsed data from the backend
        console.log("Client Side"+ analysis);
      } else {
        setError("No data returned from the backend.");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to process the report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Smart Health Report Analysis</h1>
      <div className="upload-section">
        <input type="file" accept="application/pdf" onChange={handleFileChange} className="file-input" />
        <button onClick={handleFileUpload} disabled={loading} className="upload-button">
          {loading ? "Processing..." : "Upload Report"}
        </button>
      </div>
      {loading && (
        <div className="loader-container">
          <div className="loader"></div>
          <p>Processing your report, please wait...</p>
        </div>
      )}
      {error && <p className="error-message">{error}</p>}
      {analysis && (
        <div className="analysis-result">
          <div className="patient-info">
            <h2>Patient Information</h2>
            {analysis.PatientDetails ? (
              <>
                <p><strong>Name:</strong> {analysis.PatientDetails.Name}</p>
                <p><strong>Age:</strong> {analysis.PatientDetails.Age}</p>
                <p><strong>Gender:</strong> {analysis.Patient_Details.Gender}</p>
                <p><strong>Report Date:</strong> {analysis.PatientDetails.Date}</p>
              </>
            ) : (
              <pre>{analysis.rawText}</pre>
            )}
          </div>

          {analysis.HealthData && (
            <div className="test-results">
              <h2>Test Results</h2>
              <table>
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Result</th>
                    <th>Reference Range</th>
                    <th>Status</th>
                    <th>Remarks/Precautions</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.HealthData.map((test, index) => (
                    <tr key={index} className={test.Status === "Normal" ? "healthy-row" : "unhealthy-row"}>
                      <td>{test.Test}</td>
                      <td>{test.Result}</td>
                      <td>{test.ReferenceRange}</td>
                      <td>{test.Status}</td>
                      <td>{test.RemarksPrecautions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadReport;
