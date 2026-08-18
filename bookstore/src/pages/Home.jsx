import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Grid,
  Column,
  Tile,
  ClickableTile,
  Button,
  Tag,
  SkeletonText,
} from '@carbon/react'
import { ArrowRight, BookmarkAdd } from '@carbon/icons-react'
import BookCard from '../components/BookCard'
import { useCart } from '../context/CartContext'
import * as bookService from '../services/bookService'

const CATEGORY_META = {
  All:         { icon: '📚', color: '#0f62fe' },
  Fiction:     { icon: '🔮', color: '#6929c4' },
  Technology:  { icon: '💻', color: '#005d5d' },
  'Self Help': { icon: '🌱', color: '#198038' },
  Finance:     { icon: '💰', color: '#b28600' },
  History:     { icon: '🏛️',  color: '#9f1853' },
}

export default function Home() {
  const navigate = useNavigate()
  const { addToCart } = useCart()

  const [featuredBooks, setFeaturedBooks] = useState([])
  const [categories, setCategories]       = useState([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    Promise.all([
      bookService.getBooks(),
      bookService.getCategories(),
    ]).then(([books, cats]) => {
      setFeaturedBooks(books.slice(0, 4))
      setCategories(cats.map((c) => c.name).filter((c) => c !== 'All'))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* ── HERO ── */}
      <Tile
        style={{
          background: 'linear-gradient(135deg, #161616 0%, #262626 60%, #0f3058 100%)',
          color: '#ffffff',
          padding: '4rem 3rem',
          marginBottom: '2.5rem',
          borderRadius: '0',
          minHeight: '320px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '1rem',
        }}
      >
        <Tag type="blue" size="md" style={{ alignSelf: 'flex-start' }}>
          <BookmarkAdd size={12} style={{ marginRight: '4px' }} />
          Welcome to Book Worm
        </Tag>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, lineHeight: 1.15, color: '#ffffff', maxWidth: '640px' }}>
          Discover Your Next<br />
          <span style={{ color: '#78a9ff' }}>Great Read</span>
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#c6c6c6', maxWidth: '480px', lineHeight: 1.6 }}>
          Thousands of titles across every genre — fiction, technology, self-help, and more.
        </p>
        <div style={{ marginTop: '0.5rem' }}>
          <Button kind="primary" size="lg" renderIcon={ArrowRight} onClick={() => navigate('/catalogue')}>
            Browse Books
          </Button>
        </div>
      </Tile>

      {/* ── FEATURED BOOKS ── */}
      <section style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--cds-text-primary, #161616)' }}>
            Featured Books
          </h2>
          <Button kind="ghost" size="sm" renderIcon={ArrowRight} onClick={() => navigate('/catalogue')}>
            View all
          </Button>
        </div>

        {loading ? (
          <Grid>
            {Array.from({ length: 4 }).map((_, i) => (
              <Column key={i} sm={4} md={4} lg={4}>
                <Tile style={{ padding: '1rem', height: '320px' }}>
                  <SkeletonText paragraph lineCount={5} />
                </Tile>
              </Column>
            ))}
          </Grid>
        ) : (
          <Grid>
            {featuredBooks.map((book) => (
              <Column key={book.id} sm={4} md={4} lg={4}>
                <BookCard book={book} onAddToCart={addToCart} />
              </Column>
            ))}
          </Grid>
        )}
      </section>

      {/* ── BROWSE BY CATEGORY ── */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--cds-text-primary, #161616)', marginBottom: '1.25rem' }}>
          Browse by Category
        </h2>
        <Grid>
          {categories.map((cat) => {
            const meta = CATEGORY_META[cat] || { icon: '📖', color: '#0f62fe' }
            return (
              <Column key={cat} sm={2} md={2} lg={3}>
                <ClickableTile
                  onClick={() => navigate('/catalogue')}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '1.5rem 1rem',
                    textAlign: 'center',
                    borderTop: `3px solid ${meta.color}`,
                    background: 'var(--cds-layer, #ffffff)',
                    minHeight: '110px',
                  }}
                >
                  <span style={{ fontSize: '2rem', lineHeight: 1 }}>{meta.icon}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--cds-text-primary, #161616)' }}>
                    {cat}
                  </span>
                </ClickableTile>
              </Column>
            )
          })}
        </Grid>
      </section>
    </div>
  )
}
