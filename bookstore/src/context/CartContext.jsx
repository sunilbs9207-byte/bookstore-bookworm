import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react'
import * as cartService from '../services/cartService'
import * as authService from '../services/authService'
import * as orderService from '../services/orderService'
const CartContext = createContext()
export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const [cartTotal, setCartTotal] = useState(0)
  const [cartCount, setCartCount] = useState(0)
  const [user, setUser] = useState(authService.getStoredUser())
  const [giftPoints, setGiftPoints] = useState(500)
  const [orderPlaced, setOrderPlaced] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  // Load cart on mount if user logged in
  useEffect(() => {
    if (user) {
      fetchCart()
    }
  }, [user])
  // Fetch cart from API
  const fetchCart = async () => {
    try {
      setLoading(true)
      const data = await cartService.getCart()
      setCartItems(data.items || [])
      setCartTotal(parseFloat(data.total) || 0)
      setCartCount(data.count || 0)
    } catch (err) {
      console.error('Fetch cart error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  // Add to cart
  const addToCart = async (book) => {
    try {
      // If user logged in use API
      if (user) {
        await cartService.addToCart(book.id, 1)
        await fetchCart()
      } else {
        // Guest cart using local state
        setCartItems((prev) => {
          const exists = prev.find((item) => item.id === book.id)
          if (exists) {
            return prev.map((item) =>
              item.id === book.id
                ? { ...item, qty: item.qty + 1 }
                : item
            )
          }
          return [...prev, { ...book, qty: 1 }]
        })
        updateLocalTotals()
      }
    } catch (err) {
      console.error('Add to cart error:', err)
      setError(err.message)
    }
  }
  // Update local totals for guest cart
  const updateLocalTotals = () => {
    setCartItems((prev) => {
      const total = prev.reduce(
        (sum, item) => sum + item.price * (item.qty || item.quantity),
        0
      )
      const count = prev.reduce(
        (sum, item) => sum + (item.qty || item.quantity),
        0
      )
      setCartTotal(total)
      setCartCount(count)
      return prev
    })
  }
  // Remove from cart
  const removeFromCart = async (cartItemId) => {
    try {
      if (user) {
        await cartService.removeFromCart(cartItemId)
        await fetchCart()
      } else {
        setCartItems((prev) =>
          prev.filter((item) => item.id !== cartItemId)
        )
        updateLocalTotals()
      }
    } catch (err) {
      console.error('Remove from cart error:', err)
      setError(err.message)
    }
  }
  // Update quantity
  const updateQty = async (cartItemId, quantity) => {
    try {
      if (quantity < 1) {
        await removeFromCart(cartItemId)
        return
      }
      if (user) {
        await cartService.updateCartItem(cartItemId, quantity)
        await fetchCart()
      } else {
        setCartItems((prev) =>
          prev.map((item) =>
            item.id === cartItemId
              ? { ...item, qty: quantity }
              : item
          )
        )
        updateLocalTotals()
      }
    } catch (err) {
      console.error('Update qty error:', err)
      setError(err.message)
    }
  }
  // Clear cart
  const clearCart = async () => {
    try {
      if (user) {
        await cartService.clearCart()
      }
      setCartItems([])
      setCartTotal(0)
      setCartCount(0)
    } catch (err) {
      console.error('Clear cart error:', err)
      setError(err.message)
    }
  }
  // Login
  const login = async (email, password) => {
    try {
      setLoading(true)
      const data = await authService.login(email, password)
      setUser(data.user)
      setGiftPoints(data.user.gift_points || 500)
      await fetchCart()
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }
  // Logout
  const logout = () => {
    authService.logout()
    setUser(null)
    setCartItems([])
    setCartTotal(0)
    setCartCount(0)
    setOrderPlaced(null)
  }
    // Place order
  const placeOrder = async (orderData) => {
    try {
      setLoading(true)
      const data = await orderService.placeOrder({
        addressId: orderData.addressId,
        paymentMethod: orderData.paymentMethod,
        cartItems: cartItems.map((item) => ({
          book_id: item.book_id || item.id,
          title: item.title,
          quantity: item.quantity || item.qty,
          price: item.price,
        })),
        subtotal: cartTotal,
        giftDiscount: orderData.giftDiscount || 0,
        total: orderData.total,
      })
      setOrderPlaced(data.order)
      setCartItems([])
      setCartTotal(0)
      setCartCount(0)
      return data.order
    } catch (err) {
      console.error('Place order error:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }
  // Cancel order
  const cancelOrder = async (orderId) => {
    try {
      setLoading(true)
      const data = await orderService.cancelOrder(orderId)
      return data
    } catch (err) {
      console.error('Cancel order error:', err)
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }
  // Clear error
  const clearError = () => setError(null)
  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartTotal,
        cartCount,
        loading,
        error,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        fetchCart,
        user,
        login,
        logout,
        giftPoints,
        setGiftPoints,
        orderPlaced,
        setOrderPlaced,
        placeOrder,
        cancelOrder,
        clearError,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
export function useCart() {
  return useContext(CartContext)
}
export default CartContext