import axios from 'axios'

const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  verifyEmail: (email, code) => api.post('/auth/verify-email', { email, code }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  searchUsers: (query) => api.get(`/auth/users/search?query=${query}`),
  getUserById: (id) => api.get(`/auth/users/by-id/${id}`)
}

export const streamsAPI = {
  getAll: () => api.get('/streams')
}

export const materialsAPI = {
  get: (params) => api.get('/materials/', { params }),
  contribute: (formData) => api.post('/materials/contribute', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getPending: () => api.get('/materials/pending'),
  approve: (id) => api.patch(`/materials/${id}/approve`),
  reject: (id) => api.patch(`/materials/${id}/reject`),
  download: (id) => api.get(`/materials/${id}/download`),
  getContributors: () => api.get('/materials/contributors')
}

export const friendsAPI = {
  sendRequest: (toUniqueId) => api.post('/friends/request', { to_unique_id: toUniqueId }),
  getRequests: () => api.get('/friends/requests'),
  respond: (id, action) => api.patch(`/friends/request/${id}/respond?action=${action}`),
  getList: () => api.get('/friends/list'),
  getSent: () => api.get('/friends/sent')
}

export const communitiesAPI = {
  create: (data) => api.post('/communities/', data),
  getMine: () => api.get('/communities/'),
  explore: () => api.get('/communities/explore'),
  join: (id) => api.post(`/communities/${id}/join`),
  getMembers: (id) => api.get(`/communities/${id}/members`)
}

export const aiAPI = {
  generateNotes: (data) => api.post('/ai/generate-notes', data),
  generateQuestions: (data) => api.post('/ai/generate-questions', data),
  chat: (data) => api.post('/ai/chat-assistant', data),
  chatWithNotes: (formData) => api.post('/ai/chat-with-notes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  recommend: () => api.post('/ai/recommend-subjects'),
  getHistory: () => api.get('/ai/history'),
  clearHistory: () => api.delete('/ai/history')
}

export const searchAPI = {
  search: (params) => api.get('/search/', { params }),
  subjects: () => api.get('/search/subjects')
}

export const userNotesAPI = {
  listFolders: () => api.get('/user-notes/folders'),
  createFolder: (formData) => api.post('/user-notes/folders', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteFolder: (id) => api.delete(`/user-notes/folders/${id}`),
  listNotes: (params) => api.get('/user-notes/', { params }),
  uploadNote: (formData) => api.post('/user-notes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteNote: (id) => api.delete(`/user-notes/${id}`),
  getNoteContent: (id) => api.get(`/user-notes/${id}/content`),
  chatWithSavedNote: (formData) => api.post('/ai/chat-with-saved-note', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  saveFromMaterial: (formData) => api.post('/user-notes/save-from-material', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}

export const adminAPI = {
  seed: () => api.post('/admin/seed'),
  stats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getMaterials: () => api.get('/admin/materials'),
  uploadMaterial: (formData) => api.post('/admin/materials/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteMaterial: (id) => api.delete(`/admin/materials/${id}`),
  createTeacher: (formData) => api.post('/admin/create-teacher', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getTeachers: () => api.get('/admin/teachers'),
  updateTeacher: (id, formData) => api.put(`/admin/teachers/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteTeacher: (id) => api.delete(`/admin/teachers/${id}`)
}

export const teacherAPI = {
  upload: (formData) => api.post('/teacher/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getNotes: () => api.get('/teacher/notes'),
  deleteNote: (id) => api.delete(`/teacher/notes/${id}`)
}

export default api
