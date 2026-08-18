import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Grid,
  Column,
  Tile,
  Form,
  Stack,
  TextInput,
  Button,
  Tag,
  InlineLoading,
  InlineNotification,
} from '@carbon/react'
import {
  Wallet,
  Location,
  Purchase,
  ArrowLeft,
  Delivery,
  Currency,
} from '@carbon/icons-react'
import { useCart } from '../context/CartContext'

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => (typeof n === 'number' ? `$${n.toFixed(2)}` : '—')

/** Strip spaces/dashes and validate 16-digit card number */
const isValidCard = (v) => /^\d{16}$/.test(v.replace(/[\s-]/g, ''))

/** Validate MM/YY and ensure not expired */
function isValidExpiry(v) {
  const match = v.match(/^(\d{2})\/(\d{2})$/)
  if (!match) return false
  const [, mm, yy] = match
  const month = parseInt(mm, 10)
  if (month < 1 || month > 12) return false
  const now = new Date()
  const expYear = 2000 + parseInt(yy, 10)
  const expMonth = month
  return (
    expYear > now.getFullYear() ||
    (expYear === now.getFullYear() && expMonth >= now.getMonth() + 1)
  )
}

const isValidCVV  = (v) => /^\d{3,4}$/.test(v.trim())
const isValidName = (v) => v.trim().length >= 2

// ── sub-components ────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.3rem 0',
        fontSize: '0.875rem',
      }}
    >
      <span style={{ color: 'var(--cds-text-helper, #6f6f6f)' }}>{label}</span>
      <span
        style={{
          color: 'var(--cds-text-primary, #161616)',
          fontWeight: 500,
          textAlign: 'right',
          maxWidth: '60%',
        }}
      >
        {value}
      </span>
    </div>
  )
}

// ── Credit-card form ──────────────────────────────────────────────────────────
function CreditCardForm({ fields, errors, touched, onChange }) {
  const field = (id) => ({
    id,
    value: fields[id],
    invalid: !!touched && !!errors[id],
    invalidText: errors[id] || '',
    onChange: (e) => onChange(id, e.target.value),
  })

  return (
    <Form noValidate>
      <Stack gap={5}>
        <Grid narrow>
          <Column sm={4} md={4} lg={8}>
            <TextInput
              {...field('cardNumber')}
              labelText="Card Number"
              placeholder="XXXX-XXXX-XXXX-XXXX"
              maxLength={19}
            />
          </Column>
          <Column sm={4} md={4} lg={8}>
            <TextInput
              {...field('nameOnCard')}
              labelText="Name on Card"
              placeholder="Full name"
            />
          </Column>
          <Column sm={2} md={2} lg={4}>
            <TextInput
              {...field('expiry')}
              labelText="Expiry Date"
              placeholder="MM/YY"
              maxLength={5}
            />
          </Column>
          <Column sm={2} md={2} lg={4}>
            <TextInput
              {...field('cvv')}
              labelText="CVV"
              placeholder="•••"
              maxLength={4}
              type="password"
            />
          </Column>
        </Grid>
      </Stack>
    </Form>
  )
}

