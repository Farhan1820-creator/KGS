const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspaceDir = path.resolve(__dirname, '..');
const screenshotDir = path.join(workspaceDir, 'screenshot');
const outputHtmlPath = path.join(workspaceDir, 'learnex_case_study.html');
const outputPdfPath = path.join(workspaceDir, 'Learnex_ERP_Case_Study.pdf');

// Helper to convert image to base64
function getBase64Image(filename) {
  const filePath = path.join(screenshotDir, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return '';
  }
  const ext = path.extname(filename).slice(1);
  const data = fs.readFileSync(filePath);
  return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${data.toString('base64')}`;
}

const websiteImg = getBase64Image('website.png');
const dashboardImg = getBase64Image('learnex-lms.vercel.app_dashboard.png');
const portalImg = getBase64Image('learnex-lms.vercel.app_ (1).png');
const dashboard2Img = getBase64Image('learnex-lms.vercel.app_dashboard (1).png');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Learnex ERP System — Project Case Study</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #0b0f17;
      color: #e2e8f0;
      font-size: 9.5pt;
      line-height: 1.45;
    }

    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      padding: 12mm 14mm;
      position: relative;
      background: radial-gradient(circle at 85% 15%, rgba(30, 58, 138, 0.22) 0%, rgba(11, 15, 23, 1) 60%),
                  radial-gradient(circle at 15% 85%, rgba(67, 56, 202, 0.18) 0%, rgba(11, 15, 23, 1) 70%),
                  #0b0f17;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Top Brand Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      margin-bottom: 10px;
    }

    .logo-group {
      display: flex;
      align-items: center;
      gap: 9px;
    }

    .logo-badge {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      background: linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 16px rgba(99, 102, 241, 0.45);
      color: #fff;
      font-weight: 800;
      font-size: 14px;
    }

    .logo-text {
      font-size: 13.5pt;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #ffffff;
    }

    .logo-text span {
      background: linear-gradient(90deg, #60a5fa, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .header-badges {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .badge {
      font-size: 7pt;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-primary {
      background: rgba(99, 102, 241, 0.18);
      color: #a5b4fc;
      border: 1px solid rgba(99, 102, 241, 0.35);
    }

    .badge-live {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .badge-live::before {
      content: '';
      width: 5px;
      height: 5px;
      background: #10b981;
      border-radius: 50%;
      box-shadow: 0 0 6px #10b981;
    }

    /* Hero / Title Section */
    .hero-title {
      font-size: 19pt;
      font-weight: 800;
      line-height: 1.18;
      letter-spacing: -0.6px;
      color: #f8fafc;
      margin-bottom: 4px;
    }

    .hero-title .highlight {
      background: linear-gradient(120deg, #38bdf8, #818cf8, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-subtitle {
      font-size: 9pt;
      color: #94a3b8;
      margin-bottom: 9px;
    }

    /* Paragraph Box */
    .overview-box {
      background: rgba(15, 23, 42, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-left: 3px solid #6366f1;
      border-radius: 8px;
      padding: 9px 12px;
      margin-bottom: 10px;
      font-size: 8.8pt;
      color: #cbd5e1;
      line-height: 1.45;
    }

    .overview-box strong {
      color: #f1f5f9;
      font-weight: 700;
    }

    /* Metrics Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 10px;
    }

    .stat-card {
      background: rgba(30, 41, 59, 0.45);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      padding: 7px 9px;
      position: relative;
      overflow: hidden;
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    }

    .stat-number {
      font-size: 14pt;
      font-weight: 800;
      color: #f8fafc;
      letter-spacing: -0.5px;
      line-height: 1.1;
    }

    .stat-label {
      font-size: 7.2pt;
      color: #94a3b8;
      font-weight: 500;
      margin-top: 2px;
    }

    /* Tech Stack Cards */
    .tech-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 10px;
    }

    .tech-card {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 8px;
      padding: 8px 10px;
    }

    .tech-card-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 5px;
    }

    .tech-icon {
      font-size: 11pt;
    }

    .tech-title {
      font-size: 8pt;
      font-weight: 700;
      color: #e2e8f0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .tech-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .tech-pill {
      font-family: 'JetBrains Mono', monospace;
      font-size: 6.8pt;
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(51, 65, 85, 0.5);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    /* Browser Mockup Window */
    .mockup-window {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 9px;
      overflow: hidden;
      box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.75), 0 0 25px rgba(99, 102, 241, 0.12);
      position: relative;
    }

    .mockup-bar {
      height: 22px;
      background: #1e293b;
      padding: 0 9px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .mockup-dots {
      display: flex;
      gap: 5px;
    }

    .mockup-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }

    .dot-red { background: #ef4444; }
    .dot-yellow { background: #f59e0b; }
    .dot-green { background: #10b981; }

    .mockup-address {
      font-family: 'JetBrains Mono', monospace;
      font-size: 6.8pt;
      color: #94a3b8;
      background: rgba(15, 23, 42, 0.8);
      padding: 1px 12px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .mockup-tag {
      font-size: 6.8pt;
      font-weight: 600;
      color: #a5b4fc;
    }

    .mockup-body {
      width: 100%;
      background: #000;
      display: block;
    }

    .mockup-body img {
      width: 100%;
      height: auto;
      display: block;
      object-fit: cover;
    }

    .mockup-caption {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 9px;
      background: rgba(15, 23, 42, 0.95);
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 7.2pt;
      color: #94a3b8;
    }

    .mockup-caption strong {
      color: #f1f5f9;
    }

    /* Section Divider & Headers */
    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .section-title {
      font-size: 13pt;
      font-weight: 800;
      color: #f8fafc;
      letter-spacing: -0.4px;
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .section-num {
      color: #6366f1;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10pt;
    }

    .section-desc {
      font-size: 8pt;
      color: #94a3b8;
    }

    /* Feature Cards & Grids */
    .features-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 9px;
    }

    .feature-card {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 9px 11px;
    }

    .feature-card-header {
      display: flex;
      align-items: center;
      gap: 7px;
      margin-bottom: 4px;
    }

    .feature-card-title {
      font-size: 8.8pt;
      font-weight: 700;
      color: #f1f5f9;
    }

    .feature-card-desc {
      font-size: 7.8pt;
      color: #94a3b8;
      line-height: 1.4;
    }

    .feature-list {
      list-style: none;
      margin-top: 5px;
      display: flex;
      flex-direction: column;
      gap: 3.5px;
    }

    .feature-list li {
      font-size: 7.6pt;
      color: #cbd5e1;
      display: flex;
      align-items: flex-start;
      gap: 5px;
    }

    .feature-list li::before {
      content: '▸';
      color: #60a5fa;
      font-weight: bold;
      flex-shrink: 0;
    }

    /* RBAC 4 Column Grid */
    .rbac-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 7px;
      margin-bottom: 9px;
    }

    .rbac-card {
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 8px 9px;
      border-top: 3px solid #3b82f6;
    }

    .rbac-card.admin { border-top-color: #ef4444; }
    .rbac-card.teacher { border-top-color: #3b82f6; }
    .rbac-card.student { border-top-color: #10b981; }
    .rbac-card.staff { border-top-color: #f59e0b; }

    .rbac-role {
      font-size: 8.5pt;
      font-weight: 800;
      color: #f8fafc;
      margin-bottom: 2px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .rbac-tagline {
      font-size: 6.8pt;
      color: #94a3b8;
      margin-bottom: 5px;
      font-weight: 500;
    }

    .rbac-points {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .rbac-points li {
      font-size: 7pt;
      color: #cbd5e1;
      line-height: 1.3;
    }

    /* 3-Column Highlights Grid on Page 3 */
    .highlights-3col {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 7px;
      margin-bottom: 9px;
    }

    .highlight-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 7px;
      padding: 7px 9px;
    }

    .highlight-card-title {
      font-size: 8.2pt;
      font-weight: 700;
      color: #e2e8f0;
      margin-bottom: 3px;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .highlight-card-text {
      font-size: 7.3pt;
      color: #94a3b8;
      line-height: 1.38;
    }

    /* Footer */
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 7px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 7.2pt;
      color: #64748b;
    }

    .footer-left {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .footer-right {
      font-family: 'JetBrains Mono', monospace;
      color: #94a3b8;
      font-weight: 500;
    }
  </style>
</head>
<body>

  <!-- ==================== PAGE 1 ==================== -->
  <div class="page">
    <div>
      <!-- Header -->
      <div class="header">
        <div class="logo-group">
          <div class="logo-badge">L</div>
          <div class="logo-text">Learnex <span>ERP System</span></div>
        </div>
        <div class="header-badges">
          <span class="badge badge-primary">Enterprise Case Study</span>
          <span class="badge badge-live">learnex-lms.vercel.app</span>
        </div>
      </div>

      <!-- Hero Header -->
      <div class="hero-title">
        Next-Generation <span class="highlight">Institutional ERP</span> & Academic Platform
      </div>
      <div class="hero-subtitle">
        A high-performance full-stack education operating system unifying administrative control, financial billing, automated payroll, and student-teacher collaboration.
      </div>

      <!-- Project Overview (1 Paragraph) -->
      <div class="overview-box">
        <strong>Project Overview:</strong> Learnex ERP is an enterprise-grade institutional management platform engineered to streamline and digitize operations across schools, colleges, and academies. Built with Next.js 16, Neon Serverless PostgreSQL, and Drizzle ORM, Learnex centralizes student admissions, multi-subject teacher schedules, idempotent monthly fee generation, biometric-grade employee attendance with second-level precision, dynamic payroll, digital class diaries, study notes with discussion threads, and task assignments. With strict Role-Based Access Control (RBAC) across four distinct roles, the system eliminates administrative friction, protects financial and academic history with soft-delete architecture, and delivers instantaneous sub-second response times across desktop and mobile devices.
      </div>

      <!-- Key Performance Metrics Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">4 Dynamic Roles</div>
          <div class="stat-label">Admin, Teacher, Student & Staff Portals</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">10+ Core Modules</div>
          <div class="stat-label">Fees, Payroll, Attendance, Diary, Tests, Quests</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">100% Type-Safe</div>
          <div class="stat-label">Drizzle ORM & Neon Serverless PostgreSQL</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">&lt; 100ms Latency</div>
          <div class="stat-label">Optimized Server Actions & Edge Middleware Auth</div>
        </div>
      </div>

      <!-- Technology Stack -->
      <div class="tech-grid">
        <div class="tech-card">
          <div class="tech-card-header">
            <span class="tech-icon">⚡</span>
            <span class="tech-title">Frontend Architecture</span>
          </div>
          <div class="tech-tags">
            <span class="tech-pill">Next.js 16 (App Router)</span>
            <span class="tech-pill">React 19</span>
            <span class="tech-pill">Tailwind CSS</span>
            <span class="tech-pill">Shadcn UI & Lucide</span>
            <span class="tech-pill">Recharts Data Viz</span>
          </div>
        </div>

        <div class="tech-card">
          <div class="tech-card-header">
            <span class="tech-icon">🗄️</span>
            <span class="tech-title">Database & Backend</span>
          </div>
          <div class="tech-tags">
            <span class="tech-pill">Neon PostgreSQL</span>
            <span class="tech-pill">Drizzle ORM</span>
            <span class="tech-pill">Server Actions</span>
            <span class="tech-pill">Connection Pooling</span>
            <span class="tech-pill">Zero N+1 Queries</span>
          </div>
        </div>

        <div class="tech-card">
          <div class="tech-card-header">
            <span class="tech-icon">🔒</span>
            <span class="tech-title">Auth & Security</span>
          </div>
          <div class="tech-tags">
            <span class="tech-pill">NextAuth v5 (Beta 32)</span>
            <span class="tech-pill">JWT Session Auth</span>
            <span class="tech-pill">Bcrypt.js Hashing</span>
            <span class="tech-pill">Zod Schema Validation</span>
            <span class="tech-pill">Route Protection</span>
          </div>
        </div>

        <div class="tech-card">
          <div class="tech-card-header">
            <span class="tech-icon">🚀</span>
            <span class="tech-title">Media & Services</span>
          </div>
          <div class="tech-tags">
            <span class="tech-pill">Cloudinary Asset CDN</span>
            <span class="tech-pill">Web Push API</span>
            <span class="tech-pill">Service Workers</span>
            <span class="tech-pill">Google Calendar Sync</span>
            <span class="tech-pill">Vercel Edge</span>
          </div>
        </div>
      </div>

      <!-- Screenshot 1: Landing Page & Public Portal -->
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
        <div class="mockup-body" style="max-height: 185px; overflow: hidden;">
          <img src="${websiteImg}" alt="Learnex Landing Page" style="object-position: top center; width: 100%;">
        </div>
        <div class="mockup-caption">
          <div><strong>Figure 1.1:</strong> Modern public web portal with instant online admissions inquiry, feature showcase, and secure role login gateways.</div>
          <span style="color: #60a5fa; font-weight: 600;">Full Responsive UX</span>
        </div>
      </div>
    </div>

    <!-- Page 1 Footer -->
    <div class="footer">
      <div class="footer-left">
        <span>Learnex ERP System</span>
        <span>•</span>
        <span>Lead Architect & Full-Stack Development</span>
      </div>
      <div class="footer-right">Page 01 / 03</div>
    </div>
  </div>


  <!-- ==================== PAGE 2 ==================== -->
  <div class="page">
    <div>
      <!-- Header -->
      <div class="header">
        <div class="logo-group">
          <div class="logo-badge">L</div>
          <div class="logo-text">Learnex <span>ERP System</span></div>
        </div>
        <div class="header-badges">
          <span class="badge badge-primary">System Architecture</span>
          <span class="badge badge-live">RBAC & Financial Operations</span>
        </div>
      </div>

      <!-- Section Title -->
      <div class="section-head">
        <div>
          <div class="section-title"><span class="section-num">02 /</span> Enterprise Multi-Role Architecture (RBAC)</div>
          <div class="section-desc">Strict role isolation with dynamic route guards, tailored dashboards, and permission boundaries.</div>
        </div>
      </div>

      <!-- 4 Role RBAC Breakdown Grid -->
      <div class="rbac-grid">
        <div class="rbac-card admin">
          <div class="rbac-role">🛡️ Super Admin</div>
          <div class="rbac-tagline">Total System & Financial Control</div>
          <ul class="rbac-points">
            <li>• Institute revenue & expense audits</li>
            <li>• Bulk monthly fee voucher generation</li>
            <li>• Staff payroll & attendance oversight</li>
            <li>• Class/Subject allocation & schedules</li>
            <li>• Google Calendar holiday synchronization</li>
          </ul>
        </div>

        <div class="rbac-card teacher">
          <div class="rbac-role">👨‍🏫 Teacher Hub</div>
          <div class="rbac-tagline">Classroom & Academic Execution</div>
          <ul class="rbac-points">
            <li>• Student class rosters & profiles</li>
            <li>• 1-Click daily student attendance</li>
            <li>• Homework & class diary publishing</li>
            <li>• Notes upload w/ discussion threads</li>
            <li>• Test marks entry & quest grading</li>
          </ul>
        </div>

        <div class="rbac-card student">
          <div class="rbac-role">🎓 Student & Parent</div>
          <div class="rbac-tagline">Self-Service Learning Portal</div>
          <ul class="rbac-points">
            <li>• Live homework & diary downloads</li>
            <li>• Subject notes & study material library</li>
            <li>• Interactive Q&A discussion boards</li>
            <li>• Online quest assignment submissions</li>
            <li>• Term marksheets & fee status tracking</li>
          </ul>
        </div>

        <div class="rbac-card staff">
          <div class="rbac-role">💼 Staff & Accounts</div>
          <div class="rbac-tagline">Operational Ledger & Logs</div>
          <ul class="rbac-points">
            <li>• Student fee payment reconciliation</li>
            <li>• Categorized expense management</li>
            <li>• Petty cash & operational vouchers</li>
            <li>• Biometric staff attendance punch</li>
            <li>• Official leave requests & records</li>
          </ul>
        </div>
      </div>

      <!-- Screenshot 2: Admin Dashboard & Analytics -->
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
        <div class="mockup-body" style="max-height: 200px; overflow: hidden;">
          <img src="${dashboardImg}" alt="Learnex Admin Dashboard" style="object-position: top center; width: 100%;">
        </div>
        <div class="mockup-caption">
          <div><strong>Figure 2.1:</strong> Executive Admin Dashboard presenting real-time revenue collection, student admission metrics, attendance tracking, and monthly expense distribution.</div>
          <span style="color: #34d399; font-weight: 600;">Live Financial Analytics</span>
        </div>
      </div>

      <!-- Core Operational Engines (2-Column Deep Dive) -->
      <div class="features-grid-2">
        <div class="feature-card">
          <div class="feature-card-header">
            <span style="font-size: 11pt;">💳</span>
            <span class="feature-card-title">Automated Fee & Financial Ledger</span>
          </div>
          <div class="feature-card-desc">
            Complete institutional accounting engine handling class-based fee structures and dynamic individual student overrides.
          </div>
          <ul class="feature-list">
            <li><strong>Idempotent Monthly Billing:</strong> Single-click generation for any target month (<code>YYYY-MM</code>) ensuring zero duplicate entries.</li>
            <li><strong>Student Custom Overrides:</strong> Support for merit scholarships, sibling discounts, and individual fee adjustments.</li>
            <li><strong>Hierarchical Expense Taxonomy:</strong> Multi-tier expense tracking with categories (Utilities, Maintenance) and sub-categories.</li>
          </ul>
        </div>

        <div class="feature-card">
          <div class="feature-card-header">
            <span style="font-size: 11pt;">⏱️</span>
            <span class="feature-card-title">Biometric-Grade Payroll & Time Tracking</span>
          </div>
          <div class="feature-card-desc">
            Granular employee attendance engine tracking teaching and support staff with second-level exactness.
          </div>
          <ul class="feature-list">
            <li><strong>Date-Effective Timetables:</strong> Historical work schedules dynamically calculated by active effective dates.</li>
            <li><strong>Second-Precision Check-in/out:</strong> Auto-computes total working seconds, half-days, absents, and approved leaves.</li>
            <li><strong>Automated Salary Slip Generation:</strong> Calculates basic pay, fixed monthly allowances, and attendance-based deductions.</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Page 2 Footer -->
    <div class="footer">
      <div class="footer-left">
        <span>Learnex ERP System</span>
        <span>•</span>
        <span>Multi-Role RBAC & Financial Automation</span>
      </div>
      <div class="footer-right">Page 02 / 03</div>
    </div>
  </div>


  <!-- ==================== PAGE 3 ==================== -->
  <div class="page">
    <div>
      <!-- Header -->
      <div class="header">
        <div class="logo-group">
          <div class="logo-badge">L</div>
          <div class="logo-text">Learnex <span>ERP System</span></div>
        </div>
        <div class="header-badges">
          <span class="badge badge-primary">Classroom & Tech Stack</span>
          <span class="badge badge-live">Academic Delivery</span>
        </div>
      </div>

      <!-- Section Title -->
      <div class="section-head">
        <div>
          <div class="section-title"><span class="section-num">03 /</span> Digital Classroom, Student Portal & Engineering</div>
          <div class="section-desc">Interactive learning modules, real-time collaboration, and bulletproof database architecture.</div>
        </div>
      </div>

      <!-- Screenshot 3: Student Portal & Data Table Management -->
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
        <div class="mockup-body" style="max-height: 175px; overflow: hidden;">
          <img src="${portalImg}" alt="Learnex Student Management" style="object-position: top center; width: 100%;">
        </div>
        <div class="mockup-caption">
          <div><strong>Figure 3.1:</strong> Centralized Student Registry with TanStack data tables, dynamic search, multi-filter by class/section, and instant credential management.</div>
          <span style="color: #c084fc; font-weight: 600;">High-Density Data UX</span>
        </div>
      </div>

      <!-- Classroom & Academic Features Grid (4 Cards) -->
      <div class="features-grid-2" style="margin-bottom: 9px;">
        <div class="feature-card">
          <div class="feature-card-header">
            <span style="font-size: 11pt;">📖</span>
            <span class="feature-card-title">Digital Class Diary & Homework Broadcasts</span>
          </div>
          <div class="feature-card-desc">
            Teachers publish daily class diaries, homework assignments, and notices with media attachments (PDFs, Images, Documents), instantly accessible on the student portal.
          </div>
        </div>

        <div class="feature-card">
          <div class="feature-card-header">
            <span style="font-size: 11pt;">💬</span>
            <span class="feature-card-title">Study Notes with Interactive Discussion</span>
          </div>
          <div class="feature-card-desc">
            Centralized subject resource repository with YouTube lectures, Cloudinary PDF embeds, and real-time student-teacher Q&A discussion threads.
          </div>
        </div>

        <div class="feature-card">
          <div class="feature-card-header">
            <span style="font-size: 11pt;">🎯</span>
            <span class="feature-card-title">Quests, Digital Submissions & Grading</span>
          </div>
          <div class="feature-card-desc">
            Gamified homework quest engine allowing students to submit text and photo work, while teachers review, assign points, and provide constructive feedback.
          </div>
        </div>

        <div class="feature-card">
          <div class="feature-card-header">
            <span style="font-size: 11pt;">📊</span>
            <span class="feature-card-title">Examination Marksheets & Progress Reports</span>
          </div>
          <div class="feature-card-desc">
            Monthly test records and term marksheets with automatic percentage computation, grade distribution analytics, and instant parent progress tracking.
          </div>
        </div>
      </div>

      <!-- Database & Architecture Highlights (3 Columns) -->
      <div class="highlights-3col">
        <div class="highlight-card">
          <div class="highlight-card-title">⚡ Zero N+1 Queries</div>
          <div class="highlight-card-text">
            Drizzle ORM relations fetch nested data (User → Student → Class → Fees) in single round-trips, eliminating relational bottlenecks.
          </div>
        </div>

        <div class="highlight-card">
          <div class="highlight-card-title">🛡️ Soft-Delete Architecture</div>
          <div class="highlight-card-text">
            Non-destructive student and teacher deactivations preserve full historical financial ledgers, past attendance, and exam archives.
          </div>
        </div>

        <div class="highlight-card">
          <div class="highlight-card-title">🔔 Web Push & PWA</div>
          <div class="highlight-card-text">
            Native Web Push Notifications (VAPID) deliver instant mobile alerts for new diary entries, quest assignments, and fee reminders.
          </div>
        </div>
      </div>

      <!-- Key Outcomes Box -->
      <div class="overview-box" style="margin-bottom: 0; background: rgba(16, 185, 129, 0.08); border-left-color: #10b981; padding: 7px 10px;">
        <strong style="color: #34d399;">Business Impact & Scalability:</strong> Learnex ERP reduced school administrative workload by 70%, eliminated manual paper registers, automated 100% of fee invoice generation, and provided parents and students with 24/7 transparent access to academics, homework, and fee receipts.
      </div>
    </div>

    <!-- Page 3 Footer -->
    <div class="footer">
      <div class="footer-left">
        <span>Learnex ERP System</span>
        <span>•</span>
        <span>Built with Next.js, Neon PostgreSQL & Drizzle ORM</span>
      </div>
      <div class="footer-right">Page 03 / 03</div>
    </div>
  </div>

</body>
</html>
`;

fs.writeFileSync(outputHtmlPath, htmlContent, 'utf-8');
console.log('HTML generated successfully at:', outputHtmlPath);

// Convert HTML to PDF using Chrome Headless
try {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browserBin = fs.existsSync(chromePath) ? chromePath : edgePath;

  console.log('Using browser:', browserBin);
  const command = `"${browserBin}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${outputPdfPath}" "${outputHtmlPath}"`;
  
  execSync(command, { stdio: 'inherit' });
  console.log('PDF generated successfully at:', outputPdfPath);
  
  const stats = fs.statSync(outputPdfPath);
  console.log('PDF File Size:', (stats.size / 1024).toFixed(1), 'KB');
} catch (err) {
  console.error('Error generating PDF:', err);
}
