import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Grid,
  Column,
  Tile,
  Button,
  Tag,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  TableExpandHeader,
  TableExpandRow,
  TableExpandedRow,
  SkeletonText,
  InlineNotification,
} from '@carbon/react'
import { ShoppingCatalog, ShoppingCart } from '@carbon/icons-react'
import { useCart } from '../context/CartContext'
import * as orderService from '../services/orderService'

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => `$${Number(n).toFixed(2)}`

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function statusTag(status) {
  const map = { Delivered: 'green', Processing: 'blue', Cancelled: 'red' }
  return <Tag type={map[status] ?? 'gray'} size="sm">{status}</Tag>
}

const TABLE_HEADERS = [
  { key: 'id',     header: 'Order ID' },
  { key: 'date',   header: 'Date'     },
  { key: 'items',  header: 'Items'    },
  { key: 'total',  header: 'Total'    },
  { key: 'status', header: 'Status'   },
]

const TOTAL_COLS = TABLE_HEADERS.length + 1

// ── component ─────────────────────────────────────────────────────────────────
export default function OrderHistory() {
  const navigate  = useNavigate()
  const { user, cancelOrder } = useCart()

  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [cancellingId, setCancellingId] = useState(null)
  const [cancelError, setCancelError]   = useState('')

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    orderService.getOrders()
      .then(setOrders)
      .catch(() => setError('Could not load orders.'))
      .finally(() => setLoading(false))
  }, [user])

  async function handleCancel(orderId) {
    setCancellingId(orderId)
    setCancelError('')
    try {
      await cancelOrder(orderId)
      setOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, status: 'Cancelled' } : o)
      )
    } catch (err) {
      setCancelError(err.message || 'Could not cancel order.')
    } finally {
      setCancellingId(null)
    }
  }

  // ── loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--cds-text-primary)', marginBottom: '1.5rem' }}>
          Order History
        </h1>
        <Tile style={{ padding: '1.5rem' }}>
          <SkeletonText paragraph lineCount={6} />
        </Tile>
      </div>
    )
  }

  // ── empty state ───────────────────────────────────────────────────────────
  if (!loading && orders.length === 0) {
    return (
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--cds-text-primary, #161616)', marginBottom: '1.5rem' }}>
          Order History
        </h1>
        {error && <InlineNotification kind="error" title={error} lowContrast hideCloseButton style={{ marginBottom: '1rem' }} />}
        <Tile style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--cds-layer)', border: '1px solid var(--cds-border-subtle)' }}>
          <ShoppingCart size={48} style={{ color: 'var(--cds-text-helper, #6f6f6f)', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No orders yet</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--cds-text-secondary)', marginBottom: '1.5rem' }}>
            Start exploring our catalogue!
          </p>
          <Button kind="primary" renderIcon={ShoppingCatalog} onClick={() => navigate('/catalogue')}>
            Start Shopping
          </Button>
        </Tile>
      </div>
    )
  }

  // ── build DataTable rows ──────────────────────────────────────────────────
  const tableRows = orders.map((o) => ({
    id:     o.id,
    date:   formatDate(o.created_at),
    items:  `${(o.items || []).length} book${(o.items || []).length !== 1 ? 's' : ''}`,
    total:  fmt(o.total),
    status: o.status,
  }))

  // ── filled state ──────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--cds-text-primary, #161616)' }}>
          Order History
        </h1>
        <Tag type="blue" size="md">
          {orders.length} order{orders.length !== 1 ? 's' : ''}
        </Tag>
      </div>

      {error && <InlineNotification kind="error" title={error} lowContrast hideCloseButton style={{ marginBottom: '1rem' }} />}
      {cancelError && <InlineNotification kind="error" title={cancelError} lowContrast hideCloseButton style={{ marginBottom: '1rem' }} />}

      <DataTable rows={tableRows} headers={TABLE_HEADERS} size="md">
        {({ rows, headers, getHeaderProps, getExpandHeaderProps, getRowProps, getExpandedRowProps, getTableProps, getTableContainerProps }) => (
          <TableContainer
            title="Your Orders"
            description="Click the row chevron to see item details."
            {...getTableContainerProps()}
          >
            <Table {...getTableProps()} aria-label="Order history table">
              <TableHead>
                <TableRow>
                  <TableExpandHeader id="expand-all" {...getExpandHeaderProps()} aria-label="Expand all rows" />
                  {headers.map((header) => (
                    <TableHeader key={header.key} {...getHeaderProps({ header })}>
                      {header.header}
                    </TableHeader>
                  ))}
                  <TableHeader>Action</TableHeader>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((row) => {
                  const rawOrder = orders.find((o) => o.id === row.id)
                  const isCancelled = rawOrder?.status === 'Cancelled'
                  return (
                    <React.Fragment key={row.id}>
                      <TableExpandRow {...getRowProps({ row })} aria-label={`Expand order ${row.id}`}>
                        {row.cells.map((cell) => (
                          <TableCell key={cell.id}>
                            {cell.info.header === 'status' ? statusTag(cell.value) : cell.value}
                          </TableCell>
                        ))}
                        <TableCell>
                          {!isCancelled && (
                            <Button
                              kind="danger--ghost"
                              size="sm"
                              disabled={cancellingId === row.id}
                              onClick={() => handleCancel(row.id)}
                            >
                              {cancellingId === row.id ? 'Cancelling…' : 'Cancel'}
                            </Button>
                          )}
                        </TableCell>
                      </TableExpandRow>

                      {/* Expanded detail row */}
                      <TableExpandedRow colSpan={TOTAL_COLS + 1} {...getExpandedRowProps({ row })}>
                        <div style={{ padding: '0.75rem 1rem' }}>
                          <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cds-text-helper, #6f6f6f)', marginBottom: '0.5rem' }}>
                            Items in this order
                          </p>
                          {(rawOrder?.items || []).map((item, idx) => (
                            <div
                              key={`${item.book_id}-${idx}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.4rem 0',
                                borderBottom: idx < (rawOrder.items.length - 1) ? '1px solid var(--cds-border-subtle, #e0e0e0)' : 'none',
                                flexWrap: 'wrap',
                                gap: '0.5rem',
                              }}
                            >
                              <div>
                                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cds-text-primary, #161616)' }}>
                                  {item.title}
                                </p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-helper, #6f6f6f)' }}>
                                  Qty: {item.quantity}
                                </p>
                              </div>
                              <Tag type="green" size="sm">
                                {fmt(parseFloat(item.price) * item.quantity)}
                              </Tag>
                            </div>
                          ))}

                          {/* Address */}
                          {rawOrder?.address_name && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--cds-text-secondary)', marginTop: '0.75rem' }}>
                              📦 {rawOrder.address_name}, {rawOrder.city}, {rawOrder.state} {rawOrder.zip}
                            </p>
                          )}
                        </div>
                      </TableExpandedRow>
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DataTable>
    </div>
  )
}
