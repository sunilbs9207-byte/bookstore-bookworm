import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Grid,
  Column,
  Tile,
  ClickableTile,
  Button,
  Tag,
  StructuredListWrapper,
  StructuredListHead,
  StructuredListBody,
  StructuredListRow,
  StructuredListCell,
  NumberInput,
} from '@carbon/react'
import {
  ShoppingCart,
  ArrowRight,
  TrashCan,
  ShoppingCartPlus,
  Purchase,
} from '@carbon/icons-react'
import { books } from '../data/mockData'
import { useCart } from '../context/CartContext'

// ── helpers ──────────────────────────────────────────────────────────────────
function SectionHeading({ children }) {
  return (
    <h2
      style={{
        fontSize: '1.125rem',
        fontWeight: 600,
        color: 'var(--cds-text-primary, #161616)',
        marginBottom: '1rem',
      }}
    >
      {children}
    </h2>
  )
}

function SummaryRow({ label, value, bold }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.35rem 0',
        fontWeight: bold ? 700 : 400,
        fontSize: bold ? '1rem' : '0.875rem',
        color: bold
          ? 'var(--cds-text-primary, #161616)'
          : 'var(--cds-text-secondary, #525252)',
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

// ── component ─────────────────────────────────────────────────────────────────
export default function Cart() {
  const navigate = useNavigate()
  const { cartItems, cartTotal, updateQty, removeFromCart, addToCart } = useCart()

  // ── AI recommendations: books from categories already in cart, not in cart ──
  const recommendations = useMemo(() => {
    if (cartItems.length === 0) {
      // No cart context — show top-rated books
      return books.slice(0, 3)
    }
    const cartIds       = new Set(cartItems.map((i) => i.id))
    const cartCategories = new Set(cartItems.map((i) => i.category))
    const matches = books.filter(
      (b) => cartCategories.has(b.category) && !cartIds.has(b.id)
    )
    // Fill up to 3 with highest-rated books outside cart categories if needed
    if (matches.length < 3) {
      const extras = books
        .filter((b) => !cartIds.has(b.id) && !cartCategories.has(b.category))
        .sort((a, b) => b.rating - a.rating)
      matches.push(...extras.slice(0, 3 - matches.length))
    }
    return matches.slice(0, 3)
  }, [cartItems])

  const shipping = cartTotal > 35 ? 0 : 4.99
  const tax      = parseFloat((cartTotal * 0.08).toFixed(2))
  const total    = parseFloat((cartTotal + shipping + tax).toFixed(2))

  // ══════════════════════════════════════════════════════════════════════════
  // EMPTY STATE
  // ══════════════════════════════════════════════════════════════════════════
  if (cartItems.length === 0) {
    return (
      <div>
        <Tile
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'var(--cds-layer, #ffffff)',
            border: '1px solid var(--cds-border-subtle, #e0e0e0)',
            marginBottom: '2.5rem',
          }}
        >
          <ShoppingCart size={48} style={{ color: 'var(--cds-text-helper, #6f6f6f)', marginBottom: '1rem' }} />
          <h2
            style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--cds-text-primary, #161616)',
              marginBottom: '0.5rem',
            }}
          >
            Your cart is empty
          </h2>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--cds-text-secondary, #525252)',
              marginBottom: '1.5rem',
            }}
          >
            Looks like you haven't added any books yet.
          </p>
          <Button
            kind="primary"
            renderIcon={ArrowRight}
            onClick={() => navigate('/catalogue')}
          >
            Browse Books
          </Button>
        </Tile>

        {/* Still show recommendations even for empty cart */}
        <RecommendationsSection books={recommendations} onAdd={addToCart} />
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FILLED CART
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div>
      {/* Page heading */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--cds-text-primary, #161616)',
          }}
        >
          Shopping Cart
        </h1>
        <Tag type="blue" size="md">
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
        </Tag>
      </div>

      <Grid>
        {/* ── LEFT: cart items list ── */}
        <Column sm={4} md={5} lg={11}>
          <StructuredListWrapper aria-label="Cart items" isCondensed>
            {/* Header row */}
            <StructuredListHead>
              <StructuredListRow head>
                <StructuredListCell head>Book</StructuredListCell>
                <StructuredListCell head>Price</StructuredListCell>
                <StructuredListCell head>Quantity</StructuredListCell>
                <StructuredListCell head>Subtotal</StructuredListCell>
                <StructuredListCell head>{/* remove */}</StructuredListCell>
              </StructuredListRow>
            </StructuredListHead>

            <StructuredListBody>
              {cartItems.map((item) => (
                <StructuredListRow key={item.id}>
                  {/* Book info cell */}
                  <StructuredListCell>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <img
                        src={item.image_url || item.image}
                        alt={item.title}
                        style={{
                          width: '44px',
                          height: '60px',
                          objectFit: 'cover',
                          flexShrink: 0,
                          background: 'var(--cds-layer-accent, #e8e8e8)',
                        }}
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                      <div>
                        <p
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: 'var(--cds-text-primary, #161616)',
                            marginBottom: '0.15rem',
                          }}
                        >
                          {item.title}
                        </p>
                        <p
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--cds-text-helper, #6f6f6f)',
                          }}
                        >
                          by {item.author}
                        </p>
                        <Tag type="gray" size="sm" style={{ marginTop: '0.25rem' }}>
                          {item.category}
                        </Tag>
                      </div>
                    </div>
                  </StructuredListCell>

                  {/* Unit price */}
                  <StructuredListCell>
                    <span
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--cds-text-secondary, #525252)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ${parseFloat(item.price).toFixed(2)}
                    </span>
                  </StructuredListCell>

                  {/* Quantity stepper */}
                  <StructuredListCell>
                    <NumberInput
                      id={`qty-${item.id}`}
                      label=""
                      hideLabel
                      min={1}
                      max={99}
                      step={1}
                      value={item.quantity || item.qty}
                      size="sm"
                      onChange={(_event, { value }) => {
                        const n = parseInt(value, 10)
                        if (!isNaN(n)) updateQty(item.id, n)
                      }}
                      style={{ width: '96px' }}
                    />
                  </StructuredListCell>

                  {/* Subtotal */}
                  <StructuredListCell>
                    <span
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--cds-text-primary, #161616)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      ${(parseFloat(item.price) * (item.quantity || item.qty)).toFixed(2)}
                    </span>
                  </StructuredListCell>

                  {/* Remove */}
                  <StructuredListCell>
                    <Button
                      kind="danger--ghost"
                      size="sm"
                      hasIconOnly
                      renderIcon={TrashCan}
                      iconDescription="Remove item"
                      tooltipPosition="left"
                      onClick={() => removeFromCart(item.id)}
                    />
                  </StructuredListCell>
                </StructuredListRow>
              ))}
            </StructuredListBody>
          </StructuredListWrapper>
        </Column>

        {/* ── RIGHT: order summary ── */}
        <Column sm={4} md={3} lg={5}>
          <Tile
            style={{
              background: 'var(--cds-layer, #ffffff)',
              border: '1px solid var(--cds-border-subtle, #e0e0e0)',
              padding: '1.5rem',
            }}
          >
            <SectionHeading>Order Summary</SectionHeading>

            <SummaryRow
              label={`Subtotal (${cartItems.reduce((s, i) => s + (i.quantity || i.qty), 0)} items)`}
              value={`$${parseFloat(cartTotal).toFixed(2)}`}
            />
            <SummaryRow
              label="Shipping"
              value={shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
            />
            <SummaryRow label={`Tax (8%)`} value={`$${tax.toFixed(2)}`} />

            {shipping === 0 && (
              <Tag type="green" size="sm" style={{ marginBottom: '0.75rem' }}>
                Free shipping applied!
              </Tag>
            )}

            <hr style={{ margin: '0.75rem 0' }} />

            <SummaryRow label="Total" value={`$${total.toFixed(2)}`} bold />

            <Button
              kind="primary"
              size="lg"
              renderIcon={Purchase}
              style={{
                width: '100%',
                maxWidth: '100%',
                justifyContent: 'center',
                marginTop: '1.25rem',
              }}
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
            </Button>

            <Button
              kind="ghost"
              size="sm"
              style={{
                width: '100%',
                maxWidth: '100%',
                justifyContent: 'center',
                marginTop: '0.5rem',
              }}
              onClick={() => navigate('/catalogue')}
            >
              Continue Shopping
            </Button>
          </Tile>
        </Column>
      </Grid>

      {/* ── Recommendations ── */}
      <div style={{ marginTop: '3rem' }}>
        <RecommendationsSection books={recommendations} onAdd={addToCart} />
      </div>
    </div>
  )
}

