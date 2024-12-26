const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");
require("dotenv").config();
const { OpenAI } = require("openai");  // Correct import for OpenAI

// Initialize Express
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

// Configure file upload with multer
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

// Set up OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Endpoint to upload PDF and analyze it
app.post("/upload-report", upload, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const filePath = path.join(__dirname, "uploads", req.file.filename);
  console.log("Uploaded file:", req.file);

  try {
    // Extract text from PDF
    const pdfData = await pdfParse(fs.readFileSync(filePath));
    console.log("PDF text extracted:", pdfData.text);  // Log extracted text

    if (!pdfData.text) {
      return res.status(400).json({ error: "Failed to extract text from PDF." });
    }

    // Analyze the text using OpenAI API (using completions.create)
    const result = await openai.chat.completions.create({
      model: "gpt-4", // Adjust model as needed (gpt-4 or text-davinci-003)
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that analyzes health lab test reports.",
        },
        {
          role: "user",
          content: `Analyze the following health lab test report and categorize the results as healthy or unhealthy. Suggest precautions based on the following data:\n\n${pdfData.text}`,
        },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    // Return the result as JSON
    res.json({ data: result.choices[0].message.content });
  } catch (error) {
    console.error("Error processing the report:", error.message); // Log detailed error
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
