const express=require('express');
const multer=require("multer");
const path=require("path");
const fs=require("fs");
const pdfParse=require("pdf-parse");
const openai=require("openai");
require("dotenv").config();

//Initialise express

const app=express();
const port=process.env.PORT || 5000;

const cors=require("cors");
const corsOptions ={
   origin:'*', 
   credentials:true,            //access-control-allow-credentials:true
   optionSuccessStatus:200,
}

app.use(cors(corsOptions)) // Use this after the variable declaration

//configure file upload with multer
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

//Set OpenAI API key
openai.apikey=process.env.OPENAI_API_KEY;

app.use(express.json());

// Endpoint to upload PDF and analyze it
app.use(cors(corsOptions)) // Use this after the variable declaration

app.post("/upload-report", async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const filePath = path.join(__dirname, "uploads", req.file.filename);

  try {
    // Extract text from PDF
    const pdfData = await pdfParse(fs.readFileSync(filePath));

    // Analyze the text using OpenAI API
    const result = await openai.Completion.create({
      model: "gpt-4",
      prompt: `Analyze the following health lab test report and categorize the results as healthy or unhealthy. Suggest precautions based on the following data:\n\n${pdfData.text}\n\nOutput in a table with Test, Value, Healthy Range, Status (Healthy/Unhealthy), and Precautions.`,
      max_tokens: 1500,
      temperature: 0.7,
    });

    // Return the result as JSON
    res.json({ data: result.choices[0].text });
  } catch (error) {
    res.status(500).json({ error: "Error processing the report." });
    console.log(error);
  } finally {
    // Cleanup the uploaded file after processing
    fs.unlinkSync(filePath);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

