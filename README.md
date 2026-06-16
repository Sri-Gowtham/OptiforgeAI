<div align="center">
  <h1>⚙️ OptiForge AI</h1>
  <p><strong>AI-Powered Mechanical and Architectural CAD Generation and Optimization</strong></p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16.2.0-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/React-19.2.4-blue?style=for-the-badge&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=node.js" alt="Node.js" />
    <img src="https://img.shields.io/badge/PostgreSQL-Prisma-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/AI-Groq%20%7C%20Pollinations-FF4F00?style=for-the-badge" alt="AI" />
  </p>
</div>

---

## 🚨 Problem Statement
Creating CAD designs, blueprints, and executing engineering analyses from scratch is highly time-consuming. It typically requires expensive, specialized software suites and years of domain expertise, presenting a massive barrier to entry for rapid prototyping and ideation.

## 💡 Solution Overview
**OptiForge AI** democratizes CAD design by empowering users to generate, edit, and optimize mechanical and architectural drawings using simple natural language prompts. By combining high-speed LLMs with a custom-built, constraint-driven 2D geometry engine, OptiForge AI bridges the gap between imagination and manufacturing-ready blueprints.

---

## ✨ Key Features

### 🤖 AI Design Generation
Turn natural language descriptions into professional-grade mechanical drawings and architectural blueprints instantly, powered by advanced prompt engineering and the Groq LLM inference engine.

### 📐 CAD Editor
A fully custom, interactive 2D geometry engine right in the browser. Draw lines, rectangles, circles, and arcs. Apply professional constraints (parallel, equal, fixed, horizontal, vertical) and dynamic dimensions directly on the canvas.

### 🔬 Engineering Optimization
Automated heuristic-based validation for material selection, load capacity, and structural thickness. Receive real-time DFM (Design for Manufacturability) warnings and suggestions.

### 💾 Export System
Export your designs effortlessly. OptiForge AI supports lossless vector exports to **SVG** for web/presentation use and **DXF** for direct industry-standard manufacturing and CNC workflows.

### 📁 Project Management
Save, organize, and manage all your designs, AI generations, and engineering analyses securely with offline LocalStorage fallback support for uninterrupted workflows.

---

## 🏗️ System Architecture

**Complete End-to-End Flow:**

