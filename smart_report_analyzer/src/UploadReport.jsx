import React, { useState } from "react";
import axios from "axios";

const UploadReport = () => {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState([]);
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
        const structuredData = parseAnalysis(response.data.data); // Parse response
        setAnalysis(structuredData);
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

  // Helper function to parse analysis data (assuming backend sends structured data)
  const parseAnalysis = (data) => {
    try {
      const rows = data.split("\n").filter((line) => line.trim() !== ""); // Handle text response
      return rows.map((row) => {
        const [test, value, healthyRange, status, precautions] = row.split(",");
        return { test, value, healthyRange, status, precautions };
      });
    } catch (error) {
      console.error("Error parsing analysis:", error);
      setError("Error processing the server response.");
      return [];
    }
  };

  return (
    <div style={styles.container}>
      <h1>Upload Health Lab Test Report</h1>

      {/* File Input */}
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        style={styles.fileInput}
      />
      <button onClick={handleFileUpload} disabled={loading} style={styles.uploadButton}>
        {loading ? "Uploading..." : "Upload Report"}
      </button>

      {/* Error Message */}
      {error && <p style={styles.error}>{error}</p>}

      {/* Analysis Result */}
      {analysis.length > 0 && (
        <div style={styles.resultContainer}>
          <h2>Analysis Result</h2>
          <table style={styles.table}>
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
              {analysis.map((item, index) => (
                <tr key={index}>
                  <td>{item.test}</td>
                  <td>{item.value}</td>
                  <td>{item.healthyRange}</td>
                  <td style={item.status === "Unhealthy" ? styles.unhealthy : styles.healthy}>
                    {item.status}
                  </td>
                  <td>{item.precautions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Styling (using inline styles for simplicity)
const styles = {
  container: {
    width: "80%",
    margin: "0 auto",
    textAlign: "center",
    fontFamily: "'Arial', sans-serif",
  },
  fileInput: {
    margin: "20px 0",
  },
  uploadButton: {
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "5px",
    margin: "10px",
    transition: "background-color 0.3s",
  },
  error: {
    color: "red",
    marginTop: "10px",
  },
  resultContainer: {
    marginTop: "20px",
    textAlign: "left",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px",
  },
  healthy: {
    color: "green",
  },
  unhealthy: {
    color: "red",
  },
  tableHeader: {
    backgroundColor: "#f2f2f2",
  },
  tableCell: {
    border: "1px solid #ddd",
    padding: "8px",
  },
};

export default UploadReport;
