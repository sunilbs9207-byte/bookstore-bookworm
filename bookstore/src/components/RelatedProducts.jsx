import React from 'react'
import {
  Grid,
  Column,
  Tile,
  ClickableTile,
  Button,
  Tag,
} from '@carbon/react'
import { ShoppingCartPlus } from '@carbon/icons-react'

/**
 * Related Products — horizontal scrollable strip of books from
 * the same category as `currentBook`, excluding the current book itself.
 *
 * Props:
 *   currentBook  – the book being viewed  { id, category, … }
 *   allBooks     – full books array from mockData
 *   onAddToCart  – (book) => void
 */
export default function RelatedProducts({ currentBook, allBooks = [], onAddToCart }) {
  if (!currentBook) return null

  // ── filter: same category, not the current book, max 4 ───────────────────
  const related = allBooks
    .filter(
      (b) =>
        b.id !== currentBook.id &&
        b.category === currentBook.category
    )
    .slice(0, 4)

  // ── section heading ───────────────────────────────────────────────────────
  const SectionHeading = () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}
    >
      <h2
        style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          color: 'var(--cds-text-primary, #161616)',
        }}
      >
        Related Products
      </h2>
      <Tag type="gray" size="sm">
        {currentBook.category}
      </Tag>
    </div>
  )

  // ── empty state ───────────────────────────────────────────────────────────
  if (related.length === 0) {
    return (
      <section>
        <SectionHeading />
        <Tile
          style={{
            textAlign: 'center',
            padding: '2rem 1.5rem',
            background: 'var(--cds-layer, #ffffff)',
            border: '1px solid var(--cds-border-subtle, #e0e0e0)',
          }}
        >
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--cds-text-helper, #6f6f6f)',
            }}
          >
            No related products found in this category.
          </p>
        </Tile>
      </section>
    )
  }

  // ── filled: horizontal scrollable row ────────────────────────────────────
  return (
    <section>
      <SectionHeading />

      {/*
        Outer wrapper enables horizontal scroll when cards overflow
        on small viewports while still using Carbon Grid columns on wider ones.
      */}
      <div
        style={{
          overflowX: 'auto',
          /* Negative margin trick so the scroll container hugs the grid gutters */
          marginLeft: '-1rem',
          marginRight: '-1rem',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          paddingBottom: '0.5rem', /* room for scrollbar */
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            /* Each card fixed at 200px min so they stay side-by-side */
            minWidth: 'max-content',
          }}
        >
          {related.map((book) => (
            <RelatedBookTile
              key={book.id}
              book={book}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// ── individual card ───────────────────────────────────────────────────────────
function RelatedBookTile({ book, onAddToCart }) {
  const { title, author, price, image, deliveryDate } = book

  const formattedDelivery = deliveryDate
    ? `Delivery by ${new Date(deliveryDate).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })}`
    : null

  return (
    <ClickableTile
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        overflow: 'hidden',
        width: '180px',
        flexShrink: 0,
        background: 'var(--cds-layer, #ffffff)',
        border: '1px solid var(--cds-border-subtle, #e0e0e0)',
      }}
      onClick={() => {}}
    >
      {/* Cover image */}
      <div
        style={{
          width: '100%',
          height: '200px',
          overflow: 'hidden',
          background: 'var(--cds-layer-accent, #e8e8e8)',
          flexShrink: 0,
        }}
      >
        <img
          src={image}
          alt={title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
          onError={(e) => {
            e.target.style.display = 'none'
          }}
        />
      </div>

      {/* Card body */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          padding: '0.625rem 0.75rem',
          gap: '0.3rem',
        }}
      >
        {/* Title — clamp to 2 lines */}
        <p
          style={{
            fontWeight: 600,
            fontSize: '0.8125rem',
            lineHeight: 1.3,
            color: 'var(--cds-text-primary, #161616)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </p>

        {/* Author */}
        <p
          style={{
            fontSize: '0.6875rem',
            color: 'var(--cds-text-helper, #6f6f6f)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          by {author}
        </p>

        {/* Price */}
        <p
          style={{
            fontWeight: 700,
            fontSize: '0.9375rem',
            color: 'var(--cds-text-primary, #161616)',
          }}
        >
          ${price.toFixed(2)}
        </p>

        {/* Delivery tag */}
        {formattedDelivery && (
          <Tag
            type="green"
            size="sm"
            style={{ alignSelf: 'flex-start', marginTop: '0.1rem' }}
          >
            {formattedDelivery}
          </Tag>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Add to Cart */}
        <Button
          kind="primary"
          size="sm"
          renderIcon={ShoppingCartPlus}
          style={{
            width: '100%',
            maxWidth: '100%',
            justifyContent: 'center',
            marginTop: '0.4rem',
          }}
          onClick={(e) => {
            e.stopPropagation()
            onAddToCart && onAddToCart(book)
          }}
        >
          Add to Cart
        </Button>
      </div>
    </ClickableTile>
  )
}
