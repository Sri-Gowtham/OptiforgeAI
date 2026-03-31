// Mock API layer for OptiForge AI
// In production, replace these with real API calls

export interface Project {
  id: string
  name: string
  description: string
  score: number
  createdAt: string
}

export interface DesignResult {
  name: string
  cost: string
  svgPreview: string
  specifications: { label: string; value: string }[]
  components: string[]
  manufacturingSteps: string[]
  safetyNotes: string
  designNotes: string
}

export interface OptimizerResult {
  score: number
  issuesCount: number
  costEstimate: string
  suggestions: {
    id: string
    severity: "HIGH" | "MEDIUM" | "LOW"
    title: string
    description: string
    impact: string
  }[]
}

export interface DashboardStats {
  totalProjects: number
  analysesRun: number
  avgScore: number
}

// Simulated delay helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ─── Auth API ────────────────────────────────────────────────────────────────

export const authAPI = {
  async login(email: string, password: string): Promise<{ user: { email: string; joinedAt: string } }> {
    await delay(800)
    if (!email || !password) throw new Error("Email and password are required")
    if (password.length < 6) throw new Error("Invalid credentials")
    const users = JSON.parse(localStorage.getItem("optiforge_users") || "[]")
    const user = users.find((u: { email: string; password: string }) => u.email === email && u.password === password)
    if (!user) throw new Error("Invalid email or password")
    return { user: { email: user.email, joinedAt: user.joinedAt } }
  },

  async register(email: string, password: string): Promise<{ user: { email: string; joinedAt: string } }> {
    await delay(800)
    if (!email || !password) throw new Error("All fields are required")
    if (password.length < 6) throw new Error("Password must be at least 6 characters")
    const users = JSON.parse(localStorage.getItem("optiforge_users") || "[]")
    if (users.find((u: { email: string }) => u.email === email)) {
      throw new Error("An account with this email already exists")
    }
    const joinedAt = new Date().toISOString()
    users.push({ email, password, joinedAt })
    localStorage.setItem("optiforge_users", JSON.stringify(users))
    return { user: { email, joinedAt } }
  },

  async getProfile(): Promise<{ email: string; joinedAt: string; projectsCount: number; analysesCount: number }> {
    await delay(400)
    const sessionRaw = localStorage.getItem("optiforge_session")
    if (!sessionRaw) throw new Error("Not authenticated")
    const session = JSON.parse(sessionRaw)
    const projects = JSON.parse(localStorage.getItem(`optiforge_projects_${session.email}`) || "[]")
    const analyses = JSON.parse(localStorage.getItem(`optiforge_analyses_${session.email}`) || "0")
    return {
      email: session.email,
      joinedAt: session.joinedAt,
      projectsCount: projects.length,
      analysesCount: typeof analyses === "number" ? analyses : 0,
    }
  },
}

// ─── Projects API ─────────────────────────────────────────────────────────────

export const projectsAPI = {
  async getAll(): Promise<Project[]> {
    await delay(500)
    const sessionRaw = localStorage.getItem("optiforge_session")
    if (!sessionRaw) throw new Error("Not authenticated")
    const session = JSON.parse(sessionRaw)
    return JSON.parse(localStorage.getItem(`optiforge_projects_${session.email}`) || "[]")
  },

  async create(name: string, description: string): Promise<Project> {
    await delay(600)
    const sessionRaw = localStorage.getItem("optiforge_session")
    if (!sessionRaw) throw new Error("Not authenticated")
    const session = JSON.parse(sessionRaw)
    const projects: Project[] = JSON.parse(
      localStorage.getItem(`optiforge_projects_${session.email}`) || "[]"
    )
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      description,
      score: Math.floor(Math.random() * 30) + 60,
      createdAt: new Date().toISOString(),
    }
    projects.unshift(newProject)
    localStorage.setItem(`optiforge_projects_${session.email}`, JSON.stringify(projects))
    return newProject
  },

  async delete(id: string): Promise<void> {
    await delay(400)
    const sessionRaw = localStorage.getItem("optiforge_session")
    if (!sessionRaw) throw new Error("Not authenticated")
    const session = JSON.parse(sessionRaw)
    let projects: Project[] = JSON.parse(
      localStorage.getItem(`optiforge_projects_${session.email}`) || "[]"
    )
    projects = projects.filter((p) => p.id !== id)
    localStorage.setItem(`optiforge_projects_${session.email}`, JSON.stringify(projects))
  },
}

