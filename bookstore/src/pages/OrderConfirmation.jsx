import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Grid,
  Column,
  Tile,
  Button,
  Tag,
  InlineNotification,
  StructuredListWrapper,
  StructuredListHead,
  StructuredListBody,
  StructuredListRow,
  StructuredListCell,
  Modal,
} from '@carbon/react'
import {
  CheckmarkFilled,
  ShoppingCatalog,
  Time,
  Receipt,
  Location,
  Wallet,
  TrashCan,
  ArrowRight,
} from '@carbon/icons-react'
import { useCart } from '../context/CartContext'

// ── constants ─────────────────────────────────────────────────────────────────
const CANCEL_WINDOW_MS = 48 * 60 * 60 * 1000   // 48 hours in milliseconds
const DELIVERY_DAYS    = 5                       // estimated delivery offset

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => `$${Number(n).toFixed(2)}`

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month:   'short',
    day:     'numeric',
    year:    'numeric',
  })
}

function estimatedDelivery(orderDate) {
  const d = new Date(orderDate)
  d.setDate(d.getDate() + DELIVERY_DAYS)
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month:   'short',
    day:     'numeric',
  })
}

function SummaryRow({ label, value, bold, accent }) {
  return (
    <div
      style={{
        display:        'flex',
        justifyContent: 'space-between',
        padding:        '0.3rem 0',
        fontSize:       bold ? '1rem' : '0.875rem',
        fontWeight:     bold ? 700 : 400,
        color: accent
          ? '#198038'
          : bold
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
export default function OrderConfirmation() {
  const navigate = useNavigate()
  const { orderPlaced } = useCart()

  // Cancel modal visibility
  const [cancelOpen, setCancelOpen] = useState(false)
  // Whether this order has been cancelled (local UI state only)
  const [cancelled, setCancelled]   = useState(false)

  // Redirect if there is no order in context (e.g. direct URL navigation)
  useEffect(() => {
    if (!orderPlaced) {
      navigate('/', { replace: true })
    }
  }, [orderPlaced, navigate])

  if (!orderPlaced) return null

  const {
    id,
    created_at,
    status,
    total,
    items        = [],
    orderTimestamp,
    address,
    payment_method,
    paymentMethod,
  } = orderPlaced

  const date = created_at || orderPlaced.date
  const resolvedPaymentMethod = payment_method || paymentMethod

  // Within 48-hour cancellation window?
  const canCancel =
    !cancelled &&
    orderTimestamp &&
    Date.now() - orderTimestamp < CANCEL_WINDOW_MS

  const paymentLabel =
    resolvedPaymentMethod === 'credit'
      ? 'Credit Card'
      : resolvedPaymentMethod === 'paypal'
      ? 'PayPal'
      : resolvedPaymentMethod === 'cod'
      ? 'Cash on Delivery'
      : resolvedPaymentMethod ?? '—'

  // ── handlers ────────────────────────────────────────────────────────────────
  function handleConfirmCancel() {
    setCancelled(true)
    setCancelOpen(false)
  }

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ═══════════════════════════════════════
          SUCCESS / CANCELLED NOTIFICATION
      ═══════════════════════════════════════ */}
      {cancelled ? (
        <InlineNotification
          kind="warning"
          title="Order Cancelled:"
          subtitle={`Order ${id} has been cancelled.`}
          lowContrast
          hideCloseButton
          style={{ marginBottom: '1.5rem' }}
        />
      ) : (
        <InlineNotification
          kind="success"
          title="Order Confirmed!"
          subtitle={`Your order ${id} has been placed successfully.`}
          lowContrast
          hideCloseButton
          style={{ marginBottom: '1.5rem' }}
        />
      )}

      {/* ═══════════════════════════════════════
          HERO SUCCESS BANNER
      ═══════════════════════════════════════ */}
      <Tile
        style={{
          textAlign:       'center',
          padding:         '2.5rem 2rem 2rem',
          background:      'var(--cds-layer, #ffffff)',
          border:          '1px solid var(--cds-border-subtle, #e0e0e0)',
          marginBottom:    '1.5rem',
        }}
      >
        <CheckmarkFilled
          size={56}
          style={{
            color:         '#198038',
            marginBottom:  '0.75rem',
          }}
        />
        <h1
          style={{
            fontSize:    '1.5rem',
            fontWeight:  700,
            color:       'var(--cds-text-primary, #161616)',
            marginBottom:'0.4rem',
          }}
        >
          {cancelled ? 'Order Cancelled' : 'Thank you for your purchase!'}
        </h1>
        <p
          style={{
            fontSize:  '0.9rem',
            color:     'var(--cds-text-secondary, #525252)',
            marginBottom: '0.75rem',
          }}
        >
          {cancelled
            ? 'Your order has been cancelled. You will receive a refund within 3-5 business days.'
            : "Your order has been placed and is being processed. We\u2019ll send you an update when it ships."}
        </p>

        {/* Status + order ID tags */}
        <div
          style={{
            display:        'flex',
            justifyContent: 'center',
            gap:            '0.5rem',
            flexWrap:       'wrap',
          }}
        >
          <Tag type="blue" size="md">
            <Receipt size={12} style={{ marginRight: '4px' }} />
            {id}
          </Tag>
          <Tag
            type={cancelled ? 'red' : status === 'Processing' ? 'cyan' : 'green'}
            size="md"
          >
            {cancelled ? 'Cancelled' : status}
          </Tag>
          <Tag type="gray" size="md">
            {formatDate(date)}
          </Tag>
        </div>
      </Tile>

      <Grid>
        {/* ═══════════════════════════════════════
            LEFT – Order Items
        ═══════════════════════════════════════ */}
        <Column sm={4} md={5} lg={11}>
          <Tile
            style={{
              background: 'var(--cds-layer, #ffffff)',
              border:     '1px solid var(--cds-border-subtle, #e0e0e0)',
              padding:    '1.5rem',
              marginBottom:'1.25rem',
            }}
          >
            <h2
              style={{
                fontSize:     '1rem',
                fontWeight:   600,
                color:        'var(--cds-text-primary, #161616)',
                marginBottom: '1rem',
              }}
            >
              Items Ordered
            </h2>

            <StructuredListWrapper aria-label="Order items" isCondensed>
              <StructuredListHead>
                <StructuredListRow head>
                  <StructuredListCell head>Book</StructuredListCell>
                  <StructuredListCell head>Qty</StructuredListCell>
                  <StructuredListCell head>Unit</StructuredListCell>
                  <StructuredListCell head>Subtotal</StructuredListCell>
                </StructuredListRow>
              </StructuredListHead>

              <StructuredListBody>
                {items.map((item, idx) => (
                  <StructuredListRow key={item.id ?? item.bookId ?? idx}>
                    {/* Book info */}
                    <StructuredListCell>
                      <div
                        style={{
                          display:    'flex',
                          gap:        '0.6rem',
                          alignItems: 'flex-start',
                        }}
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.title}
                            style={{
                              width:      '36px',
                              height:     '50px',
                              objectFit:  'cover',
                              flexShrink: 0,
                              background: 'var(--cds-layer-accent, #e8e8e8)',
                            }}
                            onError={(e) => { e.target.style.display = 'none' }}
                          />
                        )}
                        <div>
                          <p
                            style={{
                              fontSize:   '0.875rem',
                              fontWeight: 600,
                              color:      'var(--cds-text-primary, #161616)',
                            }}
                          >
                            {item.title}
                          </p>
                          {item.author && (
                            <p
                              style={{
                                fontSize: '0.75rem',
                                color:    'var(--cds-text-helper, #6f6f6f)',
                              }}
                            >
                              by {item.author}
                            </p>
                          )}
                        </div>
                      </div>
                    </StructuredListCell>

                    {/* Qty */}
                    <StructuredListCell>
                      <Tag type="gray" size="sm">
                        ×{item.quantity || item.qty}
                      </Tag>
                    </StructuredListCell>

                    {/* Unit price */}
                    <StructuredListCell>
                      <span
                        style={{
                          fontSize: '0.875rem',
                          color:    'var(--cds-text-secondary, #525252)',
                        }}
                      >
                        {fmt(item.price)}
                      </span>
                    </StructuredListCell>

                    {/* Subtotal */}
                    <StructuredListCell>
                      <span
                        style={{
                          fontSize:   '0.875rem',
                          fontWeight: 600,
                          color:      'var(--cds-text-primary, #161616)',
                        }}
                      >
                        {fmt(parseFloat(item.price) * (item.quantity || item.qty))}
                      </span>
                    </StructuredListCell>
                  </StructuredListRow>
                ))}
              </StructuredListBody>
            </StructuredListWrapper>

            {/* Estimated delivery */}
            <div
              style={{
                display:    'flex',
                alignItems: 'center',
                gap:        '0.4rem',
                marginTop:  '1.25rem',
                padding:    '0.6rem 0.75rem',
                background: 'var(--cds-layer-accent, #defbe6)',
                border:     '1px solid #a7f0ba',
                borderRadius: '4px',
              }}
            >
              <Time size={16} style={{ color: '#198038', flexShrink: 0 }} />
              <p style={{ fontSize: '0.875rem', color: '#198038', fontWeight: 500 }}>
                Estimated delivery by{' '}
                <strong>{estimatedDelivery(date)}</strong>
              </p>
            </div>
          </Tile>

          {/* ── Action buttons ─────────────────────────────────── */}
          <div
            style={{
              display:   'flex',
              gap:       '0.75rem',
              flexWrap:  'wrap',
              alignItems:'center',
            }}
          >
            <Button
              kind="secondary"
              renderIcon={ShoppingCatalog}
              onClick={() => navigate('/catalogue')}
            >
              Continue Shopping
            </Button>

            <Button
              kind="ghost"
              renderIcon={ArrowRight}
              onClick={() => navigate('/order-history')}
            >
              View Order History
            </Button>

            {canCancel && (
              <Button
                kind="danger"
                renderIcon={TrashCan}
                onClick={() => setCancelOpen(true)}
              >
                Cancel Order
              </Button>
            )}
          </div>
        </Column>

        {/* ═══════════════════════════════════════
            RIGHT – Order Summary tile
        ═══════════════════════════════════════ */}
        <Column sm={4} md={3} lg={5}>
          <Tile
            style={{
              background: 'var(--cds-layer, #ffffff)',
              border:     '1px solid var(--cds-border-subtle, #e0e0e0)',
              padding:    '1.5rem',
              position:   'sticky',
              top:        '4rem',
            }}
          >
            <h2
              style={{
                fontSize:     '1rem',
                fontWeight:   600,
                color:        'var(--cds-text-primary, #161616)',
                marginBottom: '1rem',
              }}
            >
              Order Summary
            </h2>

            <SummaryRow
              label={`Items (${items.length})`}
              value={fmt(items.reduce((s, i) => s + i.price * i.qty, 0))}
            />
            <SummaryRow label="Order Total" value={fmt(total)} bold />

            {/* Delivery address */}
            {address && (
              <>
                <hr style={{ margin: '1rem 0 0.75rem' }} />
                <div
                  style={{
                    display:    'flex',
                    alignItems: 'center',
                    gap:        '0.4rem',
                    marginBottom:'0.4rem',
                  }}
                >
                  <Location size={14} style={{ color: '#0f62fe' }} />
                  <span
                    style={{
                      fontSize:       '0.7rem',
                      fontWeight:     600,
                      textTransform:  'uppercase',
                      letterSpacing:  '0.07em',
                      color:          'var(--cds-text-helper, #6f6f6f)',
                    }}
                  >
                    Delivery Address
                  </span>
                </div>
                <p
                  style={{
                    fontSize:    '0.8rem',
                    color:       'var(--cds-text-secondary, #525252)',
                    lineHeight:  1.6,
                    paddingLeft: '1.25rem',
                  }}
                >
                  <strong style={{ color: 'var(--cds-text-primary, #161616)' }}>
                    {address.name}
                  </strong>
                  <br />
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ''}
                  <br />
                  {address.city}, {address.state} {address.zip}
                  <br />
                  {address.country}
                </p>
              </>
            )}

            {/* Payment method */}
            <hr style={{ margin: '1rem 0 0.75rem' }} />
            <div
              style={{
                display:    'flex',
                alignItems: 'center',
                gap:        '0.4rem',
                marginBottom: '0.4rem',
              }}
            >
              <Wallet size={14} style={{ color: '#0f62fe' }} />
              <span
                style={{
                  fontSize:      '0.7rem',
                  fontWeight:    600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color:         'var(--cds-text-helper, #6f6f6f)',
                }}
              >
                Payment Method
              </span>
            </div>
            <div style={{ paddingLeft: '1.25rem' }}>
              <Tag
                type={
                  paymentMethod === 'credit'
                    ? 'blue'
                    : paymentMethod === 'paypal'
                    ? 'cyan'
                    : 'green'
                }
                size="md"
              >
                {paymentLabel}
              </Tag>
            </div>

            {/* Cancellation window notice */}
            {canCancel && (
              <>
                <hr style={{ margin: '1rem 0 0.75rem' }} />
                <p
                  style={{
                    fontSize: '0.75rem',
                    color:    'var(--cds-text-helper, #6f6f6f)',
                  }}
                >
                  Free cancellation available within 48 hours of placing this
                  order.
                </p>
              </>
            )}
          </Tile>
        </Column>
      </Grid>

      {/* ═══════════════════════════════════════
          CANCEL ORDER MODAL
      ═══════════════════════════════════════ */}
      <Modal
        open={cancelOpen}
        danger
        size="sm"
        modalHeading="Cancel Order"
        modalLabel={id}
        primaryButtonText="Yes, Cancel Order"
        secondaryButtonText="Keep Order"
        onRequestSubmit={handleConfirmCancel}
        onRequestClose={() => setCancelOpen(false)}
        onSecondarySubmit={() => setCancelOpen(false)}
      >
        <p
          style={{
            fontSize:     '0.875rem',
            color:        'var(--cds-text-secondary, #525252)',
            lineHeight:   1.6,
            marginBottom: '1rem',
          }}
        >
          Are you sure you want to cancel order{' '}
          <strong>{id}</strong>? This action cannot be undone.
        </p>
        <p
          style={{
            fontSize: '0.8rem',
            color:    'var(--cds-text-helper, #6f6f6f)',
          }}
        >
          If a payment was made, a full refund will be issued within 3–5
          business days.
        </p>
      </Modal>
    </div>
  )
}
