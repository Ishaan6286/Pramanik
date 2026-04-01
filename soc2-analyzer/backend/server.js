require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const analyzeRoute = require('./routes/analyze');
const policiesRoute = require('./routes/policies');
const pramanikRoute = require('./routes/pramanik');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Routes with file upload support
app.use('/api/analyze', upload.single('config'), analyzeRoute);
app.use('/api/policies', policiesRoute);
// Multi-file upload for chat (images, documents, audio)
app.use('/api/pramanik', upload.any(), pramanikRoute);

app.listen(3001, () => {
  console.log('SOC2 Analyzer backend running on port 3001');
  console.log('Pramanik AI modes available at /api/pramanik/');
  console.log('Multi-modal chat (images, docs, audio) enabled');
});
