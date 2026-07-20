import { Download } from "lucide-react";
import jsPDF from "jspdf";

export default function PDFExport({ data }) {
  const generatePDF = () => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pw - margin * 2;
    let y = 0;
    let pageNum = 0;

    const company = data.company_name || "Your Company";
    const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const period = `${new Date(Date.now() - 180 * 86400000).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} to ${date}`;

    // Framework scores — dynamic based on what's in data
    const fw = data.framework_scores || {};
    const soc2Score  = fw.soc2?.score     || (fw.soc2     ? data.score : 0);
    const isoScore   = fw.iso27001?.score || 0;
    const hipaaScore = fw.hipaa?.score    || 0;
    const dpdpScore  = fw.dpdp?.score     || 0;

    // Build list of ACTIVE frameworks (only those present in data)
    const activeFrameworks = [];
    if (fw.soc2)     activeFrameworks.push({ key: "soc2",     name: "SOC 2",       score: soc2Score,  passed: fw.soc2?.passed  || 0, total: fw.soc2?.total  || 0 });
    if (fw.iso27001) activeFrameworks.push({ key: "iso27001", name: "ISO 27001",   score: isoScore,   passed: fw.iso27001?.passed || 0, total: fw.iso27001?.total || 0 });
    if (fw.hipaa)    activeFrameworks.push({ key: "hipaa",    name: "HIPAA",        score: hipaaScore, passed: fw.hipaa?.passed || 0, total: fw.hipaa?.total || 0 });
    if (fw.dpdp)     activeFrameworks.push({ key: "dpdp",     name: "DPDP Act",     score: dpdpScore,  passed: fw.dpdp?.passed  || 0, total: fw.dpdp?.total  || 0 });

    // Framework names string for title e.g. "SOC 2 · ISO 27001 · DPDP Act"
    const frameworkTitle = activeFrameworks.length > 0
      ? activeFrameworks.map(f => f.name).join(" · ")
      : "Multi-Framework";

    // ── Helpers ──────────────────────────────

    const addFooter = () => {
      pageNum++;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("Pramanik", margin, ph - 10);
      doc.text(String(pageNum), pw - margin, ph - 10, { align: "right" });
    };

    const newPage = () => {
      doc.addPage();
      y = 30;
      addFooter();
    };

    const checkPage = (needed = 20) => {
      if (y + needed > ph - 20) newPage();
    };

    const heading1 = (text) => {
      checkPage(25);
      doc.setFontSize(18);
      doc.setTextColor(20, 30, 50);
      doc.setFont("helvetica", "bold");
      doc.text(text, margin, y);
      y += 5;
      doc.setDrawColor(41, 98, 255);
      doc.setLineWidth(0.8);
      doc.line(margin, y, margin + 50, y);
      y += 10;
    };

    const heading2 = (text) => {
      checkPage(18);
      doc.setFontSize(13);
      doc.setTextColor(30, 40, 60);
      doc.setFont("helvetica", "bold");
      doc.text(text, margin, y);
      y += 8;
    };

    const heading3 = (text) => {
      checkPage(14);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont("helvetica", "italic");
      doc.text(text, margin, y);
      y += 6;
    };

    const body = (text, indent = 0) => {
      doc.setFontSize(9.5);
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(text, contentWidth - indent);
      lines.forEach((line) => {
        checkPage(6);
        doc.text(line, margin + indent, y);
        y += 5;
      });
      y += 2;
    };

    const bullet = (text, indent = 5) => {
      doc.setFontSize(9.5);
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(text, contentWidth - indent - 8);
      checkPage(lines.length * 5 + 2);
      doc.text("\u2022", margin + indent, y);
      lines.forEach((line, i) => {
        doc.text(line, margin + indent + 5, y);
        y += 5;
      });
    };

    // ══════════════════════════════════════════
    // COVER PAGE
    // ══════════════════════════════════════════

    // Dark background
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pw, ph, "F");

    // ── Top brand bar ──
    doc.setFillColor(25, 35, 58);
    doc.rect(0, 0, pw, 18, "F");
    doc.setFontSize(10);
    doc.setTextColor(79, 172, 154);   // muted teal
    doc.setFont("helvetica", "bold");
    doc.text("Pramanik", margin, 12);
    doc.setFontSize(8);
    doc.setTextColor(100, 120, 150);
    doc.setFont("helvetica", "normal");
    doc.text("AI-assisted compliance knowledge", margin + 30, 12);

    // ── Framework badge row (small pills) ──
    let bx = margin;
    const by = 32;
    activeFrameworks.forEach((f) => {
      doc.setFillColor(41, 98, 255, 0.15);   // blue tint
      doc.setFillColor(30, 50, 90);
      doc.roundedRect(bx, by - 6, 28, 9, 2, 2, "F");
      doc.setFontSize(7);
      doc.setTextColor(100, 160, 255);
      doc.setFont("helvetica", "bold");
      doc.text(f.name, bx + 4, by);
      bx += 32;
    });

    // ── Main headline ──
    // Line 1: "Compliance Assessment"
    doc.setFontSize(32);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Compliance", margin, 65);
    doc.text("Assessment", margin, 83);

    // Line 2: framework names (smaller, teal accent)
    doc.setFontSize(13);
    doc.setTextColor(79, 172, 154);
    doc.setFont("helvetica", "normal");
    const fwLine = doc.splitTextToSize(frameworkTitle, contentWidth);
    fwLine.forEach((line, i) => {
      doc.text(line, margin, 96 + i * 8);
    });

    // ── Subtitle ──
    doc.setFontSize(9.5);
    doc.setTextColor(100, 120, 150);
    doc.setFont("helvetica", "normal");
    const subtitleY = 96 + fwLine.length * 8 + 10;
    const subtitle = doc.splitTextToSize(
      `Report on ${company}'s Description of Its AWS Infrastructure and on the Suitability of the Design and Operating Effectiveness of Its Controls Relevant to Security, Availability, Processing Integrity, Confidentiality, and Privacy Trust Services Criteria Throughout the Period ${period}.`,
      contentWidth
    );
    subtitle.forEach((line, i) => {
      doc.text(line, margin, subtitleY + i * 5.5);
    });

    // ── Horizontal rule ──
    const ruleY = subtitleY + subtitle.length * 5.5 + 8;
    doc.setDrawColor(40, 60, 100);
    doc.setLineWidth(0.4);
    doc.line(margin, ruleY, pw - margin, ruleY);

    // ── Score summary box — dynamic columns ──
    const boxY = ruleY + 8;
    const boxH = 52;
    doc.setFillColor(25, 38, 62);
    doc.roundedRect(margin, boxY, contentWidth, boxH, 4, 4, "F");
    doc.setDrawColor(40, 65, 110);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, boxY, contentWidth, boxH, 4, 4, "S");

    // Column 1: Overall Score
    doc.setFontSize(26);
    doc.setTextColor(41, 98, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`${data.score}%`, margin + 12, boxY + 28);
    doc.setFontSize(8);
    doc.setTextColor(100, 120, 150);
    doc.setFont("helvetica", "normal");
    doc.text("OVERALL SCORE", margin + 12, boxY + 38);

    // Column 2: Controls Passed
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`${data.passed}/${data.total}`, margin + 58, boxY + 28);
    doc.setFontSize(8);
    doc.setTextColor(100, 120, 150);
    doc.setFont("helvetica", "normal");
    doc.text("CONTROLS PASSED", margin + 58, boxY + 38);

    // Dynamic framework columns
    const colStart = 115;
    const colSpacing = activeFrameworks.length > 0 ? Math.min(35, (contentWidth - colStart + 10) / activeFrameworks.length) : 35;
    activeFrameworks.forEach((f, i) => {
      const cx = margin + colStart + i * colSpacing;
      // Divider
      doc.setDrawColor(40, 65, 110);
      doc.setLineWidth(0.3);
      doc.line(cx - 4, boxY + 10, cx - 4, boxY + boxH - 10);
      // Score
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(`${f.score}%`, cx, boxY + 28);
      // Label
      doc.setFontSize(7.5);
      doc.setTextColor(100, 120, 150);
      doc.setFont("helvetica", "normal");
      doc.text(f.name.toUpperCase(), cx, boxY + 38);
    });

    addFooter();

    // ══════════════════════════════════════════
    // TABLE OF CONTENTS
    // ══════════════════════════════════════════

    newPage();
    y = 30;

    doc.setFontSize(22);
    doc.setTextColor(20, 30, 50);
    doc.setFont("helvetica", "bold");
    doc.text("Table of Contents", margin, y);
    y += 20;

    const tocItems = [
      ["Section I:", "Assessment Summary & Auditor Opinion", "3"],
      ["Section II:", "Management Assertion", "4"],
      ["Section III:", "System Description", "5"],
      ["Section IV:", "Trust Services Criteria, Controls & Test Results", "6"],
      ["Section V:", "CES Priority Remediation Plan", ""],
      ["Section VI:", "Cross-Framework Compliance Mapping", ""],
      ["Section VII:", "Industry Benchmark Analysis", ""],
    ];

    tocItems.forEach(([prefix, title, pg]) => {
      doc.setFontSize(11);
      doc.setTextColor(30, 40, 60);
      doc.setFont("helvetica", "bold");
      doc.text(prefix, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(title, margin + 28, y);
      y += 10;
    });

    // ══════════════════════════════════════════
    // SECTION I: ASSESSMENT SUMMARY
    // ══════════════════════════════════════════

    newPage();
    heading1("Section I: Assessment Summary");

    heading2("Scope");
    body(`We have conducted an automated assessment of ${company}'s AWS infrastructure throughout the period ${period}, based on the criteria set forth in DC Section 200, 2018 Description Criteria for a Description of a Service Organization's System in a SOC 2\u00AE Report (AICPA, Description Criteria) and the suitability of the design and operating effectiveness of controls stated in the description throughout the period, to provide reasonable assurance that ${company}'s service commitments and system requirements were achieved based on the trust services criteria relevant to Security, Availability, Processing Integrity, Confidentiality, and Privacy (AICPA, Trust Services Criteria).`);

    heading2("Assessment Results");
    body(`Overall Compliance Score: ${data.score}% (${data.passed} of ${data.total} controls passed)`);

    // Severity summary
    const critical = data.results.filter(r => r.severity === "CRITICAL").length;
    const high = data.results.filter(r => r.severity === "HIGH").length;
    const medium = data.results.filter(r => r.severity === "MEDIUM").length;
    const low = data.results.filter(r => r.severity === "LOW").length;

    body(`Findings by Severity:`);
    if (critical > 0) bullet(`CRITICAL: ${critical} controls — Immediate action required`);
    if (high > 0) bullet(`HIGH: ${high} controls — Action required within 30 days`);
    if (medium > 0) bullet(`MEDIUM: ${medium} controls — Action required within 90 days`);
    if (low > 0) bullet(`LOW: ${low} controls — Recommended improvements`);
    y += 3;

    heading2("Framework Coverage");
    body(`This assessment evaluates ${company}'s controls against three internationally recognized compliance frameworks simultaneously:`);
    bullet(`SOC 2 (AICPA Trust Services Criteria): ${fw.soc2?.passed || data.passed}/${fw.soc2?.total || data.total} controls passed (${soc2Score}%)`);
    bullet(`ISO 27001 (Annex A Controls): ${fw.iso27001?.passed || 0}/${fw.iso27001?.total || 0} controls passed (${isoScore}%)`);
    bullet(`HIPAA (Security Rule): ${fw.hipaa?.passed || 0}/${fw.hipaa?.total || 0} controls passed (${hipaaScore}%)`);
    y += 3;

    heading2("Opinion");
    body(`Based on our automated assessment, ${company}'s infrastructure controls require remediation in several areas before achieving audit-ready status. The priority remediation plan in Section V provides an optimized sequence for addressing the identified gaps across all three frameworks simultaneously, using our Compliance Efficiency Score (CES) algorithm.`);

    heading2("Inherent Limitations");
    body(`This automated assessment evaluates configuration-level controls and does not include evaluation of organizational controls, physical security, or personnel-related controls that would be evaluated during a formal SOC 2 Type II audit. This report is intended as a readiness assessment and gap analysis, not a formal auditor's opinion.`);

    // ══════════════════════════════════════════
    // SECTION II: MANAGEMENT ASSERTION
    // ══════════════════════════════════════════

    newPage();
    heading1("Section II: Management Assertion");

    body(`${company}`);
    body(`Date: ${date}`);
    y += 3;

    body(`We have prepared the accompanying description titled "${company}'s Description of Its AWS Infrastructure" for the period ${period}, based on the criteria set forth in DC Section 200, 2018 Description Criteria for a Description of a Service Organization's System in a SOC 2\u00AE Report, in AICPA Description Criteria (description criteria). This description is intended to provide report users with relevant information about ${company}'s AWS infrastructure, particularly concerning system controls designed, implemented, and operated to provide reasonable assurance that the trust services criteria were achieved.`);
    y += 3;

    body("To the best of our knowledge and belief, we confirm that:");
    bullet(`The description presents ${company}'s AWS infrastructure as it was designed and implemented throughout the period ${period}, in accordance with the description criteria.`);
    bullet(`The controls stated in the description were suitably designed throughout the period ${period}, to provide reasonable assurance that ${company}'s service commitments and system requirements were achieved based on the applicable trust services criteria.`);
    bullet(`The controls stated in the description operated effectively throughout the period ${period}, providing reasonable assurance that ${company}'s service commitments and system requirements were met based on the applicable trust services criteria.`);

    // ══════════════════════════════════════════
    // SECTION III: SYSTEM DESCRIPTION
    // ══════════════════════════════════════════

    newPage();
    heading1("Section III: Description of the System");

    heading2(`Overview of ${company}`);
    body(`This description details the AWS infrastructure and the related policies, procedures, and control activities for ${company}. This description does not include any other services or policies, procedures, and control activities at any subservice organizations.`);

    heading2("Components of the System");

    heading3("Infrastructure");
    body(`${company}'s system is hosted on Amazon Web Services (AWS) and includes the following components:`);
    bullet("AWS Identity and Access Management (IAM) for user access control and authentication");
    bullet("Amazon S3 for data storage with encryption and access controls");
    bullet("Amazon RDS for relational database services with backup and encryption");
    bullet("AWS CloudTrail for audit logging and activity monitoring");
    bullet("Amazon VPC for network isolation and security group management");
    bullet("AWS GuardDuty for threat detection and monitoring");
    bullet("AWS Security Hub for centralized security posture management");
    bullet("AWS KMS for encryption key management");
    y += 3;

    heading3("Data");
    body(`All data managed, processed, and stored as part of ${company}'s system is classified per the Data Classification Policy. All customer data storage and transmission follow industry-standard encryption. The data is regularly backed up as documented in the Data Backup Policy.`);

    heading2("Applicable Trust Services Criteria");
    body("The following trust services criteria are applicable to this assessment:");
    bullet("Security (CC1-CC9): Protection against unauthorized access");
    bullet("Availability (A1): System availability for operation and use");
    bullet("Processing Integrity (PI1): System processing is complete, valid, and accurate");
    bullet("Confidentiality (C1): Protection of confidential information");
    bullet("Privacy (P1): Personal information is collected, used, and retained appropriately");

    // ══════════════════════════════════════════
    // SECTION IV: CONTROLS & TEST RESULTS
    // ══════════════════════════════════════════

    newPage();
    heading1("Section IV: Trust Services Criteria, Controls & Test Results");

    body(`${company} has designed and implemented controls to ensure that its service commitments and system requirements are consistently met. These controls are mapped to each applicable Trust Services Criteria and organized by criteria area.`);
    y += 3;

    // Group controls by category
    const categories = {};
    data.results.forEach((c) => {
      const prefix = c.id.replace(/[0-9.]/g, "");
      const catMap = {
        CC: "Common Criteria",
        A: "Availability",
        C: "Confidentiality",
        PI: "Processing Integrity",
        P: "Privacy",
      };
      const cat = catMap[prefix] || "Other";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(c);
    });

    Object.entries(categories).forEach(([category, controls]) => {
      checkPage(30);
      heading2(category);

      controls.forEach((control) => {
        checkPage(35);

        // Control header bar
        const statusColor = control.passed ? [34, 197, 94] : [239, 68, 68];
        doc.setFillColor(...statusColor);
        doc.rect(margin, y - 4, 3, 12, "F");

        doc.setFontSize(10);
        doc.setTextColor(20, 30, 50);
        doc.setFont("helvetica", "bold");
        doc.text(`${control.id} — ${control.title}`, margin + 6, y);

        const statusText = control.passed ? "PASS" : "FAIL";
        doc.setFontSize(8);
        doc.setTextColor(...statusColor);
        doc.text(statusText, pw - margin, y, { align: "right" });

        if (control.severity && !control.passed) {
          doc.setTextColor(150);
          doc.text(`(${control.severity})`, pw - margin - 15, y, { align: "right" });
        }
        y += 6;

        // Description
        doc.setFontSize(8.5);
        doc.setTextColor(100);
        doc.setFont("helvetica", "normal");
        const descLines = doc.splitTextToSize(control.description, contentWidth - 10);
        descLines.forEach((line) => {
          checkPage(5);
          doc.text(line, margin + 6, y);
          y += 4;
        });
        y += 2;

        if (!control.passed) {
          // Issues
          if (control.issues?.length > 0) {
            doc.setFontSize(8.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(180, 50, 50);
            checkPage(6);
            doc.text("Findings:", margin + 6, y);
            y += 5;
            doc.setFont("helvetica", "normal");
            control.issues.forEach((issue) => {
              checkPage(6);
              const lines = doc.splitTextToSize(`\u2022 ${issue}`, contentWidth - 16);
              lines.forEach((line) => {
                doc.text(line, margin + 10, y);
                y += 4;
              });
            });
            y += 2;
          }

          // Fix steps
          if (control.fix_steps?.length > 0) {
            doc.setFontSize(8.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(41, 98, 255);
            checkPage(6);
            doc.text("Remediation Steps:", margin + 6, y);
            y += 5;
            doc.setFont("helvetica", "normal");
            doc.setTextColor(60, 60, 60);
            control.fix_steps.forEach((step, i) => {
              checkPage(6);
              const lines = doc.splitTextToSize(`${i + 1}. ${step}`, contentWidth - 16);
              lines.forEach((line) => {
                doc.text(line, margin + 10, y);
                y += 4;
              });
            });
            y += 2;
          }

          // Business impact
          if (control.business_impact) {
            doc.setFontSize(8.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(200, 120, 0);
            checkPage(6);
            doc.text("Business Impact:", margin + 6, y);
            y += 5;
            doc.setFont("helvetica", "normal");
            doc.setTextColor(80);
            const impLines = doc.splitTextToSize(control.business_impact, contentWidth - 16);
            impLines.forEach((line) => {
              checkPage(5);
              doc.text(line, margin + 10, y);
              y += 4;
            });
          }
        }

        y += 6;

        // Separator line
        doc.setDrawColor(230);
        doc.setLineWidth(0.2);
        doc.line(margin, y, pw - margin, y);
        y += 6;
      });
    });

    // ══════════════════════════════════════════
    // SECTION V: CES PRIORITY REMEDIATION PLAN
    // ══════════════════════════════════════════

    if (data.priority_fixes?.length > 0) {
      newPage();
      heading1("Section V: CES Priority Remediation Plan");

      body(`The Compliance Efficiency Score (CES) algorithm calculates the optimal remediation sequence by factoring in danger (severity, exploitability, data exposure, blast radius), cross-framework impact, and projected compliance improvement. Controls are ranked in descending order of CES — highest priority first.`);
      y += 3;

      body(`Current Score: ${data.score}%`);
      y += 2;

      const topFixes = data.priority_fixes.slice(0, 10);
      topFixes.forEach((fix, i) => {
        checkPage(25);

        doc.setFillColor(245, 247, 250);
        doc.roundedRect(margin, y - 4, contentWidth, 18, 2, 2, "F");

        doc.setFontSize(10);
        doc.setTextColor(41, 98, 255);
        doc.setFont("helvetica", "bold");
        doc.text(`#${fix.fix_priority}`, margin + 4, y + 3);

        doc.setTextColor(20, 30, 50);
        doc.text(`${fix.id} — ${fix.title}`, margin + 18, y + 3);

        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.setFont("helvetica", "normal");
        doc.text(`CES: ${fix.crvs_score}`, margin + 4, y + 10);
        doc.text(`Frameworks: ${fix.frameworks_satisfied}`, margin + 40, y + 10);
        doc.text(`Projected Score: ${fix.projected_score_if_fixed}%  (+${fix.score_improvement}%)`, margin + 85, y + 10);

        y += 20;
      });

      if (topFixes.length > 0) {
        y += 5;
        const lastFix = topFixes[topFixes.length - 1];
        body(`By implementing the top ${topFixes.length} remediation items, ${company} can improve its overall compliance score from ${data.score}% to ${lastFix.projected_score_if_fixed}%, representing a ${lastFix.projected_score_if_fixed - data.score} percentage point improvement across all applicable frameworks.`);
      }
    }

    // ══════════════════════════════════════════
    // SECTION VI: CROSS-FRAMEWORK MAPPING
    // ══════════════════════════════════════════

    newPage();
    heading1("Section VI: Cross-Framework Compliance Mapping");

    body("Each control in this assessment maps to equivalent requirements across SOC 2, ISO 27001, and HIPAA. This cross-framework mapping enables organizations to address multiple compliance requirements with a single remediation effort.");
    y += 5;

    // Framework score boxes
    const fwList = [
      { name: "SOC 2 (AICPA TSC)", score: soc2Score, passed: fw.soc2?.passed || 0, total: fw.soc2?.total || 0 },
      { name: "ISO 27001 (Annex A)", score: isoScore, passed: fw.iso27001?.passed || 0, total: fw.iso27001?.total || 0 },
      { name: "HIPAA (Security Rule)", score: hipaaScore, passed: fw.hipaa?.passed || 0, total: fw.hipaa?.total || 0 },
    ];

    fwList.forEach((f) => {
      checkPage(14);
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(margin, y - 4, contentWidth, 12, 2, 2, "F");

      doc.setFontSize(10);
      doc.setTextColor(20, 30, 50);
      doc.setFont("helvetica", "bold");
      doc.text(f.name, margin + 4, y + 3);

      doc.setTextColor(41, 98, 255);
      doc.text(`${f.score}%`, pw - margin - 40, y + 3);

      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.setFont("helvetica", "normal");
      doc.text(`${f.passed}/${f.total} controls`, pw - margin - 10, y + 3, { align: "right" });

      y += 16;
    });

    y += 5;
    body("The cross-framework multiplier in our CES algorithm ensures that controls satisfying multiple frameworks are prioritized higher in the remediation plan, maximizing compliance progress per hour of remediation effort.");

    // ══════════════════════════════════════════
    // SECTION VII: BENCHMARK
    // ══════════════════════════════════════════

    if (data.benchmark) {
      newPage();
      heading1("Section VII: Industry Benchmark Analysis");

      const bm = data.benchmark;
      body(`${company}'s compliance score of ${data.score}% is compared against ${bm.sample_size} companies in the ${bm.industry} sector.`);
      y += 3;

      bullet(`Your Score: ${bm.your_score}%`);
      bullet(`Industry Average: ${bm.industry_avg}%`);
      bullet(`Top Quartile (75th percentile): ${bm.top_quartile}%`);
      bullet(`Your Percentile: ${bm.percentile}th`);
      bullet(`Rating: ${bm.rating}`);
      y += 5;

      body(bm.message);
      y += 3;

      if (bm.common_failures?.length > 0) {
        heading2("Common Industry Failures");
        body(`The most commonly failed controls in the ${bm.industry} sector are:`);
        bm.common_failures.forEach((id) => {
          bullet(id);
        });
      }
    }

    // ══════════════════════════════════════════
    // FINAL PAGE
    // ══════════════════════════════════════════

    newPage();
    y = 80;
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.setFont("helvetica", "italic");
    doc.text("End of Report", pw / 2, y, { align: "center" });
    y += 15;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated by Pramanik on ${date}`, pw / 2, y, { align: "center" });
    y += 8;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("This report is auto-generated and intended as a compliance readiness assessment.", pw / 2, y, { align: "center" });
    y += 5;
    doc.text("It does not constitute a formal SOC 2 Type II auditor's opinion.", pw / 2, y, { align: "center" });

    // Build filename based on active frameworks
    const fwSlug = activeFrameworks.length > 0
      ? activeFrameworks.map(f => f.key.toUpperCase()).join("_")
      : "MULTI";
    doc.save(`${company.replace(/\s+/g, "_")}_${fwSlug}_Compliance_Report.pdf`);
  };

  return (
    <button
      onClick={generatePDF}
      className="btn-primary flex items-center gap-2 text-[13px]"
    >
      <Download className="w-3.5 h-3.5" />
      Export PDF
    </button>
  );
}
