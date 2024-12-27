import React, { useState } from "react";
import axios from "axios";
import "./App.css"; // Separate CSS for styling

const UploadReport = () => {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle file input change
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null); // Clear any previous error
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!file) {
      setError("Please select a PDF file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post("http://localhost:5000/upload-report", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.data) {
        // Directly set the structured response without parsing
        setAnalysis(response.data.data);
      } else {
        setError("Invalid response from the server.");
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 400) {
        setError("File upload failed. Please ensure you are uploading a valid PDF file.");
      } else if (err.response?.status === 500) {
        setError("Server error. Unable to process the report.");
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Upload Your Lab Test Report</h1>

      {/* File Input */}
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="file-input"
      />
      <button onClick={handleFileUpload} disabled={loading} className="upload-button">
        {loading ? "Uploading..." : "Upload Report"}
      </button>

      {/* Error Message */}
      {error && <p className="error">{error}</p>}

      {/* Analysis Result */}
      {analysis && (
        <div className="analysis-result">
          <h2>Patient Information</h2>
          <div className="patient-info">
            <p><strong>Name:</strong> {analysis.patientDetails.name}</p>
            <p><strong>Age:</strong> {analysis.patientDetails.age}</p>
            <p><strong>Gender:</strong> {analysis.patientDetails.gender}</p>
          </div>

          <h2>Doctor/Lab Information</h2>
          <div className="doctor-info">
            <p><strong>Doctor/Lab Name:</strong> Dr. {analysis.doctorInfo.name}</p>
          </div>

          <h2>Test Results</h2>
          <table className="test-results">
            <thead>
              <tr>
                <th>Test</th>
                <th>Value</th>
                <th>Healthy Range</th>
                <th>Status</th>
                <th>Precautions</th>
              </tr>
            </thead>
            <tbody>
              {analysis.tests.map((test, index) => (
                <tr key={index} className={test.status === "Unhealthy" ? "unhealthy" : "healthy"}>
                  <td>{test.test}</td>
                  <td>{test.value}</td>
                  <td>{test.healthyRange}</td>
                  <td>{test.status}</td>
                  <td>{test.precautions || "None"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UploadReport;

