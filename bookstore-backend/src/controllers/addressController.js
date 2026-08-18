const pool = require('../config/db')

// ── GET /api/addresses ────────────────────────────────────────────────────────
// Return all addresses for the authenticated user
const getAddresses = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, line1, line2, city, state, zip, country, is_default
       FROM addresses
       WHERE user_id = $1
       ORDER BY is_default DESC, id ASC`,
      [req.user.id]
    )
    res.json(result.rows)
  } catch (err) {
    console.error('Get addresses error:', err)
    res.status(500).json({ error: 'Server error fetching addresses' })
  }
}

// ── POST /api/addresses ───────────────────────────────────────────────────────
// Insert a new address; if is_default is true, demote all existing ones first
const addAddress = async (req, res) => {
  const { name, line1, line2, city, state, zip, country, is_default = false } = req.body

  // Basic field validation
  if (!name || !line1 || !city || !state || !zip || !country) {
    return res.status(400).json({
      error: 'name, line1, city, state, zip and country are required',
    })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // If the new address is the default, clear the flag on all existing ones
    if (is_default) {
      await client.query(
        `UPDATE addresses SET is_default = false WHERE user_id = $1`,
        [req.user.id]
      )
    }

    const result = await client.query(
      `INSERT INTO addresses (user_id, name, line1, line2, city, state, zip, country, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name, line1, line2, city, state, zip, country, is_default`,
      [req.user.id, name, line1, line2 || null, city, state, zip, country, is_default]
    )

    await client.query('COMMIT')
    res.status(201).json({
      message: 'Address added successfully',
      address: result.rows[0],
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Add address error:', err)
    res.status(500).json({ error: 'Server error adding address' })
  } finally {
    client.release()
  }
}

// ── PUT /api/addresses/:id ────────────────────────────────────────────────────
// Update an address; only allowed if it belongs to the authenticated user
const updateAddress = async (req, res) => {
  const { id } = req.params
  const { name, line1, line2, city, state, zip, country, is_default } = req.body

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Ownership check
    const existing = await client.query(
      `SELECT id FROM addresses WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    )
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Address not found' })
    }

    // If promoting this address to default, demote all others first
    if (is_default) {
      await client.query(
        `UPDATE addresses SET is_default = false WHERE user_id = $1 AND id != $2`,
        [req.user.id, id]
      )
    }

    const result = await client.query(
      `UPDATE addresses
       SET
         name       = COALESCE($1, name),
         line1      = COALESCE($2, line1),
         line2      = $3,
         city       = COALESCE($4, city),
         state      = COALESCE($5, state),
         zip        = COALESCE($6, zip),
         country    = COALESCE($7, country),
         is_default = COALESCE($8, is_default)
       WHERE id = $9 AND user_id = $10
       RETURNING id, name, line1, line2, city, state, zip, country, is_default`,
      [name, line1, line2 ?? null, city, state, zip, country, is_default, id, req.user.id]
    )

    await client.query('COMMIT')
    res.json({
      message: 'Address updated successfully',
      address: result.rows[0],
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Update address error:', err)
    res.status(500).json({ error: 'Server error updating address' })
  } finally {
    client.release()
  }
}

// ── DELETE /api/addresses/:id ─────────────────────────────────────────────────
// Delete an address; only allowed if it belongs to the user and is not the last one
const deleteAddress = async (req, res) => {
  const { id } = req.params
  try {
    // Ownership check
    const existing = await pool.query(
      `SELECT id FROM addresses WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    )
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Address not found' })
    }

    // Count guard — cannot delete the last remaining address
    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM addresses WHERE user_id = $1`,
      [req.user.id]
    )
    if (parseInt(countResult.rows[0].total, 10) <= 1) {
      return res.status(400).json({
        error: 'Cannot delete the only address. Add another address first.',
      })
    }

    await pool.query(
      `DELETE FROM addresses WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    )
    res.json({ message: 'Address deleted successfully' })
  } catch (err) {
    console.error('Delete address error:', err)
    res.status(500).json({ error: 'Server error deleting address' })
  }
}

module.exports = {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
}
