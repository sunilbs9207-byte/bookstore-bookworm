import apiFetch from './api'
// Get cart
export const getCart = async () => {
  return await apiFetch('/cart')
}
// Add to cart
export const addToCart = async (bookId, quantity = 1) => {
  return await apiFetch('/cart', {
    method: 'POST',
    body: JSON.stringify({ bookId, quantity }),
  })
}
// Update cart item quantity
export const updateCartItem = async (cartItemId, quantity) => {
  return await apiFetch(`/cart/${cartItemId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  })
}
// Remove from cart
export const removeFromCart = async (cartItemId) => {
  return await apiFetch(`/cart/${cartItemId}`, {
    method: 'DELETE',
  })
}
// Clear entire cart
export const clearCart = async () => {
  return await apiFetch('/cart', {
    method: 'DELETE',
  })
}