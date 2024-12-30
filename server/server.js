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

// CORS Configuration
const cors = require("cors");
app.use(cors());
app.use(express.json());

// Multer setup for PDF file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
  }),
  fileFilter: (req, file, cb) => {
    const isPdf = path.extname(file.originalname).toLowerCase() === ".pdf";
    if (isPdf) cb(null, true);
    else cb(new Error("Only PDF files are allowed."));
  },
}).single("file");

// OpenAI Configuration
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper Functions
async function extractPdfData(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    console.log("Extracted PDF Data:", pdfData.text); // Log extracted data
    return pdfData.text;
  } catch (error) {
    throw new Error("Error reading PDF file.");
  }
}

async function processHealthReport(text) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an assistant that processes health reports. Extract the patient details (Name, Age, Gender, Date) and health data into a structured tabular format with columns: Test, Result, Reference Range, Status, and Remarks/Precautions. Format the data for easy presentation in JSON format.",
        },
        { role: "user", content: text },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    console.log("Raw OpenAI Response:", content); // Log raw response for debugging

    // Try to parse it as JSON
    try {
      const jsonData = JSON.parse(content); // Parse the response as JSON
      return jsonData; // Return the parsed JSON data
    } catch (jsonError) {
      console.warn("Response is not valid JSON. Returning plain text.");
      return { rawText: content }; // Return the raw text if not JSON
    }
  } catch (error) {
    console.error("Error with OpenAI API:", error.message);
    throw new Error("Failed to process data with OpenAI.");
  }
}

// Backend Routes
app.post("/upload-report", upload, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const filePath = path.join(__dirname, "uploads", req.file.filename);

  try {
    const pdfText = await extractPdfData(filePath);
    const processedData = await processHealthReport(pdfText);

    // Return data to frontend
    res.json({ data: processedData });
  } catch (error) {
    console.error("Processing Error:", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    // Clean up the uploaded file
    fs.unlink(filePath, (err) => {
      if (err) console.error("File deletion error:", err.message);
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
