import { useState } from 'react'
import { FiMessageCircle, FiChevronDown } from 'react-icons/fi'
import { supabase } from '../supabaseClient'

// ─── Decorative SVG background ───────────────────────────────────────────────
function AuthBg() {
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="g1" cx="20%" cy="20%" r="60%">
          <stop offset="0%" stopColor="#6d28d9" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#6d28d9" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="g2" cx="85%" cy="75%" r="55%">
          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="g3" cx="60%" cy="10%" r="40%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g1)" />
      <rect width="100%" height="100%" fill="url(#g2)" />
      <rect width="100%" height="100%" fill="url(#g3)" />
      <circle cx="10%" cy="85%" r="120" fill="rgba(109,40,217,0.12)" />
      <circle cx="90%" cy="10%" r="90" fill="rgba(79,70,229,0.15)" />
      <circle cx="50%" cy="50%" r="200" fill="rgba(79,70,229,0.04)" />
      <pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="1.5" fill="rgba(255,255,255,0.07)" />
      </pattern>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  )
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const BASE_WRAPPER = {
  position: 'fixed', inset: 0,
  background: 'linear-gradient(135deg, #0d0d1a 0%, #13102a 40%, #1a1040 70%, #0f0f1e 100%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  overflow: 'hidden',
}

const INPUT_STYLE = {
  width: '100%', padding: '12px 16px', borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.12)',
  fontSize: 14, boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.07)',
  color: '#f0f0f0', outline: 'none',
  transition: 'border-color 0.2s',
}

const BTN_PRIMARY = {
  width: '100%', padding: '13px', borderRadius: 12, border: 'none',
  background: 'linear-gradient(135deg, #6d28d9, #4f46e5)',
  color: '#ffffff', fontSize: 15, fontWeight: 600,
  cursor: 'pointer', letterSpacing: '0.02em',
  boxShadow: '0 4px 20px rgba(79,70,229,0.4)',
  transition: 'opacity 0.2s, transform 0.15s',
}

const BTN_OUTLINE = {
  width: '100%', padding: '13px', borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'rgba(255,255,255,0.06)',
  color: '#e0e0ff', fontSize: 15, fontWeight: 500,
  cursor: 'pointer', letterSpacing: '0.02em',
  transition: 'background 0.2s',
}

const AUTH_KEYFRAMES = `
  @keyframes authFadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes authSlideIn {
    from { opacity: 0; transform: translateX(40px); }
    to   { opacity: 1; transform: translateX(0); }
  }
`

// ─── Logo mark ────────────────────────────────────────────────────────────────
function LogoMark({ size = 72, iconSize = 32, borderRadius = 22 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius,
      background: 'linear-gradient(135deg, #6d28d9, #4f46e5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 8px 32px rgba(79,70,229,0.5)',
    }}>
      <FiMessageCircle size={iconSize} color="#fff" aria-hidden="true" />
    </div>
  )
}

// ─── Landing screen ───────────────────────────────────────────────────────────
function LandingScreen({ onNavigate }) {
  return (
    <div style={BASE_WRAPPER}>
      <AuthBg />
      <div style={{
        position: 'relative', zIndex: 1, textAlign: 'center',
        padding: '0 24px', maxWidth: 400, width: '100%',
        animation: 'authFadeUp 0.5s ease both',
      }}>
        <div style={{ margin: '0 auto 28px' }}>
          <LogoMark />
        </div>

        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#ffffff', margin: '0 0 10px', letterSpacing: '-0.5px' }}>
          Welcome to Chat
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(200,190,255,0.7)', margin: '0 0 48px', lineHeight: 1.6 }}>
          Realtime messaging,<br />channels, and presence.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => onNavigate('login')} style={BTN_PRIMARY}>
            Login
          </button>
          <button onClick={() => onNavigate('register')} style={BTN_OUTLINE}>
            Create account
          </button>
        </div>
      </div>

      <style>{AUTH_KEYFRAMES}</style>
    </div>
  )
}

// ─── Login / Register screen ──────────────────────────────────────────────────
function AuthFormScreen({ mode, onNavigate }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const isLogin = mode === 'login'

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setSuccess('Check your email to confirm your account!')
    }

    setLoading(false)
  }

  const switchMode = () => {
    setError('')
    setSuccess('')
    setEmail('')
    setPassword('')
    onNavigate(isLogin ? 'register' : 'login')
  }

  return (
    <div style={BASE_WRAPPER}>
      <AuthBg />

      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 400,
        padding: '0 20px', boxSizing: 'border-box',
        animation: 'authSlideIn 0.35s ease both',
      }}>
        {/* Back */}
        <button
          onClick={() => onNavigate('landing')}
          style={{
            background: 'none', border: 'none', color: 'rgba(180,170,255,0.6)',
            cursor: 'pointer', fontSize: 13,
            display: 'inline-flex', alignItems: 'center', gap: 6,
            marginBottom: 28, padding: 0,
          }}
        >
          <FiChevronDown style={{ transform: 'rotate(90deg)' }} size={16} aria-hidden="true" />
          Back
        </button>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20, padding: '32px 28px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 48px rgba(0,0,0,0.4)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <LogoMark size={42} iconSize={20} borderRadius={12} />
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#f0f0ff', letterSpacing: '-0.3px' }}>
                {isLogin ? 'Welcome back' : 'Create account'}
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(180,170,255,0.6)', margin: '2px 0 0' }}>
                {isLogin ? 'Login to your account' : 'Sign up for free'}
              </p>
            </div>
          </div>

          {/* Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={INPUT_STYLE}
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={INPUT_STYLE}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>

          {/* Feedback */}
          {error && (
            <p style={{
              color: '#f87171', fontSize: 13, margin: '14px 0 0',
              padding: '10px 14px',
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10,
            }}>
              {error}
            </p>
          )}
          {success && (
            <p style={{
              color: '#4ade80', fontSize: 13, margin: '14px 0 0',
              padding: '10px 14px',
              background: 'rgba(74,222,128,0.1)',
              border: '1px solid rgba(74,222,128,0.25)',
              borderRadius: 10,
            }}>
              {success}
            </p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ ...BTN_PRIMARY, marginTop: 20, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
          </button>

          {/* Switch mode */}
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(180,170,255,0.5)' }}>
            {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
            <span onClick={switchMode} style={{ color: '#a78bfa', cursor: 'pointer', fontWeight: 600 }}>
              {isLogin ? 'Register' : 'Login'}
            </span>
          </p>
        </div>
      </div>

      <style>{AUTH_KEYFRAMES}</style>
    </div>
  )
}

// ─── Authentication — public export ──────────────────────────────────────────
export default function Authentication() {
  // 'landing' | 'login' | 'register'
  const [screen, setScreen] = useState('landing')

  if (screen === 'landing') {
    return <LandingScreen onNavigate={setScreen} />
  }

  return <AuthFormScreen mode={screen} onNavigate={setScreen} />
}