// ── main component ────────────────────────────────────────────────────────────
export default function Payment() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { placeOrder, cartItems } = useCart()

  // Read state passed from Checkout
  const orderData = location.state ?? {}
  const {
    selectedAddress = null,
    paymentMethod   = 'credit',
    finalTotal      = 0,
    giftDiscount    = 0,
  } = orderData

  // ── credit card form state ─────────────────────────────────────────────────
  const [fields, setFields] = useState({
    cardNumber : '',
    nameOnCard : '',
    expiry     : '',
    cvv        : '',
  })
  const [touched,  setTouched]  = useState(false)
  const [formError, setFormError] = useState('')

  // ── loading state: 'idle' | 'active' | 'finished' ─────────────────────────
  const [loadingStatus, setLoadingStatus] = useState('inactive')

  // ── field change ───────────────────────────────────────────────────────────
  function handleChange(id, raw) {
    let value = raw
    // Auto-format card number with dashes
    if (id === 'cardNumber') {
      value = raw.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1-').replace(/-$/, '')
    }
    // Auto-format expiry MM/YY
    if (id === 'expiry') {
      const digits = raw.replace(/\D/g, '').slice(0, 4)
      value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
    }
    setFields((prev) => ({ ...prev, [id]: value }))
  }

  // ── validation ─────────────────────────────────────────────────────────────
  function validate() {
    if (paymentMethod !== 'credit') return {}
    const errs = {}
    if (!isValidCard(fields.cardNumber))  errs.cardNumber  = 'Enter a valid 16-digit card number.'
    if (!isValidExpiry(fields.expiry))    errs.expiry      = 'Enter a valid expiry date (MM/YY).'
    if (!isValidCVV(fields.cvv))          errs.cvv         = 'CVV must be 3 or 4 digits.'
    if (!isValidName(fields.nameOnCard))  errs.nameOnCard  = 'Name on card is required.'
    return errs
  }

  // ── submit ─────────────────────────────────────────────────────────────────
  function handlePay() {
    setTouched(true)
    setFormError('')

    // Guard: no items
    if (cartItems.length === 0) {
      setFormError('Your cart is empty. Please add books before paying.')
      return
    }

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setFormError('Please fix the errors above before continuing.')
      return
    }

    // Simulate 2-second processing delay
    setLoadingStatus('active')
    setTimeout(() => {
      setLoadingStatus('finished')
      placeOrder({
        total         : finalTotal,
        address       : selectedAddress,
        paymentMethod,
      })
      // Small pause so "finished" tick is visible before navigation
      setTimeout(() => navigate('/order-confirmation'), 600)
    }, 2000)
  }

  const errors      = validate()
  const isProcessing = loadingStatus === 'active' || loadingStatus === 'finished'

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page heading */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            color: 'var(--cds-text-primary, #161616)',
            marginBottom: '0.25rem',
          }}
        >
          Complete Payment
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-helper, #6f6f6f)' }}>
          Confirm your order details and pay securely
        </p>
      </div>

      {/* Missing location.state guard */}
      {!location.state && (
        <InlineNotification
          kind="warning"
          title="No order data found."
          subtitle="Please start from the checkout page."
          lowContrast
          hideCloseButton
          style={{ marginBottom: '1.5rem' }}
        />
      )}

      {formError && (
        <InlineNotification
          kind="error"
          title="Payment error:"
          subtitle={formError}
          lowContrast
          onClose={() => setFormError('')}
          style={{ marginBottom: '1.25rem' }}
        />
      )}

      <Grid>
        {/* ════════════════════════════════════════
            LEFT COLUMN – payment panel
        ════════════════════════════════════════ */}
        <Column sm={4} md={5} lg={11}>
          <Tile
            style={{
              background: 'var(--cds-layer, #ffffff)',
              border: '1px solid var(--cds-border-subtle, #e0e0e0)',
              padding: '1.5rem',
            }}
          >
            {/* ── Section heading with payable amount ── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wallet size={20} style={{ color: '#0f62fe' }} />
                <h2
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--cds-text-primary, #161616)',
                  }}
                >
                  {paymentMethod === 'credit'
                    ? 'Credit Card'
                    : paymentMethod === 'paypal'
                    ? 'PayPal'
                    : 'Cash on Delivery'}
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--cds-text-helper, #6f6f6f)',
                  }}
                >
                  Payable Amount:
                </span>
                <span
                  style={{
                    fontSize: '1.375rem',
                    fontWeight: 700,
                    color: 'var(--cds-text-primary, #161616)',
                  }}
                >
                  {fmt(finalTotal)}
                </span>
              </div>
            </div>

            <hr style={{ marginBottom: '1.5rem' }} />

            {/* ── Credit Card Form ─────────────────────────────── */}
            {paymentMethod === 'credit' && (
              <CreditCardForm
                fields={fields}
                errors={errors}
                touched={touched}
                onChange={handleChange}
              />
            )}

            {/* ── PayPal ───────────────────────────────────────── */}
            {paymentMethod === 'paypal' && (
              <Tile
                style={{
                  background: 'var(--cds-layer-accent, #f4f4f4)',
                  border: '1px solid var(--cds-border-subtle, #e0e0e0)',
                  padding: '1.5rem',
                  textAlign: 'center',
                }}
              >
                <Currency
                  size={40}
                  style={{ color: '#0f62fe', marginBottom: '0.75rem' }}
                />
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--cds-text-primary, #161616)',
                    marginBottom: '0.5rem',
                  }}
                >
                  Pay with PayPal
                </h3>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--cds-text-secondary, #525252)',
                    marginBottom: '0.5rem',
                  }}
                >
                  You will be charged{' '}
                  <strong>{fmt(finalTotal)}</strong> via PayPal.
                </p>
                <Tag type="blue" size="md">
                  mock-user@paypal.com
                </Tag>
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--cds-text-helper, #6f6f6f)',
                    marginTop: '0.75rem',
                  }}
                >
                  Click "Complete Payment" to confirm your PayPal transaction.
                </p>
              </Tile>
            )}

            {/* ── Cash on Delivery ─────────────────────────────── */}
            {paymentMethod === 'cod' && (
              <Tile
                style={{
                  background: 'var(--cds-layer-accent, #f4f4f4)',
                  border: '1px solid var(--cds-border-subtle, #e0e0e0)',
                  padding: '1.5rem',
                  textAlign: 'center',
                }}
              >
                <Delivery
                  size={40}
                  style={{ color: '#198038', marginBottom: '0.75rem' }}
                />
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--cds-text-primary, #161616)',
                    marginBottom: '0.5rem',
                  }}
                >
                  Cash on Delivery
                </h3>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--cds-text-secondary, #525252)',
                    marginBottom: '0.5rem',
                  }}
                >
                  Pay <strong>{fmt(finalTotal)}</strong> in cash when your
                  order arrives.
                </p>
                <Tag type="green" size="md">
                  No upfront payment required
                </Tag>
                <p
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--cds-text-helper, #6f6f6f)',
                    marginTop: '0.75rem',
                  }}
                >
                  Please have the exact amount ready at the time of delivery.
                </p>
              </Tile>
            )}

            {/* ── Action row ───────────────────────────────────── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginTop: '1.75rem',
                flexWrap: 'wrap',
              }}
            >
              {/* InlineLoading replaces the button label while processing */}
              {isProcessing ? (
                <InlineLoading
                  status={loadingStatus}
                  description={
                    loadingStatus === 'active'
                      ? 'Processing your payment…'
                      : 'Payment successful!'
                  }
                  successDelay={500}
                  style={{ flex: '1 1 auto' }}
                />
              ) : (
                <Button
                  kind="primary"
                  size="lg"
                  renderIcon={Purchase}
                  style={{
                    minWidth: '200px',
                    justifyContent: 'center',
                  }}
                  onClick={handlePay}
                  disabled={isProcessing}
                >
                  Complete Payment
                </Button>
              )}

              <Button
                kind="ghost"
                size="lg"
                renderIcon={ArrowLeft}
                onClick={() => navigate('/checkout')}
                disabled={isProcessing}
              >
                Back
              </Button>
            </div>
          </Tile>
        </Column>

        {/* ════════════════════════════════════════
            RIGHT COLUMN – Order Summary
        ════════════════════════════════════════ */}
        <Column sm={4} md={3} lg={5}>
          <Tile
            style={{
              background: 'var(--cds-layer, #ffffff)',
              border: '1px solid var(--cds-border-subtle, #e0e0e0)',
              padding: '1.5rem',
              position: 'sticky',
              top: '4rem',
            }}
          >
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: 'var(--cds-text-primary, #161616)',
                marginBottom: '1.25rem',
              }}
            >
              Order Summary
            </h2>

            {/* ── Amount breakdown ─── */}
            <InfoRow label="Order total" value={fmt(finalTotal + giftDiscount)} />
            {giftDiscount > 0 && (
              <InfoRow
                label="Gift points discount"
                value={
                  <span style={{ color: '#198038' }}>−{fmt(giftDiscount)}</span>
                }
              />
            )}
            <hr style={{ margin: '0.75rem 0' }} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--cds-text-primary, #161616)',
                padding: '0.3rem 0',
              }}
            >
              <span>Total Payable</span>
              <span>{fmt(finalTotal)}</span>
            </div>

            {/* ── Delivery address ─── */}
            {selectedAddress && (
              <>
                <hr style={{ margin: '1rem 0 0.75rem' }} />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.4rem',
                    marginBottom: '0.35rem',
                  }}
                >
                  <Location
                    size={16}
                    style={{
                      color: '#0f62fe',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  />
                  <p
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--cds-text-secondary, #525252)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Delivery Address
                  </p>
                </div>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--cds-text-secondary, #525252)',
                    lineHeight: 1.6,
                    paddingLeft: '1.3rem',
                  }}
                >
                  <strong style={{ color: 'var(--cds-text-primary, #161616)' }}>
                    {selectedAddress.name}
                  </strong>
                  <br />
                  {selectedAddress.line1}
                  {selectedAddress.line2 ? `, ${selectedAddress.line2}` : ''}
                  <br />
                  {selectedAddress.city}, {selectedAddress.state}{' '}
                  {selectedAddress.zip}
                  <br />
                  {selectedAddress.country}
                </p>
              </>
            )}

            {/* ── Payment method badge ─── */}
            <hr style={{ margin: '1rem 0 0.75rem' }} />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Wallet size={16} style={{ color: '#0f62fe' }} />
              <p
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--cds-text-secondary, #525252)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Payment Method
              </p>
            </div>
            <div style={{ paddingLeft: '1.3rem', marginTop: '0.35rem' }}>
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
                {paymentMethod === 'credit'
                  ? 'Credit Card'
                  : paymentMethod === 'paypal'
                  ? 'PayPal'
                  : 'Cash on Delivery'}
              </Tag>
            </div>
          </Tile>
        </Column>
      </Grid>
    </div>
  )
}