```mermaid
flowchart TD
    User([User Prompt / Action]) --> Frontend
    Frontend[Next.js 16 + Zustand CAD Engine] --> Backend
    Backend[Node.js + Express API] --> AI_Layer
    AI_Layer{AI Orchestrator} -->|Mechanical| Groq[Groq Llama 3.3 70B]
    AI_Layer -->|Architectural| Pollinations[Pollinations AI]
    Backend --> DB[(PostgreSQL + Prisma)]
    Frontend --> CAD[2D Constraint Solver Engine]
    CAD --> Export[SVG / DXF Exporter]
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version / Details | Purpose |
| :--- | :--- | :--- |
| **Next.js** | `16.2.0` | App Router framework |
| **React** | `19.2.4` | UI library |
| **TypeScript** | `5.7.3` | Type safety |
| **Tailwind CSS** | `v4.2.0` | Utility-first styling |
| **Radix UI** | Latest | Unstyled accessible primitives |
| **Lucide React** | `0.564.0` | Iconography |
| **React Hook Form**| `7.54.1` | Form state management |
| **Zod** | `3.24.1` | Schema validation |
| **Recharts** | `2.15.0` | Data visualization |

### Backend
| Technology | Details | Purpose |
| :--- | :--- | :--- |
| **Node.js** | Runtime | Server environment |
| **Express.js** | `4.21.2` | REST API framework |
| **Prisma** | `5.22.0` | Modern TypeScript ORM |
| **PostgreSQL** | Database | Relational & JSON storage |
| **JWT** | `jsonwebtoken` | Secure stateless auth |
| **bcryptjs** | `2.4.3` | Password hashing |

### AI Ecosystem
| Provider | Model | Status |
| :--- | :--- | :--- |
| **Groq** | `Llama 3.3 70B` | **Active** (Mechanical SVG Generation) |
| **Pollinations** | `Flux` / `OpenAI`| **Active** (Architectural Images / Math Fallback) |
| **Anthropic Claude**| SDK installed | *Future Enhancement* |
| **Replicate** | SDK installed | *Future Enhancement* |

---

## 🧠 AI Workflow

### Mechanical Design Generation Flow
1. **Prompt** ➔ 2. **Parameter Extraction** *(regex parses material, load, size)* ➔ 3. **Part Detection** *(determines part type)* ➔ 4. **Prompt Engineering** *(injects exact SVG templates)* ➔ 5. **Groq Generation** ➔ 6. **SVG Validation** *(counts geometry elements)* ➔ 7. **Fallback Generator** *(triggers if AI hallucinates)* ➔ 8. **Final Blueprint**.

### Architectural Design Generation Flow
1. **Prompt** ➔ 2. **Prompt Enhancement** *(optimizes for blueprint style)* ➔ 3. **Pollinations** *(image generation)* ➔ 4. **Blueprint Image** ➔ 5. **Project Viewer**.

---

## ⚙️ CAD Engine

OptiForge AI features a sophisticated, custom-built 2D geometry engine entirely living on the frontend client.

* **Geometry System**: State-machine driven elements (`Line`, `Rect`, `Circle`, `Arc`, `Dimension`).
* **Constraint Solver**: Uses a custom **Topological Sort Dependency Graph** to solve for `fixed`, `parallel`, `equal`, `horizontal`, and `vertical` relationships.
* **Layers**: Multi-layer support with visibility and locking toggles.
* **Snapping**: Grid and object snapping support for precise drafting.
* **SVG Export**: Algorithmic client-side compilation of geometry into standardized `viewBox` SVGs.
* **DXF Export**: Backend API (`/api/export/dxf`) translates raw JSON geometry into industry-standard DXF files.

---

## 🗄️ Database Design

**Core Entities & Relationships:**
* **`User`**: Core account and credentials. (1:N with Projects)
* **`Project`**: High-level wrapper containing the design state. (1:N with Analyses)
* **`Analysis`**: A specific engineering or structural evaluation run. (1:N with Suggestions)
* **`Suggestion`**: Actionable DFM or structural feedback.
* **`Design`**: Raw JSON blob persistence for CAD geometry.

---

## 🔌 API Integrations

| API | Purpose | Status |
| :--- | :--- | :--- |
| **Groq** | Fast LLM inference for generating structured mechanical SVG code | ✅ Active |
| **Pollinations AI**| Text-to-Image architectural blueprints and basic text proxying | ✅ Active |
| **Claude SDK** | Advanced reasoning for future complex geometry logic | ⏸️ Dormant / Installed |
| **Replicate** | Specialized model execution | ⏸️ Dormant / Installed |

---

## 📂 Folder Structure

```text
OptiForgeAI/
├── frontend/             
│   ├── app/              # Next.js App Router (Pages & API routes)
│   ├── components/       # UI Primitives & Complex Widgets
│   │   ├── ui/           # Radix/Shadcn components
│   │   └── editor/       # CAD Engine (Canvas, Toolbar, useEditorStore)
│   ├── lib/              # Utils, Auth hooks, Persistence logic
│   └── package.json      
└── backend/              
    ├── prisma/           # PostgreSQL Schema
    ├── src/              
    │   ├── api/routes/   # Express modular routes (Auth, Design, Export)
    │   ├── controllers/  # Request handlers
    │   ├── services/     # Business logic (ai.service.ts, etc.)
    │   ├── middleware/   # JWT authentication
    │   └── server.ts     # Express initialization
    └── package.json      
