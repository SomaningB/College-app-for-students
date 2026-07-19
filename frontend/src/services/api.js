import axios from 'axios'
import { CapacitorHttp } from '@capacitor/core'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

function createApi() {
  const instance = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' }
  })

  instance.interceptors.request.use(async (config) => {
    const token = sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  instance.interceptors.response.use(
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

  return instance
}

const api = createApi()
const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()

function nativeHeaders(headers) {
  const token = sessionStorage.getItem('token')
  const h = { 'Content-Type': 'application/json', ...headers }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

function handleNativeResponse(res) {
  if (res.status === 401) {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    window.location.href = '/login'
  }
  return { data: res.data, status: res.status, headers: res.headers }
}

async function capRequest(method, url, data, config) {
  if (!isNative) return api({ method, url, data, ...config })
  try {
    const res = await CapacitorHttp.request({
      url: API_BASE + url,
      method: method.toUpperCase(),
      headers: nativeHeaders(config?.headers),
      data: data || undefined
    })
    return handleNativeResponse(res)
  } catch (e) { throw e }
}

async function capUpload(method, url, formData) {
  if (!isNative) return api({ method, url, data: formData, headers: { 'Content-Type': 'multipart/form-data' } })
  try {
    const token = sessionStorage.getItem('token')
    const headers = {}
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await CapacitorHttp.request({
      url: API_BASE + url,
      method: method.toUpperCase(),
      headers,
      data: formData
    })
    return handleNativeResponse(res)
  } catch (e) { throw e }
}

function apiGet(url, config) { return isCapacitor ? capRequest('GET', url, null, config) : api.get(url, config) }
function apiPost(url, data, config) { return isCapacitor ? capRequest('POST', url, data, config) : api.post(url, data, config) }
function apiPut(url, data, config) { return isCapacitor ? capRequest('PUT', url, data, config) : api.put(url, data, config) }
function apiPatch(url, data, config) { return isCapacitor ? capRequest('PATCH', url, data, config) : api.patch(url, data, config) }
function apiDelete(url, config) { return isCapacitor ? capRequest('DELETE', url, null, config) : api.delete(url, config) }
function apiUpload(method, url, formData) { return isCapacitor ? capUpload(method, url, formData) : api({ method, url, data: formData, headers: { 'Content-Type': 'multipart/form-data' } }) }

export const authAPI = {
  register: (data) => apiPost('/auth/register', data),
  login: (data) => apiPost('/auth/login', data),
  me: () => apiGet('/auth/me'),
  verifyEmail: (email, code) => apiPost('/auth/verify-email', { email, code }),
  resendVerification: (email) => apiPost('/auth/resend-verification', { email }),
  forgotPassword: (email) => apiPost('/auth/forgot-password', { email }),
  resetPassword: (email, code, password) => apiPost('/auth/reset-password', { email, code, password }),
  searchUsers: (query) => apiGet(`/auth/users/search?query=${query}`),
  getUserById: (id) => apiGet(`/auth/users/by-id/${id}`)
}

export const streamsAPI = {
  getAll: () => apiGet('/streams')
}

export const materialsAPI = {
  get: (params) => apiGet('/materials/', { params }),
  contribute: (formData) => apiUpload('POST', '/materials/contribute', formData),
  getPending: () => apiGet('/materials/pending'),
  approve: (id) => apiPatch(`/materials/${id}/approve`),
  reject: (id) => apiPatch(`/materials/${id}/reject`),
  download: (id) => apiGet(`/materials/${id}/download`),
  getContributors: () => apiGet('/materials/contributors')
}

export const friendsAPI = {
  sendRequest: (toUniqueId) => apiPost('/friends/request', { to_unique_id: toUniqueId }),
  getRequests: () => apiGet('/friends/requests'),
  respond: (id, action) => apiPatch(`/friends/request/${id}/respond?action=${action}`),
  getList: () => apiGet('/friends/list'),
  getSent: () => apiGet('/friends/sent')
}

export const communitiesAPI = {
  create: (data) => apiPost('/communities/', data),
  getMine: () => apiGet('/communities/'),
  explore: () => apiGet('/communities/explore'),
  join: (id) => apiPost(`/communities/${id}/join`),
  getMembers: (id) => apiGet(`/communities/${id}/members`),
  getPending: (id) => apiGet(`/communities/${id}/pending`),
  approveMember: (communityId, userId) => apiPost(`/communities/${communityId}/approve/${userId}`),
  rejectMember: (communityId, userId) => apiPost(`/communities/${communityId}/reject/${userId}`),
  delete: (id) => apiDelete(`/communities/${id}`)
}

export const aiAPI = {
  generateNotes: (data) => apiPost('/ai/generate-notes', data),
  generateQuestions: (data) => apiPost('/ai/generate-questions', data),
  chat: (data) => apiPost('/ai/chat-assistant', data),
  chatWithNotes: (formData) => apiUpload('POST', '/ai/chat-with-notes', formData),
  recommend: () => apiPost('/ai/recommend-subjects'),
  getHistory: () => apiGet('/ai/history'),
  clearHistory: () => apiDelete('/ai/history')
}

export const searchAPI = {
  search: (params) => apiGet('/search/', { params }),
  subjects: () => apiGet('/search/subjects')
}

export const userNotesAPI = {
  listFolders: () => apiGet('/user-notes/folders'),
  createFolder: (formData) => apiUpload('POST', '/user-notes/folders', formData),
  deleteFolder: (id) => apiDelete(`/user-notes/folders/${id}`),
  listNotes: (params) => apiGet('/user-notes/', { params }),
  uploadNote: (formData) => apiUpload('POST', '/user-notes/upload', formData),
  deleteNote: (id) => apiDelete(`/user-notes/${id}`),
  getNoteContent: (id) => apiGet(`/user-notes/${id}/content`),
  chatWithSavedNote: (formData) => apiUpload('POST', '/ai/chat-with-saved-note', formData),
  saveFromMaterial: (formData) => apiUpload('POST', '/user-notes/save-from-material', formData),
}

export const adminAPI = {
  seed: () => apiPost('/admin/seed'),
  stats: () => apiGet('/admin/stats'),
  getUsers: () => apiGet('/admin/users'),
  deleteUser: (id) => apiDelete(`/admin/users/${id}`),
  getMaterials: () => apiGet('/admin/materials'),
  uploadMaterial: (formData) => apiUpload('POST', '/admin/materials/upload', formData),
  deleteMaterial: (id) => apiDelete(`/admin/materials/${id}`),
  createTeacher: (formData) => apiUpload('POST', '/admin/create-teacher', formData),
  getTeachers: () => apiGet('/admin/teachers'),
  updateTeacher: (id, formData) => apiUpload('PUT', `/admin/teachers/${id}`, formData),
  deleteTeacher: (id) => apiDelete(`/admin/teachers/${id}`),
  resetTeacherPassword: (id) => apiPost(`/admin/teachers/${id}/reset-password`),
  setTeacherPassword: (id, password) => apiPut(`/admin/teachers/${id}/set-password`, { password }),
  getLeaderboard: () => apiGet('/admin/leaderboard'),
  getFeedback: () => apiGet('/admin/feedback'),
  deleteFeedback: (id) => apiDelete(`/admin/feedback/${id}`)
}

export const teacherAPI = {
  upload: (formData) => apiUpload('POST', '/teacher/upload', formData),
  getNotes: () => apiGet('/teacher/notes'),
  deleteNote: (id) => apiDelete(`/teacher/notes/${id}`)
}

export const feedbackAPI = {
  submit: (message) => apiPost('/feedback/', { message }),
  getMine: () => apiGet('/feedback/mine')
}

export const leaderboardAPI = {
  get: () => apiGet('/leaderboard/')
}

export default api