// ─── Analysis API ─────────────────────────────────────────────────────────────

const mechanicalSVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="80" width="160" height="40" rx="4" fill="#312e81" stroke="#6366f1" stroke-width="2"/>
  <circle cx="60" cy="100" r="20" fill="#1e1b4b" stroke="#6366f1" stroke-width="2"/>
  <circle cx="140" cy="100" r="20" fill="#1e1b4b" stroke="#6366f1" stroke-width="2"/>
  <circle cx="60" cy="100" r="8" fill="#6366f1"/>
  <circle cx="140" cy="100" r="8" fill="#6366f1"/>
  <rect x="85" y="70" width="30" height="60" rx="2" fill="#312e81" stroke="#818cf8" stroke-width="1.5"/>
  <line x1="20" y1="60" x2="180" y2="60" stroke="#4f46e5" stroke-width="1" stroke-dasharray="4 2"/>
  <line x1="20" y1="140" x2="180" y2="140" stroke="#4f46e5" stroke-width="1" stroke-dasharray="4 2"/>
  <text x="100" y="175" text-anchor="middle" fill="#818cf8" font-size="10" font-family="monospace">ASSEMBLY v1.0</text>
</svg>`

const architecturalSVG = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="30" y="100" width="140" height="80" fill="#312e81" stroke="#6366f1" stroke-width="2"/>
  <polygon points="100,20 20,100 180,100" fill="#1e1b4b" stroke="#6366f1" stroke-width="2"/>
  <rect x="85" y="140" width="30" height="40" fill="#1e1b4b" stroke="#818cf8" stroke-width="1.5"/>
  <rect x="45" y="115" width="25" height="25" fill="#4f46e5" stroke="#818cf8" stroke-width="1"/>
  <rect x="130" y="115" width="25" height="25" fill="#4f46e5" stroke="#818cf8" stroke-width="1"/>
  <line x1="30" y1="190" x2="170" y2="190" stroke="#4f46e5" stroke-width="1" stroke-dasharray="4 2"/>
  <text x="100" y="198" text-anchor="middle" fill="#818cf8" font-size="9" font-family="monospace">FLOOR PLAN v1.0</text>
</svg>`

