import { registerImages } from '../lib/images'

const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(status, message, fields) {
    super(message)
    this.status = status
    this.fields = fields || {}
  }
}

async function request(path, { method = 'GET', json, form } = {}) {
  const headers = { Accept: 'application/json' }
  let body
  if (method !== 'GET') headers['X-Requested-With'] = 'snug-admin'
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(json)
  }
  if (form) body = form

  let res
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body, credentials: 'include' })
  } catch {
    throw new ApiError(0, 'Can’t reach the server. Check your connection and try again.')
  }
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && path !== '/admin/login' && path !== '/admin/me') {
      window.dispatchEvent(new Event('snug:auth-expired'))
    }
    throw new ApiError(res.status, data?.error || 'Something went wrong. Try again.', data?.fields)
  }
  if (data?.images && !Array.isArray(data.images)) registerImages(data.images)
  if (data?.registry) registerImages(data.registry)
  return data
}

export const api = {
  me: () => request('/admin/me'),
  login: (email, password) => request('/admin/login', { method: 'POST', json: { email, password } }),
  logout: () => request('/admin/logout', { method: 'POST' }),
  changePassword: (currentPassword, newPassword) =>
    request('/admin/password', { method: 'POST', json: { currentPassword, newPassword } }),

  products: () => request('/admin/products'),
  product: (id) => request(`/admin/products/${id}`),
  createProduct: (json) => request('/admin/products', { method: 'POST', json }),
  updateProduct: (id, json) => request(`/admin/products/${id}`, { method: 'PATCH', json }),
  deleteProduct: (id) => request(`/admin/products/${id}`, { method: 'DELETE' }),
  moveProduct: (id, direction) => request(`/admin/products/${id}/move`, { method: 'POST', json: { direction } }),

  // role 'design': the photo of one of the product's designs, kept out of its gallery.
  uploadImages: (id, files, focus, role = 'gallery') => {
    const form = new FormData()
    for (const file of files) form.append('files', file)
    form.append('focus', String(focus))
    if (role !== 'gallery') form.append('role', role)
    return request(`/admin/products/${id}/images`, { method: 'POST', form })
  },
  updateImage: (id, imageId, alt) => request(`/admin/products/${id}/images/${imageId}`, { method: 'PATCH', json: { alt } }),
  orderImages: (id, ids) => request(`/admin/products/${id}/images/order`, { method: 'POST', json: { ids } }),
  deleteImage: (id, imageId) => request(`/admin/products/${id}/images/${imageId}`, { method: 'DELETE' }),
  allImages: () => request('/admin/images'),

  settings: () => request('/admin/settings'),
  updateSettings: (json) => request('/admin/settings', { method: 'PATCH', json }),

  taxonomy: (kind) => request(`/admin/${kind}`),
  createTaxonomy: (kind, json) => request(`/admin/${kind}`, { method: 'POST', json }),
  updateTaxonomy: (kind, id, json) => request(`/admin/${kind}/${id}`, { method: 'PATCH', json }),
  deleteTaxonomy: (kind, id) => request(`/admin/${kind}/${id}`, { method: 'DELETE' }),
  moveTaxonomy: (kind, id, direction) => request(`/admin/${kind}/${id}/move`, { method: 'POST', json: { direction } }),
}
