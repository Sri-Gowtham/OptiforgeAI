import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('optiforge_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('optiforge_token');
      localStorage.removeItem('optiforge_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── AUTH ──────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }).then(r => r.data),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then(r => r.data),
  getProfile: () =>
    api.get('/auth/profile').then(r => r.data),
};

// ── PROJECTS ──────────────────────────────────────────────────────────────
export const projectsAPI = {
  getAll: () => api.get('/projects').then(r => r.data),
  getById: (id: string) => api.get(`/projects/${id}`).then(r => r.data),
  create: (name: string, description?: string) =>
    api.post('/projects', { name, description }).then(r => r.data),
  update: (id: string, name: string, description?: string) =>
    api.put(`/projects/${id}`, { name, description }).then(r => r.data),
  delete: (id: string) => api.delete(`/projects/${id}`).then(r => r.data),
};

// ── ANALYSIS / AI ─────────────────────────────────────────────────────────
export const analysisAPI = {
  runOptimizer: (projectId: string, designDescription: string, designType?: string) =>
    api.post('/analysis/run', { projectId, designDescription, designType }).then(r => r.data),
  generateDesign: (prompt: string, designType?: string) =>
    api.post('/analysis/generate', { prompt, designType }).then(r => r.data),
  enhanceDesign: (currentDesign: string, userRequest: string) =>
    api.post('/analysis/enhance', { currentDesign, userRequest }).then(r => r.data),
  getByProject: (projectId: string) =>
    api.get(`/analysis/project/${projectId}`).then(r => r.data),
};

// ── DASHBOARD ─────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats').then(r => r.data),
};

export default api;
