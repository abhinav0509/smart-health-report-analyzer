import React, { useState } from "react";
import axios from "axios";
import "./App.css"; // Custom CSS for styling

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
      setError(null);
      const response = await axios.post("http://localhost:5000/upload-report", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.data) {
        setAnalysis(response.data.data);
      } else {
        setError("Invalid response from the server.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to upload or process the file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Upload Your Health Report</h1>

      <div className="upload-section">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="file-input"
        />
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
            <h2>Patient Details</h2>
            <p><strong>Name:</strong> {analysis.patientDetails.name}</p>
            <p><strong>Age:</strong> {analysis.patientDetails.age}</p>
            <p><strong>Gender:</strong> {analysis.patientDetails.gender}</p>
          </div>

          <div className="doctor-info">
            <h2>Doctor/Lab Details</h2>
            <p><strong>Referred By:</strong> {analysis.doctorInfo.name}</p>
          </div>

          <div className="test-results">
            <h2>Test Results</h2>
            <table>
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Result</th>
                  <th>Reference Range</th>
                  <th>Status</th>
                  <th>Precaution</th>
                </tr>
              </thead>
              <tbody>
                {analysis.tests.map((test, index) => (
                  <tr key={index} className={test.status === "Unhealthy" ? "unhealthy-row" : "healthy-row"}>
                    <td>{test.test}</td>
                    <td>{test.result}</td>
                    <td>{test.referenceRange}</td>
                    <td>{test.status}</td>
                    <td>{test.precaution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadReport;