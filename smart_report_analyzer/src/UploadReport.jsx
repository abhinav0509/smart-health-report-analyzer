import React, { useState } from "react";
import axios from "axios";

const UploadReport = () => {
    const [file, setFile] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // console.log("after post call");  
    // Handle file input change
    const handleFileChange = (e) => {
      setFile(e.target.files[0]);
    };
    
    // Handle file upload
    const handleFileUpload = async () => {
      if (!file) {
        setError("Please select a file first.");
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
        setAnalysis(response.data.data);
      } catch (err) {
        setError("Error uploading the file.");
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div>
        <h1>Upload Health Lab Test Report</h1>
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
        <button onClick={handleFileUpload} disabled={loading}>
          {loading ? "Uploading..." : "Upload Report"}
        </button>
  
        {error && <p style={{ color: "red" }}>{error}</p>}
  
        {analysis && (
          <div>
            <h2>Analysis Result</h2>
            <table>
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
                {analysis.split("\n").map((line, index) => {
                  const [test, value, healthyRange, status, precautions] = line.split(",");
                  return (
                    <tr key={index}>
                      <td>{test}</td>
                      <td>{value}</td>
                      <td>{healthyRange}</td>
                      <td>{status}</td>
                      <td>{precautions}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
  
  export default UploadReport;