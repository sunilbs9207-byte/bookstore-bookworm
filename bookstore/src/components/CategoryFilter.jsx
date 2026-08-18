import React from 'react'
import {
  RadioButtonGroup,
  RadioButton,
  Tag,
} from '@carbon/react'

/**
 * Sidebar filter panel.
 *
 * Props:
 *   categories        – string[]  list of category names (include "All")
 *   brands            – string[]  list of brand names   (include "All")
 *   selectedCategory  – string    currently selected category
 *   selectedBrand     – string    currently selected brand
 *   onCategoryChange  – (value: string) => void
 *   onBrandChange     – (value: string) => void
 */
export default function CategoryFilter({
  categories = [],
  brands = [],
  selectedCategory = 'All',
  selectedBrand = 'All',
  onCategoryChange,
  onBrandChange,
}) {
  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        padding: '1rem 0',
      }}
    >
      {/* ── Category section ── */}
      <section>
        <p
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--cds-text-helper, #6f6f6f)',
            marginBottom: '0.75rem',
          }}
        >
          Category
        </p>

        <RadioButtonGroup
          legendText=""
          name="category-filter"
          valueSelected={selectedCategory}
          onChange={(value) => onCategoryChange && onCategoryChange(value)}
          orientation="vertical"
        >
          {categories.map((cat) => (
            <RadioButton key={cat} labelText={cat} value={cat} />
          ))}
        </RadioButtonGroup>
      </section>

      {/* ── Brand / Publisher section ── */}
      <section>
        <p
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--cds-text-helper, #6f6f6f)',
            marginBottom: '0.75rem',
          }}
        >
          Publisher
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {brands.map((brand) => {
            const isSelected = brand === selectedBrand
            return (
              <Tag
                key={brand}
                type={isSelected ? 'blue' : 'gray'}
                size="md"
                onClick={() => onBrandChange && onBrandChange(brand)}
                style={{ cursor: 'pointer' }}
              >
                {brand}
              </Tag>
            )
          })}
        </div>
      </section>
    </aside>
  )
}
