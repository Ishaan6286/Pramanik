const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function generateExplanations(failedControls, companyName) {
  const failedSummary = failedControls.map(c =>
    `Control ${c.id} (${c.title}): ${c.issues.join('; ')}`
  ).join('\n');

  const prompt = `You are a SOC 2 compliance expert helping an Indian startup called "${companyName}".

They have the following security issues in their AWS setup:
${failedSummary}

For each failed control, provide:
1. A simple explanation of why this is a security risk (2-3 sentences, plain English)
2. Exact step-by-step fix in AWS console (3-4 steps)
3. Business impact if not fixed (1 sentence)

Format your response as a JSON array like this:
[
  {
    "control_id": "CC6.1",
    "risk_explanation": "explanation here",
    "fix_steps": ["Step 1", "Step 2", "Step 3"],
    "business_impact": "impact here"
  }
]

Return ONLY the JSON array, no other text.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 2000
  });

  const text = response.choices[0].message.content;
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

async function generatePolicies(awsConfig, companyName) {
  const prompt = `You are a compliance expert. Write 3 professional SOC 2 policy documents for "${companyName}", an Indian SaaS startup using AWS.

Write these exact 3 policies:
1. Access Control Policy
2. Data Encryption Policy
3. Incident Response Policy

Each policy should:
- Be 300-400 words
- Sound professional and audit-ready
- Reference AWS services specifically
- Include the company name "${companyName}"
- Include sections: Purpose, Scope, Policy Statement, Responsibilities, Review Period

Format as JSON:
{
  "policies": [
    {
      "title": "Access Control Policy",
      "content": "full policy text here"
    },
    {
      "title": "Data Encryption Policy",
      "content": "full policy text here"
    },
    {
      "title": "Incident Response Policy",
      "content": "full policy text here"
    }
  ]
}

Return ONLY the JSON, no other text.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
    max_tokens: 3000
  });

  const text = response.choices[0].message.content;
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

module.exports = { generateExplanations, generatePolicies };
