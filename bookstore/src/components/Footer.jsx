import React from 'react'
import { Link } from 'react-router-dom'
import { Grid, Column } from '@carbon/react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      style={{
        backgroundColor: 'var(--cds-background-inverse, #262626)',
        color: 'var(--cds-text-inverse, #f4f4f4)',
        padding: '2.5rem 0 0',
      }}
    >
      <Grid fullWidth>
        {/* About */}
        <Column sm={4} md={2} lg={4}>
          <p style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.875rem' }}>
            About Book Worm
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--cds-text-helper, #a8a8a8)', lineHeight: 1.6 }}>
            Your one-stop e-bookstore for every genre. Discover, read, and grow
            with thousands of titles at your fingertips.
          </p>
        </Column>

        {/* Categories */}
        <Column sm={4} md={3} lg={4}>
          <p style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.875rem' }}>
            Categories
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8rem', lineHeight: 2 }}>
            {['Fiction', 'Non-fiction', 'Science', 'Biography', 'Self-help', 'Children\'s'].map(
              (cat) => (
                <li key={cat}>
                  <Link
                    to="/catalogue"
                    style={{ color: 'var(--cds-text-helper, #a8a8a8)', textDecoration: 'none' }}
                  >
                    {cat}
                  </Link>
                </li>
              )
            )}
          </ul>
        </Column>

        {/* Contact */}
        <Column sm={4} md={3} lg={4}>
          <p style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.875rem' }}>
            Contact
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.8rem', color: 'var(--cds-text-helper, #a8a8a8)', lineHeight: 2 }}>
            <li>📧 support@bookworm.com</li>
            <li>📞 +1 (800) 555-READ</li>
            <li>🏢 123 Library Lane, Book City</li>
          </ul>
        </Column>
      </Grid>

      {/* Copyright bar */}
      <div
        style={{
          borderTop: '1px solid var(--cds-border-subtle, #393939)',
          marginTop: '2rem',
          padding: '1rem 1rem',
          fontSize: '0.75rem',
          color: 'var(--cds-text-helper, #a8a8a8)',
          textAlign: 'center',
        }}
      >
        © {year} Book Worm. All rights reserved.
      </div>
    </footer>
  )
}
