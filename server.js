// const express = require('express');
// const mongoose = require('mongoose');
// const multer = require('multer');
// const XLSX = require('xlsx');
// const cors = require('cors');
// const path = require('path');
// const fs = require('fs');
// require('dotenv').config(); // Load environment variables

// // Initialize the app
// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Create 'uploads' directory if it doesn't exist
// if (!fs.existsSync('./uploads')) {
//   fs.mkdirSync('./uploads');
// }

// // MongoDB Connection
// mongoose
//   .connect(process.env.MONGO_URI,)
//   .then(() => console.log('MongoDB Atlas connected'))
//   .catch((err) => console.log('MongoDB connection error:', err));

// // MongoDB Schema (Flexible schema to handle different data from Excel)
// const DataSchema = new mongoose.Schema({}, { strict: false }); // Flexible schema
// const DataModel = mongoose.model('Data', DataSchema);

// // Multer Configuration for File Upload
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, './uploads'); // Save files to the 'uploads' directory
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
//   },
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
//       return cb(new Error('Only Excel files are allowed'), false);
//     }
//     cb(null, true);
//   }
// });

// // API Endpoint to Handle File Upload and Data Insertion
// app.post('/api/upload', upload.single('file'), (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: 'No file uploaded' });
//     }

//     // Read Excel File
//     const filePath = path.join(__dirname, 'uploads', req.file.filename);
//     const workbook = XLSX.readFile(filePath);
//     const sheetName = workbook.SheetNames[0]; // Use the first sheet
//     const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

//     // Format and sanitize data before inserting into the DB
//     const formattedData = sheetData.map(item => {
//       return {
//         ...item,
//         DATE: item.DATE ? new Date(item.DATE) : new Date(), // Ensure DATE is a valid Date object
//       };
//     });

//     // Insert Data into MongoDB
//     DataModel.insertMany(formattedData)
//       .then(() => {
//         res.status(200).json({ message: 'File uploaded and data stored successfully!' });
//       })
//       .catch((err) => {
//         console.error('Database insert error:', err); // Detailed logging
//         res.status(500).json({ message: 'Error saving data to database', error: err.message });
//       });
//   } catch (err) {
//     console.error('File processing error:', err); // Detailed logging
//     res.status(500).json({ message: 'Error processing file', error: err.message });
//   }
// });

// // API to Retrieve Data (with optional regNo filtering)
// app.get('/api/data', (req, res) => {
//   const { regNo } = req.query;

//   if (regNo) {
//     // Filter by regNo
//     DataModel.find({ 'REG.NO': regNo })
//       .then((data) => {
//         res.status(200).json(data);
//       })
//       .catch((err) => {
//         console.error('Database retrieval error:', err); // Detailed logging
//         res.status(500).json({ message: 'Error retrieving filtered data', error: err.message });
//       });
//   } else {
//     // Return all data
//     DataModel.find()
//       .then((data) => {
//         res.status(200).json(data);
//       })
//       .catch((err) => {
//         console.error('Database retrieval error:', err); // Detailed logging
//         res.status(500).json({ message: 'Error retrieving data from database', error: err.message });
//       });
//   }
// });

// // Start the Server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const XLSX = require('xlsx');
const cors = require('cors');
require('dotenv').config(); // Load environment variables

// Initialize the app
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Atlas connected'))
  .catch((err) => console.log('MongoDB connection error:', err));

// MongoDB Schema (Flexible schema to handle different data from Excel)
const DataSchema = new mongoose.Schema({}, { strict: false }); // Flexible schema
const DataModel = mongoose.model('Data', DataSchema);

// Multer Configuration for File Upload (In-memory storage)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      return cb(new Error('Only Excel files are allowed'), false);
    }
    cb(null, true);
  }
});

// API Endpoint to Handle File Upload and Data Insertion
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Read Excel File from memory
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // Use the first sheet
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Format and sanitize data before inserting into the DB
    const formattedData = sheetData.map(item => {
      return {
        ...item,
        DATE: item.DATE ? new Date(item.DATE) : new Date(), // Ensure DATE is a valid Date object
      };
    });

    // Insert Data into MongoDB
    DataModel.insertMany(formattedData)
      .then(() => {
        res.status(200).json({ message: 'File uploaded and data stored successfully!' });
      })
      .catch((err) => {
        console.error('Database insert error:', err); // Detailed logging
        res.status(500).json({ message: 'Error saving data to database', error: err.message });
      });
  } catch (err) {
    console.error('File processing error:', err); // Detailed logging
    res.status(500).json({ message: 'Error processing file', error: err.message });
  }
});

app.get('/api/data', (req, res) => {
    const { regNo } = req.query;
  
    if (regNo) {
    
      DataModel.find({ 'REG.NO': regNo })
        .then((data) => {
          res.status(200).json(data);
        })
        .catch((err) => {
          console.error('Database retrieval error:', err); 
          res.status(500).json({ message: 'Error retrieving filtered data', error: err.message });
        });
    } else {
      
      DataModel.find()
        .then((data) => {
          res.status(200).json(data);
        })
        .catch((err) => {
          console.error('Database retrieval error:', err); 
          res.status(500).json({ message: 'Error retrieving data from database', error: err.message });
        });
    }
  });

// Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