```

---

## 🚀 Installation

### Frontend
```bash
cd frontend
npm install
```

### Backend
```bash
cd backend
npm install
```

### Database (Prisma)
```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

---

## 🔐 Environment Variables

**Frontend (`frontend/.env`)**:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Backend (`backend/.env`)**:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/optiforge"
PORT=5000
GROQ_API_KEY="your_groq_key"
JWT_SECRET="your_secure_jwt_secret"
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
```

---

## 💻 Running Locally

Open two separate terminal instances:

**Frontend**:
```bash
cd frontend
npm run dev
```

**Backend**:
```bash
cd backend
npm run dev
```

---

## 🏭 Production Build

**Frontend**:
```bash
cd frontend
npm run build
npm run start
```

**Backend**:
```bash
cd backend
npm run build
npm run start
```

---

## 📄 Application Pages

| Page | Purpose | Features | User Workflow |
| :--- | :--- | :--- | :--- |
| **Home** (`/`) | Landing Page | Product showcasing, call-to-actions. | Discover product ➔ Navigate to auth. |
| **Login** (`/login`) | Authentication | JWT login. | Enter credentials ➔ Redirect to Dashboard. |
| **Register** (`/register`) | Authentication | Account creation. | Fill form ➔ Redirect to Login. |
| **Dashboard** (`/dashboard`) | Overview | Activity stats, recent projects. | View stats ➔ Open project / New project. |
| **Create** (`/create`) | AI Generation | Natural language prompt interface. | Enter prompt ➔ AI generates design ➔ View. |
| **Editor** (`/editor`) | CAD Engine | 2D drawing, layers, constraints, exporting. | Draw/Edit geometry ➔ Apply constraints ➔ Save/Export. |
| **Projects** (`/projects`) | Management | List of user designs. | Browse saved designs ➔ Delete/Open. |
| **Design Viewer** (`/designs`) | Preview | Read-only view of specific iterations. | Inspect AI output ➔ Export or load in Editor. |
| **Optimizer** (`/optimizer`) | Engineering | Heuristic analysis, material/load scores. | Review DFM suggestions ➔ Adjust constraints. |
| **Profile** (`/profile`) | Settings | User account management. | Update details ➔ Log out. |

---

## 📸 Screenshots

*(Replace placeholders with actual images)*

| Dashboard | AI Generation |
| :---: | :---: |
| `[Dashboard Screenshot Placeholder]` | `[AI Prompting Screenshot Placeholder]` |

| CAD Editor | Engineering Optimization |
| :---: | :---: |
| `[CAD Canvas Screenshot Placeholder]` | `[Optimizer Dashboard Screenshot Placeholder]` |

<div align="center">
  <p><strong>Project Viewer</strong></p>
  <p><code>[Blueprint Viewer Screenshot Placeholder]</code></p>
</div>

---

## 🔮 Future Enhancements

Based on the current architecture, the following capabilities are roadmap targets:
* **Wall Thickness Analysis**
* **Draft Angle Verification**
* **Undercut Detection**
* **Manufacturing Cost Estimation**
* **API Usage Dashboard**
* **Rate Limiting**
* **Interactive User Walkthrough**
* **3D Modeling** (WebGL/Three.js extrusion from 2D profiles)
* **FEA Integration** (Finite Element Analysis via specialized external APIs)
* **Cloud Collaboration** (Multiplayer editing via WebSockets)

---

## ⚠️ Known Limitations
* **Architectural Output**: Currently relies on Pollinations AI to generate static blueprint images rather than editable CAD geometry.
* **LLM Consistency**: The Groq SVG output is probabilistic and occasionally fails heuristic validation, which triggers an algorithmic fallback generator.
* **DXF Fidelity**: Constraint-heavy arcs and dimensions may have slight translation artifacts in standard DXF viewers.

---

## 👥 Contributors
* **OptiForge AI Engineering Team**

---

## 📜 License
*Proprietary / TBD*