// ── Recommendations sub-component ─────────────────────────────────────────────
function RecommendationsSection({ books: recs, onAdd }) {
  if (!recs || recs.length === 0) return null
  return (
    <section>
      <hr style={{ marginBottom: '1.5rem' }} />
      <SectionHeading>You May Also Like</SectionHeading>
      <Grid>
        {recs.map((book) => (
          <Column key={book.id} sm={4} md={3} lg={5}>
            <ClickableTile
              style={{
                display: 'flex',
                gap: '0.75rem',
                padding: '1rem',
                alignItems: 'flex-start',
                background: 'var(--cds-layer, #ffffff)',
                border: '1px solid var(--cds-border-subtle, #e0e0e0)',
                height: '100%',
              }}
              onClick={() => onAdd(book)}
            >
              <img
                src={book.image_url || book.image}
                alt={book.title}
                style={{
                  width: '52px',
                  height: '70px',
                  objectFit: 'cover',
                  flexShrink: 0,
                  background: 'var(--cds-layer-accent, #e8e8e8)',
                }}
                onError={(e) => { e.target.style.display = 'none' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--cds-text-primary, #161616)',
                    marginBottom: '0.2rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {book.title}
                </p>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--cds-text-helper, #6f6f6f)',
                    marginBottom: '0.4rem',
                  }}
                >
                  by {book.author}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Tag type="green" size="sm">
                      ${parseFloat(book.price).toFixed(2)}
                  </Tag>
                  <Tag type="gray" size="sm">
                    {book.category}
                  </Tag>
                </div>
                <Button
                  kind="ghost"
                  size="sm"
                  renderIcon={ShoppingCartPlus}
                  style={{ marginTop: '0.5rem', padding: '0' }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onAdd(book)
                  }}
                >
                  Add to Cart
                </Button>
              </div>
            </ClickableTile>
          </Column>
        ))}
      </Grid>
    </section>
  )
}
