require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const analyzeRoute = require('./routes/analyze');
const policiesRoute = require('./routes/policies');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

app.use('/api/analyze', upload.single('config'), analyzeRoute);
app.use('/api/policies', policiesRoute);

app.listen(3001, () => {
  console.log('SOC2 Analyzer backend running on port 3001');
});
