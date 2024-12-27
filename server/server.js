// Import necessary modules
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");
require("dotenv").config();
const { OpenAI } = require("openai");

const app = express();
const port = process.env.PORT || 5000;

const cors = require("cors");
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// Multer configuration for file upload
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  }),
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    } else {
      cb("Error: File must be a PDF");
    }
  },
}).single("file");

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to extract patient details
function extractPatientDetails(text) {
  const nameMatch = text.match(/Name\s*:\s*(.*)/i);
  const ageGenderMatch = text.match(/Age\/Gender\s*:\s*(\d+)\s*Y\s*\/\s*(\w+)/i);

  return {
    name: nameMatch ? nameMatch[1].trim() : "Unknown",
    age: ageGenderMatch ? ageGenderMatch[1].trim() : "Unknown",
    gender: ageGenderMatch ? ageGenderMatch[2].trim() : "Unknown",
  };
}

// Helper function to extract doctor/lab information
function extractDoctorInfo(text) {
  const doctorMatch = text.match(/Dr\.(.*)/i);

  return {
    name: doctorMatch ? doctorMatch[1].trim() : "Unknown",
  };
}

// Helper function to extract test results
function extractTests(text) {
  const testSectionMatch = text.match(/PHYSICAL EXAMINATION([\s\S]*?)Powered by TCPDF/i);

  if (!testSectionMatch) return [];

  const testSection = testSectionMatch[1];
  const testLines = testSection.split("\n").filter(line => line.trim());

  const tests = [];
  let currentCategory = "";

  testLines.forEach((line) => {
    const categoryMatch = line.match(/^([A-Z ]+)$/i);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim();
    } else {
      const testMatch = line.match(/^(.*?)\s+([\w.\-/ ]+)\s+([\w.\-/ ]+)$/);
      if (testMatch) {
        tests.push({
          category: currentCategory,
          test: testMatch[1].trim(),
          value: testMatch[2].trim(),
          referenceRange: testMatch[3].trim(),
        });
      }
    }
  });

  return tests;
}

// Main function to process the extracted text
function processReport(text) {
  const patientDetails = extractPatientDetails(text);
  const doctorInfo = extractDoctorInfo(text);
  const tests = extractTests(text);

  return {
    patientDetails,
    doctorInfo,
    tests,
  };
}

// Endpoint to upload PDF and analyze it
app.post("/upload-report", upload, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const filePath = path.join(__dirname, "uploads", req.file.filename);

  try {
    // Extract text from PDF
    const pdfData = await pdfParse(fs.readFileSync(filePath));

    if (!pdfData.text) {
      return res.status(400).json({ error: "Failed to extract text from PDF." });
    }

    // Log the extracted text for debugging purposes
    console.log("Extracted Text from PDF:", pdfData.text);

    // Process the report text
    const structuredResult = processReport(pdfData.text);

    // Log the extracted structured result for debugging purposes
    console.log("Extracted Structured Data:", structuredResult);

    // Send structured data as JSON
    res.json({ data: structuredResult });
  } catch (error) {
    console.error("Error processing the report:", error.message);
    res.status(500).json({ error: "Error processing the report." });
  } finally {
    // Cleanup the uploaded file after processing
    fs.unlinkSync(filePath);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
