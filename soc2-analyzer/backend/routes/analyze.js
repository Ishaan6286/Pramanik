const express = require('express');
const router = express.Router();
const { runAllChecks } = require('../services/soc2Controls');
const { generateExplanations } = require('../services/groqService');

router.post('/', async (req, res) => {
  try {
    const configText = req.file.buffer.toString('utf-8');
    const awsConfig = JSON.parse(configText);
    const companyName = awsConfig.company_name || 'Your Company';

    const { results, score, passed, total } = runAllChecks(awsConfig);

    const failedControls = results.filter(r => !r.passed);

    let explanations = [];
    if (failedControls.length > 0) {
      explanations = await generateExplanations(failedControls, companyName);
    }

    const enrichedResults = results.map(control => {
      const explanation = explanations.find(e => e.control_id === control.id);
      return {
        ...control,
        risk_explanation: explanation?.risk_explanation || null,
        fix_steps: explanation?.fix_steps || [],
        business_impact: explanation?.business_impact || null
      };
    });

    res.json({
      company_name: companyName,
      score,
      passed,
      total,
      results: enrichedResults
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Analysis failed: ' + error.message });
  }
});

module.exports = router;
