// Mock API layer for OptiForge AI
// In production, replace these with real API calls

export interface Project {
  id: string
  name: string
  description: string
  score: number
  createdAt: string
  type?: 'mechanical' | 'architectural'
}

export interface DesignResult {
  name: string
  cost: string
  estimatedCost?: number
  svgPreview: string
  svgBlueprint?: string
  imageUrl?: string
  specifications: { label: string; value: string }[]
  rawSpecifications?: Record<string, any>
  components: string[]
  manufacturingSteps: string[]
  safetyNotes: string
  designNotes: string
  description?: string
  designType?: string
  safetyConsiderations?: string[]
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


const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export const analysisAPI = {
  async generateDesign(prompt: string, designType: "mechanical" | "architectural"): Promise<DesignResult> {
    const sessionRaw = localStorage.getItem("optiforge_session")
    const token = sessionRaw ? JSON.parse(sessionRaw).token : null

    const res = await fetch(`${API_BASE}/api/analysis/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ prompt, designType }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.message || `Generation failed (${res.status})`)
    }

    const data = await res.json()
    console.log('API.TS RAW RESPONSE:', data)
    console.log('API.TS imageUrl:', data?.imageUrl)

    if (sessionRaw) {
      const session = JSON.parse(sessionRaw)
      const current = parseInt(localStorage.getItem(`optiforge_analyses_${session.email}`) || "0")
      localStorage.setItem(`optiforge_analyses_${session.email}`, String(current + 1))
    }

    // Normalise backend response → DesignResult shape
    const specs = data.specifications || {}
    const specRows: { label: string; value: string }[] = Object.entries(specs)
      .filter(([k]) => k !== 'materials')
      .map(([k, v]) => ({
        label: k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
        value: Array.isArray(v) ? (v as string[]).join(', ') : String(v),
      }))
    if (specs.materials) {
      specRows.unshift({ label: 'Materials', value: (specs.materials as string[]).join(', ') })
    }

    const components: string[] = (data.components || []).map(
      (c: any) => `${c.name}${c.material ? ` (${c.material})` : ''}`
    )

    return {
      name: data.name || data.title || 'Design',
      cost: data.estimatedCost ? `$${Number(data.estimatedCost).toLocaleString()}` : 'N/A',
      estimatedCost: data.estimatedCost,
      svgPreview: data.svgPreview || '',
      svgBlueprint: data.svgBlueprint || '',
      imageUrl: data.imageUrl || undefined,
      specifications: specRows,
      rawSpecifications: specs,
      components,
      manufacturingSteps: data.manufacturingSteps || [],
      safetyNotes: (data.safetyConsiderations || []).join(' '),
      designNotes: data.designNotes || data.description || '',
      description: data.description,
      designType: data.designType,
      safetyConsiderations: data.safetyConsiderations,
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

export const designAPI = {
  async save(name: string, elements: any[], constraints: any[]): Promise<any> {
    const res = await fetch(`${API_BASE}/api/design/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, data: { elements, constraints } }),
    });
    if (!res.ok) throw new Error('Failed to save design');
    return res.json();
  },

  async getById(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/design/${id}`);
    if (!res.ok) throw new Error('Failed to load design');
    return res.json();
  },

  async getAll(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/api/design`);
    if (!res.ok) throw new Error('Failed to fetch designs');
    return res.json();
  }
};
