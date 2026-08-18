import apiFetch from './api'
// Get all books with optional filters
export const getBooks = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.category && filters.category !== 'All') {
    params.append('category', filters.category)
  }
  if (filters.brand && filters.brand !== 'All') {
    params.append('brand', filters.brand)
  }
  if (filters.search) {
    params.append('search', filters.search)
  }
  const query = params.toString()
  return await apiFetch(`/books${query ? `?${query}` : ''}`)
}
// Get single book
export const getBookById = async (id) => {
  return await apiFetch(`/books/${id}`)
}
// Get related books
export const getRelatedBooks = async (id) => {
  return await apiFetch(`/books/${id}/related`)
}
// Get categories
export const getCategories = async () => {
  return await apiFetch('/books/categories')
}
// Get brands
export const getBrands = async () => {
  return await apiFetch('/books/brands')
}