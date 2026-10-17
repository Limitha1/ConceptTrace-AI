# ConceptTrace AI 🎓🤖

An AI-powered personalized learning and concept tracing platform designed for students in Classes 10–12 (CBSE, CISCE, State Boards, and competitive exams). ConceptTrace AI diagnoses genuine learning gaps through step-by-step verified problem analysis, targeted practice, and evidence-based mastery tracking.

---

## ✨ Features

- **Multi-Agent AI Doubt Solver**:
  - Accepts text questions, math formulas, and handwritten photo uploads.
  - Multi-agent breakdown: Problem Extraction & Formulation ➔ Step-by-Step Derivation ➔ Independent Verification (via alternative physical or mathematical principles) ➔ Common Pitfall Warnings ➔ Targeted Practice Generator.
  - Powered server-side by Google Gemini Flash with strict structured JSON schemas.
- **Evidence-Based Weak Topic Diagnostics**:
  - Strictly requires minimum evidence thresholds ($\ge 3$ attempts) to distinguish genuine concept deficiencies from small sample variance.
  - Categorizes topics honestly into *Needs Practice*, *Improving*, *Doing Well*, and *Needs More Evidence*.
- **Targeted Practice Hub**:
  - Interactive multiple-choice question bank tailored for Physics, Chemistry, and Mathematics.
  - Dynamically synthesizes practice questions generated from students' solved doubts.
  - Real-time instant feedback, hints, and derivations.
- **Study Time Tracking & Active Analytics**:
  - Automatic focus timer tracking active engagement with automatic idle detection (pausing after inactivity).
  - 30-day activity heatmap, accuracy trajectories, and subject-wise performance breakdowns.
- **Printable Diagnostic Progress Reports**:
  - Instant PDF generation with formal academic summaries, subject breakdowns, mastery status, and targeted recommendations.
- **Secure Multi-Tenant Architecture & Data Isolation**:
  - Row-Level Security (RLS) ensuring strict student session isolation.
  - Zero fabricated metrics: provides honest empty states for new learners until learning activities are logged.
  - Dual-mode persistence: resilient client/server local storage engine with automatic Supabase PostgreSQL cloud sync when configured.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, Canvas Confetti, jsPDF
- **Backend / AI Engine**: Node.js, Express, Google GenAI SDK (`gemini-3.8-flash`), Multer
- **Database / Auth**: Supabase PostgreSQL (with RLS policies) & isolated multi-tenant local persistence engine
- **Testing**: Node Test Runner with 100% passing unit and multi-tenant integration test suites

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Limitha1/ConceptTrace-AI.git
cd ConceptTrace-AI
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the sample environment file and configure your API keys:
```bash
cp .env.example .env
```
Open `.env` and set:
```ini
# Google Gemini API Key from https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash

# (Optional) Supabase Credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Run Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### 5. Run Test Suite
```bash
npm test
```

---

## 🗄️ Database Setup (Optional Cloud Sync)
If using Supabase cloud database:
1. Create a project in [Supabase](https://supabase.com/).
2. Run the SQL schema found in [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor.
3. Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`.

---

## 📄 License
This project is open-source and available under the MIT License.
