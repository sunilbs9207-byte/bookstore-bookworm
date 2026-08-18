import apiFetch from './api'

export const getAddresses = async () => apiFetch('/addresses')

export const addAddress = async (address) =>
  apiFetch('/addresses', { method: 'POST', body: JSON.stringify(address) })

export const updateAddress = async (id, address) =>
  apiFetch(`/addresses/${id}`, { method: 'PUT', body: JSON.stringify(address) })

export const deleteAddress = async (id) =>
  apiFetch(`/addresses/${id}`, { method: 'DELETE' })
