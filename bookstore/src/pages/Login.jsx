import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Grid,
  Column,
  Tile,
  Form,
  Stack,
  TextInput,
  PasswordInput,
  Button,
  Link,
  InlineNotification,
} from '@carbon/react'
import { Login as LoginIcon, UserFollow } from '@carbon/icons-react'
import { useCart } from '../context/CartContext'
import * as authService from '../services/authService'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useCart()

  const [mode, setMode] = useState('login') // 'login' | 'register'

  // Shared fields
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')

  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [touched, setTouched]   = useState(false)

  const isRegister = mode === 'register'

  // Field-level validation flags (only after submit attempt)
  const nameInvalid     = isRegister && touched && name.trim() === ''
  const emailInvalid    = touched && email.trim() === ''
  const passwordInvalid = touched && password === ''
  const confirmInvalid  = isRegister && touched && confirm !== password

  function switchMode(next) {
    setMode(next)
    setError('')
    setTouched(false)
    setName('')
    setEmail('')
    setPassword('')
    setConfirm('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setTouched(true)

    // Basic presence checks
    if (isRegister && !name.trim()) {
      setError('Please fill in all fields.')
      return
    }
    if (!email.trim() || !password) {
      setError('Please fill in all fields.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }
    if (isRegister && password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setError('')
    setLoading(true)

    try {
      if (isRegister) {
        const data = await authService.register(name.trim(), email.trim(), password)
        // Auto-login after registration
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        await login(email.trim(), password)
      } else {
        await login(email.trim(), password)
      }
      navigate('/catalogue')
    } catch (err) {
      setError(err.message || (isRegister ? 'Registration failed.' : 'Login failed.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Grid fullWidth style={{ minHeight: '80vh', alignItems: 'center' }}>
      <Column
        sm={4}
        md={{ span: 4, offset: 2 }}
        lg={{ span: 6, offset: 5 }}
      >
        <Tile
          style={{
            padding: '2.5rem 2rem',
            background: 'var(--cds-layer, #ffffff)',
            border: '1px solid var(--cds-border-subtle, #e0e0e0)',
          }}
        >
          {/* ── Header ── */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <p
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--cds-text-helper, #6f6f6f)',
                marginBottom: '0.5rem',
              }}
            >
              Book Worm
            </p>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--cds-text-primary, #161616)',
                lineHeight: 1.2,
              }}
            >
              {isRegister ? 'Create an account' : 'Welcome back'}
            </h1>
            <p
              style={{
                marginTop: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--cds-text-secondary, #525252)',
              }}
            >
              {isRegister
                ? 'Fill in the details below to get started'
                : 'Sign in to your account to continue'}
            </p>
          </div>

          {/* ── Error notification ── */}
          {error && (
            <InlineNotification
              kind="error"
              title={isRegister ? 'Registration failed:' : 'Login failed:'}
              subtitle={error}
              lowContrast
              hideCloseButton={false}
              onClose={() => setError('')}
              style={{ marginBottom: '1.25rem', maxWidth: '100%' }}
            />
          )}

          {/* ── Form ── */}
          <Form onSubmit={handleSubmit} noValidate>
            <Stack gap={6}>
              {isRegister && (
                <TextInput
                  id="register-name"
                  type="text"
                  labelText="Full name"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  invalid={nameInvalid}
                  invalidText="Full name is required."
                  autoComplete="name"
                />
              )}

              <TextInput
                id="login-email"
                type="email"
                labelText="Email address"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                invalid={emailInvalid}
                invalidText="Email address is required."
                autoComplete="email"
              />

              <PasswordInput
                id="login-password"
                labelText="Password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                invalid={passwordInvalid}
                invalidText="Password is required."
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />

              {isRegister && (
                <PasswordInput
                  id="register-confirm"
                  labelText="Confirm password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  invalid={confirmInvalid}
                  invalidText="Passwords do not match."
                  autoComplete="new-password"
                />
              )}

              <Button
                type="submit"
                kind="primary"
                size="lg"
                renderIcon={isRegister ? UserFollow : LoginIcon}
                disabled={loading}
                style={{ width: '100%', maxWidth: '100%', justifyContent: 'center' }}
              >
                {loading
                  ? isRegister ? 'Creating account…' : 'Signing in…'
                  : isRegister ? 'Create account' : 'Sign in'}
              </Button>
            </Stack>
          </Form>

          {/* ── Mode toggle ── */}
          <p
            style={{
              marginTop: '1.5rem',
              textAlign: 'center',
              fontSize: '0.875rem',
              color: 'var(--cds-text-secondary, #525252)',
            }}
          >
            {isRegister ? (
              <>
                Already have an account?{' '}
                <Link href="#" onClick={(e) => { e.preventDefault(); switchMode('login') }}>
                  Sign in
                </Link>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <Link href="#" onClick={(e) => { e.preventDefault(); switchMode('register') }}>
                  Register
                </Link>
              </>
            )}
          </p>
        </Tile>
      </Column>
    </Grid>
  )
}
