const express = require('express');
const router = express.Router();
const { generatePolicies } = require('../services/groqService');

router.post('/', async (req, res) => {
  try {
    const { company_name, aws_config } = req.body;
    const policies = await generatePolicies(aws_config, company_name);
    res.json(policies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Policy generation failed: ' + error.message });
  }
});

module.exports = router;
