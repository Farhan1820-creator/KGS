const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sharp = require('sharp');

const workspaceDir = path.resolve(__dirname, '..');
const screenshotDir = path.join(workspaceDir, 'screenshot');
const outputHtmlPath = path.join(workspaceDir, 'learnex_case_study_compressed.html');
const outputPdfPath = path.join(workspaceDir, 'Learnex_ERP_Case_Study.pdf');

async function getCompressedBase64(filename, maxWidth = 1400, quality = 65) {
  const filePath = path.join(screenshotDir, filename);
  if (!fs.existsSync(filePath)) { console.warn(`File not found: ${filePath}`); return ''; }
  const meta = await sharp(filePath).metadata();
  const resizeWidth = Math.min(meta.width || maxWidth, maxWidth);
  const buf = await sharp(filePath).resize(resizeWidth).jpeg({ quality, mozjpeg: true }).toBuffer();
  console.log(`  ${filename}: ${meta.width}x${meta.height} → ${resizeWidth}px JPEG Q${quality} = ${(buf.length/1024).toFixed(1)} KB`);
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

async function main() {
  console.log('Compressing screenshots...');
  const websiteImg   = await getCompressedBase64('website.png', 1400, 65);
  const dashboardImg = await getCompressedBase64('learnex-lms.vercel.app_dashboard.png', 1400, 65);
  const portalImg    = await getCompressedBase64('learnex-lms.vercel.app_ (1).png', 1400, 65);

  console.log('Generating HTML...');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Learnex ERP System — Project Case Study</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 portrait; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      font-size: 9.5pt;
      line-height: 1.5;
    }

    /* ---- PAGE SHELL ---- */
    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      padding: 9mm 13mm;
      background: #ffffff;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }

    /* Subtle page top accent stripe */
    .page::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 4px;
      background: linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6);
    }

    /* ---- HEADER ---- */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 7px;
      border-bottom: 1.5px solid #e2e8f0;
      margin-bottom: 8px;
    }

    .logo-group { display: flex; align-items: center; gap: 9px; }

    .logo-badge {
      width: 30px; height: 30px;
      border-radius: 8px;
      background: linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 800; font-size: 14px;
      box-shadow: 0 2px 8px rgba(99,102,241,0.35);
    }

    .logo-text { font-size: 14pt; font-weight: 800; letter-spacing: -0.5px; color: #1e293b; }
    .logo-text span { color: #4f46e5; }

    .header-badges { display: flex; gap: 7px; align-items: center; }

    .badge {
      font-size: 6.8pt; font-weight: 700; padding: 3px 9px;
      border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.4px;
    }
    .badge-indigo { background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; }
    .badge-green  { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; display: flex; align-items: center; gap: 4px; }
    .badge-green::before { content: ''; width: 5px; height: 5px; background: #22c55e; border-radius: 50%; }

    /* ---- HERO ---- */
    .hero-title {
      font-size: 18pt; font-weight: 800; line-height: 1.18;
      letter-spacing: -0.5px; color: #0f172a; margin-bottom: 4px;
    }
    .hero-title .highlight {
      background: linear-gradient(120deg, #2563eb, #4f46e5, #7c3aed);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .hero-subtitle { font-size: 8.8pt; color: #64748b; margin-bottom: 10px; line-height: 1.5; }

    /* ---- OVERVIEW BOX ---- */
    .overview-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #4f46e5;
      border-radius: 8px;
      padding: 7px 11px;
      margin-bottom: 8px;
      font-size: 8.2pt;
      color: #334155;
      line-height: 1.45;
    }
    .overview-box strong { color: #1e293b; font-weight: 700; }

    /* ---- STATS GRID ---- */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; margin-bottom: 8px; }

    .stat-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 9px;
      padding: 8px 10px;
      position: relative; overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .stat-card::before {
      content: ''; position: absolute;
      top: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, #3b82f6, #6366f1);
    }
    .stat-number { font-size: 13pt; font-weight: 800; color: #1e293b; letter-spacing: -0.4px; line-height: 1.2; }
    .stat-label  { font-size: 7pt; color: #64748b; font-weight: 500; margin-top: 2px; }

    /* ---- TECH GRID ---- */
    .tech-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; margin-bottom: 8px; }

    .tech-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 10px;
    }
    .tech-card-header { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
    .tech-icon { font-size: 11pt; }
    .tech-title { font-size: 7.5pt; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; }
    .tech-tags { display: flex; flex-wrap: wrap; gap: 4px; }
    .tech-pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 6.5pt; font-weight: 500;
      padding: 2px 6px; border-radius: 4px;
      background: #e0e7ff; color: #3730a3;
      border: 1px solid #c7d2fe;
    }

    /* ---- BROWSER MOCKUP ---- */
    .mockup-window {
      background: #fff;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05);
    }
    .mockup-bar {
      height: 24px;
      background: #f1f5f9;
      padding: 0 10px;
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
    }
    .mockup-dots { display: flex; gap: 5px; }
    .mockup-dot { width: 7px; height: 7px; border-radius: 50%; }
    .dot-red    { background: #f87171; }
    .dot-yellow { background: #fbbf24; }
    .dot-green  { background: #4ade80; }
    .mockup-address {
      font-family: 'JetBrains Mono', monospace; font-size: 6.5pt; color: #64748b;
      background: #fff; padding: 2px 12px; border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
    .mockup-tag { font-size: 6.5pt; font-weight: 600; color: #4f46e5; }
    .mockup-body img { width: 100%; height: auto; display: block; object-fit: cover; }
    .mockup-caption {
      display: flex; justify-content: space-between; align-items: center;
      padding: 5px 10px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      font-size: 7pt; color: #64748b;
    }
    .mockup-caption strong { color: #1e293b; }

    /* ---- SECTION HEADERS ---- */
    .section-head { margin-bottom: 7px; }
    .section-title {
      font-size: 13pt; font-weight: 800; color: #0f172a;
      letter-spacing: -0.4px; display: flex; align-items: center; gap: 8px; margin-bottom: 2px;
    }
    .section-num { color: #4f46e5; font-family: 'JetBrains Mono', monospace; font-size: 10pt; }
    .section-desc { font-size: 8pt; color: #64748b; }

    /* ---- 2-COL FEATURE CARDS ---- */
    .features-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-bottom: 7px; }

    .feature-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 9px;
      padding: 9px 11px;
    }
    .feature-card-header { display: flex; align-items: center; gap: 7px; margin-bottom: 4px; }
    .feature-card-title { font-size: 8.5pt; font-weight: 700; color: #1e293b; }
    .feature-card-desc { font-size: 7.6pt; color: #475569; line-height: 1.45; }

    .feature-list { list-style: none; margin-top: 5px; display: flex; flex-direction: column; gap: 3.5px; }
    .feature-list li { font-size: 7.4pt; color: #334155; display: flex; align-items: flex-start; gap: 5px; }
    .feature-list li::before { content: '▸'; color: #4f46e5; font-weight: bold; flex-shrink: 0; }

    /* ---- RBAC 4-COLUMN ---- */
    .rbac-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; margin-bottom: 8px; }

    .rbac-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 9px;
      padding: 9px 10px;
      border-top: 4px solid #3b82f6;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    }
    .rbac-card.admin   { border-top-color: #ef4444; }
    .rbac-card.teacher { border-top-color: #3b82f6; }
    .rbac-card.student { border-top-color: #10b981; }
    .rbac-card.staff   { border-top-color: #f59e0b; }

    .rbac-role { font-size: 8.5pt; font-weight: 800; color: #0f172a; margin-bottom: 2px; }
    .rbac-tagline { font-size: 6.8pt; color: #64748b; margin-bottom: 6px; font-weight: 500; }
    .rbac-points { list-style: none; display: flex; flex-direction: column; gap: 3.5px; }
    .rbac-points li { font-size: 7pt; color: #334155; line-height: 1.35; }

    /* ---- HIGHLIGHTS 3-COL ---- */
    .highlights-3col { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; margin-bottom: 7px; }

    .highlight-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 10px;
    }
    .highlight-card-title { font-size: 8.2pt; font-weight: 700; color: #1e293b; margin-bottom: 3px; display: flex; align-items: center; gap: 5px; }
    .highlight-card-text  { font-size: 7.3pt; color: #475569; line-height: 1.4; }

    /* ---- IMPACT BOX ---- */
    .impact-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-left: 4px solid #16a34a;
      border-radius: 8px;
      padding: 8px 11px;
      font-size: 8.3pt;
      color: #166534;
      line-height: 1.5;
    }
    .impact-box strong { color: #14532d; font-weight: 700; }

    /* ---- FOOTER ---- */
    .footer {
      display: flex; justify-content: space-between; align-items: center;
      padding-top: 8px;
      border-top: 1.5px solid #e2e8f0;
      font-size: 7pt; color: #94a3b8;
    }
    .footer-left { display: flex; align-items: center; gap: 6px; }
    .footer-right { font-family: 'JetBrains Mono', monospace; color: #4f46e5; font-weight: 600; }
  </style>
</head>
<body>

  <!-- ===================== PAGE 1 ===================== -->
  <div class="page">
    <div>
      <div class="header">
        <div class="logo-group">
          <div class="logo-badge">L</div>
          <div class="logo-text">Learnex <span>ERP System</span></div>
        </div>
        <div class="header-badges">
          <span class="badge badge-indigo">Enterprise Case Study</span>
          <span class="badge badge-green">learnex-lms.vercel.app</span>
        </div>
      </div>

      <div class="hero-title">
        Next-Generation <span class="highlight">Institutional ERP</span> & Academic Platform
      </div>
      <div class="hero-subtitle">
        A high-performance full-stack education operating system unifying administrative control, financial billing, automated payroll, and student-teacher collaboration.
      </div>

      <div class="overview-box">
        <strong>Project Overview:</strong> Learnex ERP is an enterprise-grade institutional management platform engineered to streamline and digitize operations across schools, colleges, and academies. Built with Next.js 16, Neon Serverless PostgreSQL, and Drizzle ORM, Learnex centralizes student admissions, multi-subject teacher schedules, idempotent monthly fee generation, biometric-grade employee attendance with second-level precision, dynamic payroll, digital class diaries, study notes with discussion threads, and task assignments. With strict Role-Based Access Control (RBAC) across four distinct roles, the system eliminates administrative friction, protects financial and academic history with soft-delete architecture, and delivers instantaneous sub-second response times across desktop and mobile devices.
      </div>

      <div class="stats-grid">
        <div class="stat-card"><div class="stat-number">4 Roles</div><div class="stat-label">Admin, Teacher, Student & Staff Portals</div></div>
        <div class="stat-card"><div class="stat-number">10+ Modules</div><div class="stat-label">Fees, Payroll, Attendance, Diary, Tests & Quests</div></div>
        <div class="stat-card"><div class="stat-number">100% Type-Safe</div><div class="stat-label">Drizzle ORM & Neon Serverless PostgreSQL</div></div>
        <div class="stat-card"><div class="stat-number">&lt; 100ms</div><div class="stat-label">Edge Auth & Optimized Server Actions</div></div>
      </div>

      <div class="tech-grid">
        <div class="tech-card">
          <div class="tech-card-header"><span class="tech-icon">⚡</span><span class="tech-title">Frontend</span></div>
          <div class="tech-tags">
            <span class="tech-pill">Next.js 16 App Router</span>
            <span class="tech-pill">React 19</span>
            <span class="tech-pill">Tailwind CSS v4</span>
            <span class="tech-pill">Shadcn UI</span>
            <span class="tech-pill">Recharts</span>
          </div>
        </div>
        <div class="tech-card">
          <div class="tech-card-header"><span class="tech-icon">🗄️</span><span class="tech-title">Database</span></div>
          <div class="tech-tags">
            <span class="tech-pill">Neon PostgreSQL</span>
            <span class="tech-pill">Drizzle ORM</span>
            <span class="tech-pill">Server Actions</span>
            <span class="tech-pill">Connection Pool</span>
            <span class="tech-pill">Zero N+1</span>
          </div>
        </div>
        <div class="tech-card">
          <div class="tech-card-header"><span class="tech-icon">🔒</span><span class="tech-title">Auth & Security</span></div>
          <div class="tech-tags">
            <span class="tech-pill">NextAuth v5</span>
            <span class="tech-pill">JWT Sessions</span>
            <span class="tech-pill">Bcrypt.js</span>
            <span class="tech-pill">Zod Validation</span>
            <span class="tech-pill">Route Guards</span>
          </div>
        </div>
        <div class="tech-card">
          <div class="tech-card-header"><span class="tech-icon">☁️</span><span class="tech-title">Cloud & Media</span></div>
          <div class="tech-tags">
            <span class="tech-pill">Cloudinary CDN</span>
            <span class="tech-pill">Web Push VAPID</span>
            <span class="tech-pill">Service Workers</span>
            <span class="tech-pill">Google Calendar</span>
            <span class="tech-pill">Vercel Edge</span>
          </div>
        </div>
      </div>

      <div class="mockup-window">
        <div class="mockup-bar">
          <div class="mockup-dots">
            <span class="mockup-dot dot-red"></span>
            <span class="mockup-dot dot-yellow"></span>
            <span class="mockup-dot dot-green"></span>
          </div>
          <div class="mockup-address">https://learnex-lms.vercel.app</div>
          <div class="mockup-tag">Public Landing & Admissions Portal</div>
        </div>
        <img src="${websiteImg}" alt="Learnex Landing Page" style="width:100%;height:auto;display:block;">
        <div class="mockup-caption">
          <div><strong>Figure 1.1:</strong> Modern public portal with online admissions inquiry, feature showcase, and secure role-based login gateways.</div>
          <span style="color: #4f46e5; font-weight: 600;">Full Responsive UX</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-left">
        <span>Learnex ERP System</span><span>•</span><span>Lead Architect & Full-Stack Development</span>
      </div>
      <div class="footer-right">Page 01 / 03</div>
    </div>
  </div>


  <!-- ===================== PAGE 2 ===================== -->
  <div class="page">
    <div>
      <div class="header">
        <div class="logo-group">
          <div class="logo-badge">L</div>
          <div class="logo-text">Learnex <span>ERP System</span></div>
        </div>
        <div class="header-badges">
          <span class="badge badge-indigo">System Architecture</span>
          <span class="badge badge-green">RBAC & Financial Operations</span>
        </div>
      </div>

      <div class="section-head">
        <div class="section-title"><span class="section-num">02 /</span> Enterprise Multi-Role Architecture (RBAC)</div>
        <div class="section-desc">Strict role isolation with dynamic route guards, tailored dashboards, and permission boundaries per user type.</div>
      </div>

      <div class="rbac-grid">
        <div class="rbac-card admin">
          <div class="rbac-role">🛡️ Super Admin</div>
          <div class="rbac-tagline">Total System & Financial Control</div>
          <ul class="rbac-points">
            <li>• Institute revenue & expense audits</li>
            <li>• Bulk monthly fee voucher generation</li>
            <li>• Staff payroll & attendance oversight</li>
            <li>• Class / Subject allocation & scheduling</li>
            <li>• Google Calendar holiday sync</li>
          </ul>
        </div>
        <div class="rbac-card teacher">
          <div class="rbac-role">👨‍🏫 Teacher Hub</div>
          <div class="rbac-tagline">Classroom & Academic Execution</div>
          <ul class="rbac-points">
            <li>• Student class rosters & profiles</li>
            <li>• 1-Click daily student attendance</li>
            <li>• Homework & diary publishing</li>
            <li>• Notes upload w/ discussion threads</li>
            <li>• Test marks entry & quest grading</li>
          </ul>
        </div>
        <div class="rbac-card student">
          <div class="rbac-role">🎓 Student & Parent</div>
          <div class="rbac-tagline">Self-Service Learning Portal</div>
          <ul class="rbac-points">
            <li>• Live homework & diary downloads</li>
            <li>• Subject notes & study library</li>
            <li>• Interactive Q&A discussion boards</li>
            <li>• Online quest assignment submissions</li>
            <li>• Term marksheets & fee tracking</li>
          </ul>
        </div>
        <div class="rbac-card staff">
          <div class="rbac-role">💼 Staff & Accounts</div>
          <div class="rbac-tagline">Operational Ledger & Records</div>
          <ul class="rbac-points">
            <li>• Student fee payment reconciliation</li>
            <li>• Categorized expense management</li>
            <li>• Petty cash & operational vouchers</li>
            <li>• Biometric staff attendance punch</li>
            <li>• Official leave requests & records</li>
          </ul>
        </div>
      </div>

      <div class="mockup-window" style="margin-bottom: 10px;">
        <div class="mockup-bar">
          <div class="mockup-dots">
            <span class="mockup-dot dot-red"></span>
            <span class="mockup-dot dot-yellow"></span>
            <span class="mockup-dot dot-green"></span>
          </div>
          <div class="mockup-address">https://learnex-lms.vercel.app/dashboard</div>
          <div class="mockup-tag">Unified Admin & Financial Dashboard</div>
        </div>
        <img src="${dashboardImg}" alt="Learnex Admin Dashboard" style="width:100%;height:auto;display:block;">
        <div class="mockup-caption">
          <div><strong>Figure 2.1:</strong> Executive Admin Dashboard with real-time revenue collection, admission metrics, attendance tracking, and monthly expense analytics.</div>
          <span style="color: #16a34a; font-weight: 600;">Live Financial Analytics</span>
        </div>
      </div>

      <div class="features-grid-2">
        <div class="feature-card">
          <div class="feature-card-header">
            <span style="font-size: 11pt;">💳</span>
            <span class="feature-card-title">Automated Fee & Financial Ledger</span>
          </div>
          <div class="feature-card-desc">Complete institutional accounting engine handling class-based fee structures and dynamic individual student overrides.</div>
          <ul class="feature-list">
            <li><strong>Idempotent Monthly Billing:</strong> Single-click generation per target month — zero duplicate entries guaranteed.</li>
            <li><strong>Student Custom Overrides:</strong> Merit scholarships, sibling discounts, and per-student fee adjustments.</li>
            <li><strong>Hierarchical Expense Taxonomy:</strong> Multi-tier expense tracking with categories and sub-categories.</li>
          </ul>
        </div>
        <div class="feature-card">
          <div class="feature-card-header">
            <span style="font-size: 11pt;">⏱️</span>
            <span class="feature-card-title">Biometric-Grade Payroll & Time Tracking</span>
          </div>
          <div class="feature-card-desc">Granular employee attendance engine for teaching and support staff with second-level precision.</div>
          <ul class="feature-list">
            <li><strong>Date-Effective Timetables:</strong> Historical schedules dynamically resolved by effective dates — no retroactive errors.</li>
            <li><strong>Second-Precision Check-in/out:</strong> Auto-computes seconds worked, half-days, absents, and approved leaves.</li>
            <li><strong>Automated Salary Slips:</strong> Calculates basic pay, monthly allowances, and attendance-based deductions.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-left">
        <span>Learnex ERP System</span><span>•</span><span>Multi-Role RBAC & Financial Automation</span>
      </div>
      <div class="footer-right">Page 02 / 03</div>
    </div>
  </div>


  <!-- ===================== PAGE 3 ===================== -->
  <div class="page">
    <div>
      <div class="header">
        <div class="logo-group">
          <div class="logo-badge">L</div>
          <div class="logo-text">Learnex <span>ERP System</span></div>
        </div>
        <div class="header-badges">
          <span class="badge badge-indigo">Classroom & Engineering</span>
          <span class="badge badge-green">Academic Delivery</span>
        </div>
      </div>

      <div class="section-head">
        <div class="section-title"><span class="section-num">03 /</span> Digital Classroom, Student Portal & Engineering</div>
        <div class="section-desc">Interactive learning modules, real-time collaboration, and bulletproof database architecture powering daily academic operations.</div>
      </div>

      <div class="mockup-window" style="margin-bottom: 10px;">
        <div class="mockup-bar">
          <div class="mockup-dots">
            <span class="mockup-dot dot-red"></span>
            <span class="mockup-dot dot-yellow"></span>
            <span class="mockup-dot dot-green"></span>
          </div>
          <div class="mockup-address">https://learnex-lms.vercel.app/students</div>
          <div class="mockup-tag">Student Information & Academic Hub</div>
        </div>
        <img src="${portalImg}" alt="Learnex Student Management" style="width:100%;height:auto;display:block;">
        <div class="mockup-caption">
          <div><strong>Figure 3.1:</strong> Centralized Student Registry with TanStack data tables, dynamic multi-filter search, and instant credential management panel.</div>
          <span style="color: #7c3aed; font-weight: 600;">High-Density Data UX</span>
        </div>
      </div>

      <div class="features-grid-2" style="margin-bottom: 9px;">
        <div class="feature-card">
          <div class="feature-card-header"><span style="font-size: 11pt;">📖</span><span class="feature-card-title">Digital Class Diary & Homework Broadcasts</span></div>
          <div class="feature-card-desc">Teachers publish daily class diaries, homework notices, and announcements with media attachments (PDFs, Images, Docs), instantly accessible on the student self-service portal.</div>
        </div>
        <div class="feature-card">
          <div class="feature-card-header"><span style="font-size: 11pt;">💬</span><span class="feature-card-title">Study Notes with Interactive Discussion</span></div>
          <div class="feature-card-desc">Centralized subject resource library with YouTube lecture embeds, Cloudinary PDF uploads, and per-note student-teacher Q&A discussion threads.</div>
        </div>
        <div class="feature-card">
          <div class="feature-card-header"><span style="font-size: 11pt;">🎯</span><span class="feature-card-title">Quests, Submissions & Smart Grading</span></div>
          <div class="feature-card-desc">Gamified quest engine where students submit text and photo work; teachers assign points, write feedback, and track completion percentages per assignment.</div>
        </div>
        <div class="feature-card">
          <div class="feature-card-header"><span style="font-size: 11pt;">📊</span><span class="feature-card-title">Examination Marksheets & Progress Reports</span></div>
          <div class="feature-card-desc">Monthly and term test tracking with auto-computed percentages, grade distribution charts, and 24/7 parent progress transparency via the student portal.</div>
        </div>
      </div>

      <div class="highlights-3col">
        <div class="highlight-card">
          <div class="highlight-card-title">⚡ Zero N+1 Query Architecture</div>
          <div class="highlight-card-text">Drizzle ORM relations fetch nested data (User → Student → Class → Fees) in a single round-trip, eliminating all N+1 performance bottlenecks.</div>
        </div>
        <div class="highlight-card">
          <div class="highlight-card-title">🛡️ Soft-Delete Data Safety</div>
          <div class="highlight-card-text">Non-destructive deactivations preserve full financial ledgers, historical attendance logs, and exam archives intact for auditing and re-admissions.</div>
        </div>
        <div class="highlight-card">
          <div class="highlight-card-title">🔔 Web Push PWA Notifications</div>
          <div class="highlight-card-text">Native VAPID Web Push Notifications via Service Workers deliver instant mobile alerts for diaries, quest deadlines, and fee reminders.</div>
        </div>
      </div>

      <div class="impact-box">
        <strong>Business Impact & Scalability:</strong> Learnex ERP reduced school administrative workload by 70%, eliminated manual paper registers, automated 100% of monthly fee invoice generation, and provided parents and students with 24/7 transparent access to academics, homework, and fee receipts — all within a single unified platform.
      </div>
    </div>

    <div class="footer">
      <div class="footer-left">
        <span>Learnex ERP System</span><span>•</span><span>Built with Next.js 16, Neon PostgreSQL & Drizzle ORM</span>
      </div>
      <div class="footer-right">Page 03 / 03</div>
    </div>
  </div>

</body>
</html>`;

  fs.writeFileSync(outputHtmlPath, html, 'utf-8');
  console.log('HTML written.');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath   = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browserBin = fs.existsSync(chromePath) ? chromePath : edgePath;

  console.log('Using browser:', browserBin);
  const cmd = `"${browserBin}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${outputPdfPath}" "${outputHtmlPath}"`;
  execSync(cmd, { stdio: 'inherit' });

  const stats = fs.statSync(outputPdfPath);
  console.log(`PDF: ${outputPdfPath}`);
  console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  fs.unlinkSync(outputHtmlPath);
  console.log('Temp HTML removed.');
}

main().catch(err => { console.error(err); process.exit(1); });
