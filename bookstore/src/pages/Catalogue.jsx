import React, { useState, useEffect, useMemo } from 'react'
import {
  Grid,
  Column,
  Search,
  Tile,
  Button,
  Tag,
  SkeletonText,
  InlineNotification,
} from '@carbon/react'
import { Renew } from '@carbon/icons-react'
import CategoryFilter from '../components/CategoryFilter'
import BookCard from '../components/BookCard'
import { useCart } from '../context/CartContext'
import * as bookService from '../services/bookService'

export default function Catalogue() {
  const { addToCart } = useCart()

  const [books, setBooks]                   = useState([])
  const [categories, setCategories]         = useState(['All'])
  const [brands, setBrands]                 = useState(['All'])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState('')

  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedBrand, setSelectedBrand]       = useState('All')
  const [searchTerm, setSearchTerm]             = useState('')

  // ── fetch books from API whenever filters change ──────────────────────────
  useEffect(() => {
    setLoading(true)
    setError('')
    bookService.getBooks({ category: selectedCategory, brand: selectedBrand, search: searchTerm })
      .then(setBooks)
      .catch(() => setError('Could not load books. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [selectedCategory, selectedBrand, searchTerm])

  // ── fetch categories and brands once on mount ─────────────────────────────
  useEffect(() => {
    bookService.getCategories()
      .then((data) => setCategories(['All', ...data.map((c) => c.name)]))
      .catch(() => {})
    bookService.getBrands()
      .then((data) => setBrands(['All', ...data.map((b) => b.name)]))
      .catch(() => {})
  }, [])

  return (
    <div>
      <Grid>
        {/* ── Left sidebar: filters ── */}
        <Column sm={4} md={2} lg={3}>
          <CategoryFilter
            categories={categories}
            brands={brands}
            selectedCategory={selectedCategory}
            selectedBrand={selectedBrand}
            onCategoryChange={(c) => setSelectedCategory(c)}
            onBrandChange={(b) => setSelectedBrand(b)}
          />
        </Column>

        {/* ── Right content: search + grid ── */}
        <Column sm={4} md={6} lg={13}>
          {/* Search bar + result count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '240px' }}>
              <Search
                id="catalogue-search"
                labelText="Search books"
                placeholder="Search by title or author…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm('')}
                size="lg"
              />
            </div>
            {!loading && (
              <Tag type="gray" size="md">
                {books.length} {books.length === 1 ? 'result' : 'results'}
              </Tag>
            )}
          </div>

          {/* Error */}
          {error && (
            <InlineNotification
              kind="error"
              title={error}
              lowContrast
              hideCloseButton
              style={{ marginBottom: '1rem' }}
            />
          )}

          {/* Loading skeletons */}
          {loading && (
            <Grid narrow>
              {Array.from({ length: 6 }).map((_, i) => (
                <Column key={i} sm={4} md={4} lg={4} style={{ marginBottom: '1rem' }}>
                  <Tile style={{ padding: '1rem', height: '320px' }}>
                    <SkeletonText paragraph lineCount={5} />
                  </Tile>
                </Column>
              ))}
            </Grid>
          )}

          {/* Empty state */}
          {!loading && !error && books.length === 0 && (
            <Tile style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--cds-text-helper, #6f6f6f)' }}>
              <p style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No books found</p>
              <p style={{ fontSize: '0.875rem' }}>Try adjusting your search or filters.</p>
              <Button
                kind="ghost"
                size="sm"
                renderIcon={Renew}
                style={{ marginTop: '1rem' }}
                onClick={() => { setSelectedCategory('All'); setSelectedBrand('All'); setSearchTerm('') }}
              >
                Reset filters
              </Button>
            </Tile>
          )}

          {/* Book grid */}
          {!loading && books.length > 0 && (
            <Grid narrow>
              {books.map((book) => (
                <Column key={book.id} sm={4} md={4} lg={4} style={{ marginBottom: '1rem' }}>
                  <BookCard book={book} onAddToCart={addToCart} />
                </Column>
              ))}
            </Grid>
          )}
        </Column>
      </Grid>
    </div>
  )
}
