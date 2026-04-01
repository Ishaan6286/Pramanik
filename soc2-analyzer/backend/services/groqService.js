const Groq = require('groq-sdk');

let groq = null;
function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set. Add it to backend/.env to enable AI features.');
  }
  if (!groq) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

async function generateExplanations(failedControls, companyName) {
  if (!process.env.GROQ_API_KEY) {
    return failedControls.map(c => ({
      control_id: c.id,
      risk_explanation: "AI explanation disabled: Add GROQ_API_KEY to .env to see detailed risk info.",
      fix_steps: ["Configure GROQ_API_KEY in backend/.env", "Restart the backend server"],
      business_impact: "Potential security vulnerabilities might not be fully understood without detailed AI explanations."
    }));
  }

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

  const response = await getGroqClient().chat.completions.create({
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
  if (!process.env.GROQ_API_KEY) {
    return {
      policies: [
        {
          title: "Access Control Policy",
          content: "AI generation disabled. Please add a GROQ_API_KEY to your backend/.env file to generate professional, audit-ready policies customized for your AWS infrastructure."
        },
        {
          title: "Data Encryption Policy",
          content: "AI generation disabled. Please add a GROQ_API_KEY to your backend/.env file to generate this policy."
        },
        {
          title: "Incident Response Policy",
          content: "AI generation disabled. Please add a GROQ_API_KEY to your backend/.env file to generate this policy."
        }
      ]
    };
  }

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

  const response = await getGroqClient().chat.completions.create({
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
