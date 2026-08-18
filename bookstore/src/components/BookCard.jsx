import React from 'react'
import { ClickableTile, Tag, Button } from '@carbon/react'
import { ShoppingCartPlus, Star, StarFilled } from '@carbon/icons-react'

/**
 * Renders a single book as a Carbon ClickableTile.
 *
 * Props:
 *   book          – book data object from mockData
 *   onAddToCart   – (book) => void, called when "Add to Cart" is clicked
 */
export default function BookCard({ book, onAddToCart }) {
  const { title, author, price, image, image_url, delivery_date, deliveryDate, rating = 0 } = book
  const imageSource = image_url || image

  // Format delivery date: "Delivery by Mon, 21 Jul"
  const rawDeliveryDate = delivery_date || deliveryDate
  const formattedDelivery = rawDeliveryDate
    ? `Delivery by ${new Date(rawDeliveryDate).toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })}`
    : null

  // Build 5 star icons (filled up to Math.round(rating))
  const fullStars = Math.round(parseFloat(rating))
  const stars = Array.from({ length: 5 }, (_, i) =>
    i < fullStars ? (
      <StarFilled key={i} size={12} style={{ color: '#f1c21b' }} />
    ) : (
      <Star key={i} size={12} style={{ color: '#6f6f6f' }} />
    )
  )

  return (
    <ClickableTile
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        overflow: 'hidden',
        height: '100%',
        background: 'var(--cds-layer, #ffffff)',
        border: '1px solid var(--cds-border-subtle, #e0e0e0)',
      }}
      // Prevent the tile's built-in click from firing — button handles cart
      onClick={() => {}}
    >
      {/* Book cover image */}
      <div
        style={{
          width: '100%',
          aspectRatio: '3 / 4',
          overflow: 'hidden',
          background: 'var(--cds-layer-accent, #e8e8e8)',
          flexShrink: 0,
        }}
      >
        <img
          src={imageSource}
          alt={title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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
          padding: '0.75rem',
          gap: '0.35rem',
        }}
      >
        {/* Title */}
        <p
          style={{
            fontWeight: 600,
            fontSize: '0.875rem',
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
            fontSize: '0.75rem',
            color: 'var(--cds-text-helper, #6f6f6f)',
          }}
        >
          by {author}
        </p>

        {/* Star rating */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {stars}
          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--cds-text-helper, #6f6f6f)',
              marginLeft: '4px',
            }}
          >
            {parseFloat(rating).toFixed(1)}
          </span>
        </div>

        {/* Price */}
        <p
          style={{
            fontWeight: 700,
            fontSize: '1rem',
            color: 'var(--cds-text-primary, #161616)',
          }}
        >
          ${parseFloat(price).toFixed(2)}
        </p>

        {/* Delivery date tag */}
        {formattedDelivery && (
          <Tag type="green" size="sm" style={{ alignSelf: 'flex-start' }}>
            {formattedDelivery}
          </Tag>
        )}

        {/* Spacer to push button to bottom */}
        <div style={{ flex: 1 }} />

        {/* Add to Cart button */}
        <Button
          kind="primary"
          size="sm"
          renderIcon={ShoppingCartPlus}
          style={{ width: '100%', maxWidth: '100%', justifyContent: 'center' }}
          onClick={(e) => {
            e.stopPropagation()
            onAddToCart(book)
          }}
        >
          Add to Cart
        </Button>
      </div>
    </ClickableTile>
  )
}
