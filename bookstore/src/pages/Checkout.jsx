import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Grid,
  Column,
  Tile,
  Button,
  Tag,
  Toggle,
  RadioButtonGroup,
  RadioButton,
  InlineNotification,
  TextInput,
  Select,
  SelectItem,
  Modal,
  Loading,
} from '@carbon/react'
import {
  Location,
  Gift,
  Wallet,
  ArrowRight,
  Purchase,
  Add,
} from '@carbon/icons-react'
import { paymentMethods } from '../data/mockData'
import { useCart } from '../context/CartContext'
import * as addressService from '../services/addressService'

// ─── constants ────────────────────────────────────────────────────────────────
const POINTS_PER_DOLLAR = 100
const SHIPPING_THRESHOLD = 35
const SHIPPING_FEE = 4.99
const TAX_RATE = 0.08

const fmt = (n) => `$${Number(n).toFixed(2)}`

const EMPTY_FORM = {
  name: '', line1: '', line2: '', city: '',
  state: '', zip: '', country: 'USA', is_default: false,
}

// ─── small helpers ────────────────────────────────────────────────────────────
function SectionCard({ icon: Icon, title, children }) {
  return (
    <Tile
      style={{
        background: 'var(--cds-layer, #ffffff)',
        border: '1px solid var(--cds-border-subtle, #e0e0e0)',
        padding: '1.5rem',
        marginBottom: '1.25rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {Icon && <Icon size={20} style={{ color: '#0f62fe', flexShrink: 0 }} />}
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--cds-text-primary, #161616)' }}>
          {title}
        </h2>
      </div>
      {children}
    </Tile>
  )
}

function SummaryLine({ label, value, bold, accent }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.3rem 0',
        fontSize: bold ? '1rem' : '0.875rem',
        fontWeight: bold ? 700 : 400,
        color: accent ? '#198038' : bold ? 'var(--cds-text-primary, #161616)' : 'var(--cds-text-secondary, #525252)',
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

// ─── component ────────────────────────────────────────────────────────────────
export default function Checkout() {
  const navigate = useNavigate()
  const { cartItems, cartTotal, user, giftPoints } = useCart()

  // Addresses state
  const [addresses, setAddresses]           = useState([])
  const [addrLoading, setAddrLoading]       = useState(true)
  const [addrError, setAddrError]           = useState('')
  const [selectedAddressId, setSelectedAddressId] = useState('')

  // Add address modal
  const [modalOpen, setModalOpen]   = useState(false)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [formError, setFormError]   = useState('')
  const [saving, setSaving]         = useState(false)

  // Gift points & payment
  const [redeemPoints, setRedeemPoints] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0].id)

  const isEmpty = cartItems.length === 0

  // ── load addresses on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    addressService.getAddresses()
      .then((data) => {
        setAddresses(data)
        const def = data.find((a) => a.is_default) ?? data[0]
        if (def) setSelectedAddressId(String(def.id))
      })
      .catch(() => setAddrError('Could not load addresses.'))
      .finally(() => setAddrLoading(false))
  }, [user])

  // ── derived totals ─────────────────────────────────────────────────────────
  const { giftDiscount, shipping, tax, finalTotal } = useMemo(() => {
    const availablePoints = giftPoints ?? 0
    const giftDiscount = redeemPoints
      ? parseFloat((availablePoints / POINTS_PER_DOLLAR).toFixed(2))
      : 0
    const discountedSub = Math.max(0, parseFloat(cartTotal) - giftDiscount)
    const shipping = discountedSub > SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
    const tax = parseFloat((discountedSub * TAX_RATE).toFixed(2))
    const finalTotal = parseFloat((discountedSub + shipping + tax).toFixed(2))
    return { giftDiscount, shipping, tax, finalTotal }
  }, [cartTotal, redeemPoints, giftPoints])

  // ── add address form handlers ──────────────────────────────────────────────
  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSaveAddress() {
    const { name, line1, city, state, zip, country } = form
    if (!name || !line1 || !city || !state || !zip || !country) {
      setFormError('Please fill in all required fields.')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const res = await addressService.addAddress(form)
      const newAddr = res.address
      setAddresses((prev) => [...prev, newAddr])
      setSelectedAddressId(String(newAddr.id))
      setModalOpen(false)
      setForm(EMPTY_FORM)
    } catch (err) {
      setFormError(err.message || 'Failed to save address.')
    } finally {
      setSaving(false)
    }
  }

  // ── proceed handler ────────────────────────────────────────────────────────
  function handleProceed() {
    const selectedAddress = addresses.find((a) => String(a.id) === selectedAddressId)
    navigate('/payment', {
      state: { selectedAddress, paymentMethod, finalTotal, giftDiscount },
    })
  }

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--cds-text-primary, #161616)', marginBottom: '0.25rem' }}>
          Checkout
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-helper, #6f6f6f)' }}>
          Review your order and complete your purchase
        </p>
      </div>

      {isEmpty && (
        <InlineNotification
          kind="warning"
          title="Your cart is empty."
          subtitle="Add books before proceeding to checkout."
          lowContrast
          hideCloseButton
          style={{ marginBottom: '1.5rem' }}
        />
      )}

      <Grid>
        {/* ════ LEFT COLUMN ════ */}
        <Column sm={4} md={5} lg={11}>

          {/* ── SECTION 1: Delivery Address ── */}
          <SectionCard icon={Location} title="Delivery Address">
            {addrLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Loading small withOverlay={false} />
                <span style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)' }}>Loading addresses…</span>
              </div>
            ) : addrError ? (
              <InlineNotification kind="error" title={addrError} lowContrast hideCloseButton />
            ) : addresses.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary, #525252)', marginBottom: '1rem' }}>
                No addresses saved yet. Add one below.
              </p>
            ) : (
              <RadioButtonGroup
                legendText=""
                name="delivery-address"
                valueSelected={selectedAddressId}
                onChange={(val) => setSelectedAddressId(val)}
                orientation="vertical"
              >
                {addresses.map((addr) => (
                  <RadioButton
                    key={addr.id}
                    value={String(addr.id)}
                    labelText={
                      <div style={{ paddingLeft: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--cds-text-primary, #161616)' }}>
                            {addr.name}
                          </span>
                          {addr.is_default && <Tag type="blue" size="sm">Default</Tag>}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--cds-text-secondary, #525252)', lineHeight: 1.5 }}>
                          {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
                          {addr.city}, {addr.state} {addr.zip}, {addr.country}
                        </p>
                      </div>
                    }
                  />
                ))}
              </RadioButtonGroup>
            )}

            <Button
              kind="ghost"
              size="sm"
              renderIcon={Add}
              style={{ marginTop: '1rem', paddingLeft: 0 }}
              onClick={() => { setForm(EMPTY_FORM); setFormError(''); setModalOpen(true) }}
            >
              Add new address
            </Button>
          </SectionCard>

          {/* ── SECTION 2: Gift Points ── */}
          <SectionCard icon={Gift} title="Gift Points">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary, #525252)', marginBottom: '0.4rem' }}>
                  Available points:{' '}
                  <strong style={{ color: 'var(--cds-text-primary, #161616)' }}>
                    {(giftPoints ?? 0).toLocaleString()} pts
                  </strong>
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--cds-text-helper, #6f6f6f)' }}>
                  {POINTS_PER_DOLLAR} pts = $1.00 &nbsp;·&nbsp; Redeem all {giftPoints ?? 0} pts for{' '}
                  <strong style={{ color: '#198038' }}>
                    ${((giftPoints ?? 0) / POINTS_PER_DOLLAR).toFixed(2)} off
                  </strong>
                </p>
              </div>
              <Toggle
                id="redeem-points-toggle"
                labelText="Redeem gift points"
                labelA="Off"
                labelB="On"
                toggled={redeemPoints}
                onToggle={(checked) => setRedeemPoints(checked)}
                size="sm"
              />
            </div>
            {redeemPoints && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#e8f5e9', border: '1px solid #a7f0ba', borderRadius: '4px' }}>
                <p style={{ fontSize: '0.875rem', color: '#198038', fontWeight: 600 }}>
                  🎉 ${((giftPoints ?? 0) / POINTS_PER_DOLLAR).toFixed(2)} discount applied!
                </p>
              </div>
            )}
          </SectionCard>

          {/* ── SECTION 3: Payment Method ── */}
          <SectionCard icon={Wallet} title="Payment Method">
            <RadioButtonGroup
              legendText=""
              name="payment-method"
              valueSelected={paymentMethod}
              onChange={(val) => setPaymentMethod(val)}
              orientation="vertical"
            >
              {paymentMethods.map((pm) => (
                <RadioButton key={pm.id} value={pm.id} labelText={pm.label} />
              ))}
            </RadioButtonGroup>
          </SectionCard>
        </Column>

        {/* ════ RIGHT COLUMN – Order Summary ════ */}
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
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--cds-text-primary, #161616)', marginBottom: '1.25rem' }}>
              Order Summary
            </h2>

            {cartItems.map((item) => (
              <div
                key={item.id}
                style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--cds-text-secondary, #525252)', padding: '0.25rem 0' }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                  {item.title} <span style={{ color: 'var(--cds-text-helper, #6f6f6f)' }}>×{item.quantity || item.qty}</span>
                </span>
                <span>{fmt(parseFloat(item.price) * (item.quantity || item.qty))}</span>
              </div>
            ))}

            <hr style={{ margin: '0.75rem 0', border: 'none', borderTop: '1px solid var(--cds-border-subtle, #e0e0e0)' }} />

            <SummaryLine label="Subtotal"    value={fmt(parseFloat(cartTotal))} />
            <SummaryLine label="Shipping"    value={shipping === 0 ? 'FREE' : fmt(shipping)} />
            <SummaryLine label="Tax (8%)"    value={fmt(tax)} />
            {redeemPoints && (
              <SummaryLine
                label={`Gift discount (${giftPoints ?? 0} pts)`}
                value={`-${fmt(giftDiscount)}`}
                accent
              />
            )}

            <hr style={{ margin: '0.75rem 0', border: 'none', borderTop: '1px solid var(--cds-border-subtle, #e0e0e0)' }} />
            <SummaryLine label="Total" value={fmt(finalTotal)} bold />

            {shipping === 0 && (
              <Tag type="green" size="sm" style={{ display: 'block', marginTop: '0.5rem' }}>
                Free shipping applied
              </Tag>
            )}

            <Button
              kind="primary"
              size="lg"
              renderIcon={Purchase}
              style={{ width: '100%', maxWidth: '100%', justifyContent: 'center', marginTop: '1.25rem' }}
              disabled={isEmpty || !selectedAddressId}
              onClick={handleProceed}
            >
              Continue to Payment
            </Button>
            <Button
              kind="ghost"
              size="sm"
              renderIcon={ArrowRight}
              style={{ width: '100%', maxWidth: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
              onClick={() => navigate('/cart')}
            >
              Back to Cart
            </Button>
          </Tile>
        </Column>
      </Grid>

      {/* ════ ADD ADDRESS MODAL ════ */}
      <Modal
        open={modalOpen}
        modalHeading="Add New Address"
        primaryButtonText={saving ? 'Saving…' : 'Save Address'}
        secondaryButtonText="Cancel"
        onRequestClose={() => setModalOpen(false)}
        onSecondarySubmit={() => setModalOpen(false)}
        onRequestSubmit={handleSaveAddress}
        primaryButtonDisabled={saving}
      >
        {formError && (
          <InlineNotification
            kind="error"
            title={formError}
            lowContrast
            hideCloseButton
            style={{ marginBottom: '1rem' }}
          />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <TextInput
            id="addr-name"
            labelText="Full name *"
            placeholder="Jane Doe"
            value={form.name}
            onChange={(e) => handleFormChange('name', e.target.value)}
          />
          <TextInput
            id="addr-line1"
            labelText="Address line 1 *"
            placeholder="123 Main Street"
            value={form.line1}
            onChange={(e) => handleFormChange('line1', e.target.value)}
          />
          <TextInput
            id="addr-line2"
            labelText="Address line 2 (optional)"
            placeholder="Apt 4B"
            value={form.line2}
            onChange={(e) => handleFormChange('line2', e.target.value)}
          />
          <Grid narrow>
            <Column sm={4} md={4} lg={8}>
              <TextInput
                id="addr-city"
                labelText="City *"
                placeholder="New York"
                value={form.city}
                onChange={(e) => handleFormChange('city', e.target.value)}
              />
            </Column>
            <Column sm={2} md={2} lg={4}>
              <TextInput
                id="addr-state"
                labelText="State *"
                placeholder="NY"
                value={form.state}
                onChange={(e) => handleFormChange('state', e.target.value)}
              />
            </Column>
            <Column sm={2} md={2} lg={4}>
              <TextInput
                id="addr-zip"
                labelText="ZIP code *"
                placeholder="10001"
                value={form.zip}
                onChange={(e) => handleFormChange('zip', e.target.value)}
              />
            </Column>
            <Column sm={4} md={4} lg={8}>
              <TextInput
                id="addr-country"
                labelText="Country *"
                placeholder="USA"
                value={form.country}
                onChange={(e) => handleFormChange('country', e.target.value)}
              />
            </Column>
          </Grid>
        </div>
      </Modal>
    </div>
  )
}
