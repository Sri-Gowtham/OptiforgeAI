// Mock API layer for OptiForge AI
// In production, replace these with real API calls
import { 
  loadCollection, 
  saveToCollection, 
  deleteFromCollection,
  EditorSaveState 
} from './editorPersistence'

export interface Project {
  id: string
  name: string
  description: string
  score: number
  sourceType: 'manual' | 'ai'
  createdAt: string
  updatedAt?: string
  type?: 'mechanical' | 'architectural'
}

export interface Component {
  name: string
  quantity: string
  material: string
  role: string
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
  components: Component[]
  manufacturingSteps: string[]
  safetyConsiderations: string[]
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
      sourceType: 'ai',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
    console.log('[AI RESULT RAW]', data);

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

    // Robust components mapping
    const rawComponents = Array.isArray(data.components) ? data.components : [];
    const components: Component[] = rawComponents.map((c: any) => ({
      name: String(c.name || 'Unknown Part'),
      quantity: String(c.quantity || '1'),
      material: String(c.material || specs.material || 'Standard'),
      role: String(c.role || c.description || 'Structural component')
    }));

    const manufacturingSteps = Array.isArray(data.manufacturingSteps) ? data.manufacturingSteps : [];
    const safetyConsiderations = Array.isArray(data.safetyConsiderations) ? data.safetyConsiderations : [];
    const designNotes = data.designNotes || data.description || 'No additional design notes available.';

    console.log('[COMPONENTS]', components);
    console.log('[MANUFACTURING]', manufacturingSteps);
    console.log('[SAFETY]', safetyConsiderations);

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
      manufacturingSteps,
      safetyConsiderations,
      safetyNotes: safetyConsiderations.join(' '),
      designNotes,
      description: data.description,
      designType: data.designType,
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
  async save(name: string, elements: any[], constraints: any[], id?: string, sourceType: 'manual' | 'ai' = 'manual'): Promise<any> {
    const finalId = id || `local-${Date.now()}`;
    const payload = { 
      id: finalId,
      name, 
      sourceType,
      data: { elements, constraints },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('[SAVE] Saving design:', finalId);

    // Always save to local collection for persistence/offline
    const editorState: EditorSaveState = {
      metadata: {
        id: finalId,
        name,
        sourceType,
        createdAt: payload.createdAt,
        updatedAt: payload.updatedAt,
        version: '1.0',
        designType: 'mechanical'
      },
      elements,
      layers: [],
      constraints,
      dimensions: [],
      zoom: 1,
      pan: { x: 0, y: 0 }
    };
    saveToCollection(editorState);

    try {
      const res = await fetch(`${API_BASE}/api/design/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.warn('[SAVE] Backend save failed, but local copy is safe');
      }
      return res.ok ? res.json() : payload;
    } catch (e) {
      console.warn('[SAVE] Backend unreachable, local copy saved', e);
      return payload;
    }
  },

  async getById(id: string): Promise<any> {
    console.log('[LOAD] Fetching design:', id);
    try {
      const res = await fetch(`${API_BASE}/api/design/${id}`);
      if (res.ok) return res.json();
    } catch (e) {
      console.warn('[LOAD] Backend fetch failed, checking local collection');
    }

    const localCollection = loadCollection();
    const local = localCollection.find(i => i.metadata.id === id);
    if (local) {
      console.log('[LOAD] Found in local collection');
      return {
        id: local.metadata.id,
        name: local.metadata.name,
        sourceType: local.metadata.sourceType || 'manual',
        data: { elements: local.elements, constraints: local.constraints },
        createdAt: local.metadata.createdAt,
        updatedAt: local.metadata.updatedAt
      };
    }

    throw new Error('Design not found');
  },

  async getAll(): Promise<any[]> {
    console.log('[DESIGNS] Fetching all designs');
    let backendDesigns: any[] = [];
    try {
      const res = await fetch(`${API_BASE}/api/design`);
      if (res.ok) {
        backendDesigns = await res.json();
      }
    } catch (e) {
      console.warn('[DESIGNS] Backend fetch failed');
    }

    const localCollection = loadCollection();
    const localDesigns = localCollection.map(item => ({
      id: item.metadata.id,
      name: item.metadata.name,
      sourceType: item.metadata.sourceType || (item.elements?.length > 0 ? 'manual' : 'ai'),
      data: { 
        elements: item.elements || [], 
        constraints: item.constraints || [] 
      },
      createdAt: item.metadata.createdAt,
      updatedAt: item.metadata.updatedAt,
      isLocal: true
    }));

    // Merge and remove duplicates (prefer backend if same ID, though local IDs are unique-ish)
    const all = [...backendDesigns];
    localDesigns.forEach(ld => {
      if (!all.find(bd => bd.id === ld.id)) {
        all.push(ld);
      }
    });

    // Sort by updated date
    all.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

    console.log(`[DESIGNS] Total merged designs: ${all.length}`);
    return all;
  },

  async delete(id: string): Promise<void> {
    console.log('[DESIGNS] Deleting design:', id);
    deleteFromCollection(id);
    try {
      await fetch(`${API_BASE}/api/design/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('[DESIGNS] Backend delete failed or not implemented');
    }
  }
};