export const analysisAPI = {
  async generateDesign(prompt: string, designType: "mechanical" | "architectural"): Promise<DesignResult> {
    await delay(2500)
    const isMech = designType === "mechanical"
    const sessionRaw = localStorage.getItem("optiforge_session")
    if (sessionRaw) {
      const session = JSON.parse(sessionRaw)
      const current = parseInt(localStorage.getItem(`optiforge_analyses_${session.email}`) || "0")
      localStorage.setItem(`optiforge_analyses_${session.email}`, String(current + 1))
    }
    return {
      name: isMech ? "Precision Drive Assembly Mk.II" : "Modular Commercial Hub",
      cost: isMech ? "$4,280 – $6,100" : "$312,000 – $480,000",
      svgPreview: isMech ? mechanicalSVG : architecturalSVG,
      specifications: isMech
        ? [
            { label: "Material", value: "6061-T6 Aluminum" },
            { label: "Tolerance", value: "±0.02 mm" },
            { label: "Weight", value: "3.4 kg" },
            { label: "Max Load", value: "850 N" },
            { label: "Surface Finish", value: "Ra 1.6 μm" },
            { label: "Operating Temp", value: "-20°C to 120°C" },
          ]
        : [
            { label: "Floor Area", value: "2,400 m²" },
            { label: "Stories", value: "4 levels" },
            { label: "Structure", value: "Steel Frame" },
            { label: "Occupancy", value: "320 persons" },
            { label: "Fire Rating", value: "2-hour" },
            { label: "Energy Class", value: "A+" },
          ],
      components: isMech
        ? ["Drive shaft (4140 steel)", "Ball bearings (6205-2RS)", "Housing (A380 die-cast)", "Seals & gaskets", "Mounting brackets", "Fastener kit M8"]
        : ["Structural steel columns", "Composite floor decking", "Curtain wall glazing", "HVAC ductwork", "Elevator cores (×2)", "Parking substructure"],
      manufacturingSteps: isMech
        ? [
            "Machine drive shaft to tolerance on CNC lathe",
            "Press-fit bearings into housing bores",
            "Mill mounting faces to flatness <0.01 mm",
            "Assemble sub-components with thread-lock",
            "Conduct load test at 120% rated capacity",
            "Apply anodize coating and final inspection",
          ]
        : [
            "Excavate and pour reinforced concrete foundations",
            "Erect structural steel frame and secure connections",
            "Install composite decking and pour concrete slabs",
            "Fit curtain wall and external cladding system",
            "Install MEP services (mechanical, electrical, plumbing)",
            "Interior fit-out, commissioning and sign-off",
          ],
      safetyNotes: isMech
        ? "Ensure all rotating parts have guards installed. Rated for static loads only — dynamic fatigue analysis required before deployment in cyclic-load environments."
        : "Structural calculations must be reviewed by a licensed PE. Building permit and third-party inspection required before occupancy.",
      designNotes: `Generated from prompt: "${prompt.slice(0, 120)}${prompt.length > 120 ? "…" : ""}". This design is a starting point — verify with domain-specific analysis before fabrication or construction.`,
    }
  },

  async runOptimizer(
    projectId: string,
    description: string,
    designType: "mechanical" | "architectural"
  ): Promise<OptimizerResult> {
    await delay(2200)
    const sessionRaw = localStorage.getItem("optiforge_session")
    if (sessionRaw) {
      const session = JSON.parse(sessionRaw)
      const current = parseInt(localStorage.getItem(`optiforge_analyses_${session.email}`) || "0")
      localStorage.setItem(`optiforge_analyses_${session.email}`, String(current + 1))
    }
    const score = Math.floor(Math.random() * 40) + 55
    const isMech = designType === "mechanical"
    return {
      score,
      issuesCount: score < 75 ? 3 : 1,
      costEstimate: isMech ? "$3,900 – $5,400" : "$280,000 – $420,000",
      suggestions: [
        {
          id: "1",
          severity: "HIGH",
          title: isMech ? "Stress concentration at bore radius" : "Lateral load path incomplete",
          description: isMech
            ? "The inner bore radius of 0.5 mm creates a stress concentration factor of ~2.8. Increasing to 2.0 mm reduces SCF to 1.4."
            : "Wind loads are not being fully transferred to the shear walls. Add diagonal bracing between grid lines C–D on floors 2–4.",
          impact: isMech ? "Extends fatigue life by ~3×" : "Reduces drift by up to 40%",
        },
        {
          id: "2",
          severity: "MEDIUM",
          title: isMech ? "Over-specified surface finish" : "Thermal bridging at curtain wall",
          description: isMech
            ? "Ra 0.4 μm specified on non-mating surfaces adds 22% to machining cost with no functional benefit. Relax to Ra 3.2 μm."
            : "Curtain wall mullions penetrate the insulation layer, causing thermal bridges. Use thermally broken profiles.",
          impact: isMech ? "Reduces machining cost by ~18%" : "Improves energy rating from B to A",
        },
        {
          id: "3",
          severity: "LOW",
          title: isMech ? "Fastener standardization" : "Acoustic partition upgrade",
          description: isMech
            ? "Three different fastener grades are used. Consolidating to M8 Grade 10.9 simplifies procurement and reduces SKUs."
            : "Current partition spec (STC 38) may not meet open-plan office standards. Upgrading to STC 45 adds <1% to cost.",
          impact: isMech ? "Reduces BOM complexity" : "Improves occupant comfort score",
        },
      ],
    }
  },
}

// ─── Dashboard API ────────────────────────────────────────────────────────────

export const dashboardAPI = {
  async getStats(): Promise<DashboardStats> {
    await delay(500)
    const sessionRaw = localStorage.getItem("optiforge_session")
    if (!sessionRaw) throw new Error("Not authenticated")
    const session = JSON.parse(sessionRaw)
    const projects: Project[] = JSON.parse(
      localStorage.getItem(`optiforge_projects_${session.email}`) || "[]"
    )
    const analyses = parseInt(localStorage.getItem(`optiforge_analyses_${session.email}`) || "0")
    const avgScore =
      projects.length > 0
        ? Math.round(projects.reduce((acc, p) => acc + p.score, 0) / projects.length)
        : 0
    return {
      totalProjects: projects.length,
      analysesRun: analyses,
      avgScore,
    }
  },
}
