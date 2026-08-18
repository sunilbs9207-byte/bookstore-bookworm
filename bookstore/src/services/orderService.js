import apiFetch from './api'
// Get all orders
export const getOrders = async () => {
  return await apiFetch('/orders')
}
// Get single order
export const getOrderById = async (id) => {
  return await apiFetch(`/orders/${id}`)
}
// Place new order
export const placeOrder = async (orderData) => {
  return await apiFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  })
}
// Cancel order
export const cancelOrder = async (id) => {
  return await apiFetch(`/orders/${id}/cancel`, {
    method: 'PUT',
  })
}
// Get recommendations
export const getRecommendations = async () => {
  return await apiFetch('/orders/recommendations')
}