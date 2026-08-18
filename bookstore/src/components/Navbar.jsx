import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  HeaderGlobalBar,
  HeaderGlobalAction,
} from '@carbon/react'
import { ShoppingCart, UserAvatar, Logout } from '@carbon/icons-react'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { cartCount, user, logout } = useCart()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <Header aria-label="Book Worm">
      {/* Brand name — uses Link for SPA navigation */}
      <HeaderName as={Link} to="/" prefix="📚">
        Book Worm
      </HeaderName>

      {/* Primary navigation links */}
      <HeaderNavigation aria-label="Main navigation">
        <HeaderMenuItem as={Link} to="/">
          Home
        </HeaderMenuItem>
        <HeaderMenuItem as={Link} to="/catalogue">
          Catalogue
        </HeaderMenuItem>
        <HeaderMenuItem as={Link} to="/order-history">
          Order History
        </HeaderMenuItem>
      </HeaderNavigation>

      {/* Right-side global actions */}
      <HeaderGlobalBar>
        {/* Cart with item-count badge */}
        <HeaderGlobalAction
          aria-label={`Cart (${cartCount} items)`}
          onClick={() => navigate('/cart')}
        >
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-8px',
                  background: '#da1e28',
                  color: '#fff',
                  borderRadius: '50%',
                  fontSize: '10px',
                  lineHeight: '16px',
                  width: '16px',
                  height: '16px',
                  textAlign: 'center',
                  fontWeight: 700,
                  pointerEvents: 'none',
                }}
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </span>
        </HeaderGlobalAction>

        {user ? (
          <>
            {/* Logged-in user's name + logout */}
            <HeaderGlobalAction
              aria-label={`Signed in as ${user.name}`}
              tooltipAlignment="end"
              onClick={handleLogout}
              style={{ width: 'auto', padding: '0 1rem', gap: '0.5rem' }}
            >
              <UserAvatar size={20} />
              <span style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                {user.name}
              </span>
              <Logout size={16} />
            </HeaderGlobalAction>
          </>
        ) : (
          /* Not logged in — go to login page */
          <HeaderGlobalAction
            aria-label="Sign in"
            tooltipAlignment="end"
            onClick={() => navigate('/login')}
          >
            <UserAvatar size={20} />
          </HeaderGlobalAction>
        )}
      </HeaderGlobalBar>
    </Header>
  )
}
