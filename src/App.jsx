import { useEffect, useState, useRef, useCallback } from 'react'
import { FiMenu, FiMessageCircle, FiMoon, FiSend, FiSmile, FiSun, FiX, FiChevronDown, FiCornerUpLeft, FiUsers } from 'react-icons/fi'
import { supabase } from './supabaseClient'

const ROOMS = ['general', 'random', 'dev', 'design']

const theme = {
  light: {
    bg: '#ffffff', sidebar: '#f7f7f7', border: '#e0e0e0',
    text: '#111111', textMuted: '#666666', textFaint: '#999999',
    input: '#f3f3f3', activeRoom: '#e8e8e8', activRoomText: '#111111',
    bubbleSelf: '#111111', bubbleSelfText: '#ffffff',
    bubbleOther: '#f0f0f0', bubbleOtherText: '#111111',
    button: '#111111', buttonText: '#ffffff',
    overlay: 'rgba(0,0,0,0.3)',
    avatarBg: '#e0e0e0', avatarText: '#555555',
    headerBg: '#ffffff',
    badgeBg: '#ef4444', badgeText: '#ffffff',
    scrollBtnBg: '#111111', scrollBtnText: '#ffffff',
    replyBg: 'rgba(0,0,0,0.06)',
    replyBorder: '#aaaaaa',
    replyPreviewBg: '#f0f0f0',
    replyPreviewBorder: '#cccccc',
    onlineDot: '#22c55e',
    presenceBg: '#f0f0f0',
  },
  dark: {
    bg: '#131318', sidebar: '#0e0e13', border: '#2a2a35',
    text: '#f0f0f0', textMuted: '#888899', textFaint: '#444455',
    input: '#1e1e28', activeRoom: '#2a2a3a', activRoomText: '#a0a0ff',
    bubbleSelf: '#4f46e5', bubbleSelfText: '#ffffff',
    bubbleOther: '#1e1e28', bubbleOtherText: '#e0e0f0',
    button: '#4f46e5', buttonText: '#ffffff',
    overlay: 'rgba(0,0,0,0.6)',
    avatarBg: '#2a2a3a', avatarText: '#8888cc',
    headerBg: '#0e0e13',
    badgeBg: '#ef4444', badgeText: '#ffffff',
    scrollBtnBg: '#4f46e5', scrollBtnText: '#ffffff',
    replyBg: 'rgba(255,255,255,0.07)',
    replyBorder: '#6060aa',
    replyPreviewBg: '#1a1a28',
    replyPreviewBorder: '#3a3a55',
    onlineDot: '#22c55e',
    presenceBg: '#1e1e28',
  }
}

function getInitials(name) {
  return name.slice(0, 2).toUpperCase()
}

function Avatar({ name, size = 32 }) {
  const colors = ['#4f46e5', '#7c3aed', '#db2777', '#0891b2', '#059669', '#d97706']
  const idx = name.charCodeAt(0) % colors.length
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: colors[idx], color: '#ffffff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 500, flexShrink: 0, userSelect: 'none'
    }}>
      {getInitials(name)}
    </div>
  )
}

function formatTime(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (isToday) return timeStr
  if (isYesterday) return `Yesterday ${timeStr}`
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ' ' + timeStr
}

function formatDateDivider(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()
  if (isToday) return 'Today'
  if (isYesterday) return 'Yesterday'
  return date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })
}

function ThemeToggleContent({ dark }) {
  return (
    <>
      {dark ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}
      {dark ? 'Light' : 'Dark'}
    </>
  )
}

// ─── Online presence panel ────────────────────────────────────────────────────
function OnlineList({ onlineUsers, t, isMobile }) {
  const [open, setOpen] = useState(false)

  if (isMobile) {
    // on mobile, show as a small pill in header — handled separately
    return null
  }

  return (
    <div style={{ borderTop: `1px solid ${t.border}`, padding: '10px 8px' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}>
        <FiUsers size={14} color={t.textMuted} aria-hidden="true" />
        <span style={{ fontSize: 11, color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, flex: 1 }}>Online</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: t.onlineDot }}>
          {onlineUsers.length}
        </span>
      </div>
      {open && (
        <div style={{ marginTop: 4 }}>
          {onlineUsers.map(u => (
            <div key={u} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 6 }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Avatar name={u} size={22} />
                <span style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 7, height: 7, borderRadius: '50%',
                  background: t.onlineDot, border: `1.5px solid ${t.sidebar}`
                }} />
              </div>
              <span style={{ fontSize: 13, color: t.textMuted }}>{u}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SidebarContent({ t, isMobile, setSidebarOpen, switchRoom, room, username, dark, setDark, unreadCounts, onlineUsers }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.sidebar }}>
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiMessageCircle size={18} color={t.textMuted} aria-hidden="true" />
          <span style={{ fontWeight: 600, fontSize: 15, color: t.text }}>Chat</span>
        </div>
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)} aria-label="Close sidebar"
            style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 18, padding: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiX aria-hidden="true" />
          </button>
        )}
      </div>

      <div style={{ padding: '12px 8px', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: 11, color: t.textFaint, padding: '0 10px 8px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>Channels</div>
        {ROOMS.map(r => {
          const count = unreadCounts[r] || 0
          return (
            <div key={r} onClick={() => switchRoom(r)}
              style={{
                padding: '9px 12px', cursor: 'pointer', borderRadius: 8, marginBottom: 2,
                fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
                background: room === r ? t.activeRoom : 'transparent',
                color: room === r ? t.activRoomText : t.textMuted,
                fontWeight: room === r || count > 0 ? 500 : 400,
              }}>
              <span style={{ opacity: 0.5, fontSize: 15 }}>#</span>
              <span style={{ flex: 1 }}>{r}</span>
              {count > 0 && room !== r && (
                <span style={{
                  background: t.badgeBg, color: t.badgeText,
                  borderRadius: 10, fontSize: 11, fontWeight: 600,
                  padding: '1px 6px', minWidth: 18, textAlign: 'center'
                }}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Online presence list — desktop only */}
      <OnlineList onlineUsers={onlineUsers} t={t} isMobile={isMobile} />

      <div style={{ padding: '12px', borderTop: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ position: 'relative' }}>
            <Avatar name={username} size={30} />
            <span style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 8, height: 8, borderRadius: '50%',
              background: t.onlineDot, border: `2px solid ${t.sidebar}`
            }} />
          </div>
          <span style={{ fontSize: 13, color: t.textMuted, fontWeight: 500 }}>{username}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => supabase.auth.signOut()}
            style={{ flex: 1, padding: '7px', borderRadius: 8, border: `1px solid ${t.border}`, background: 'none', fontSize: 12, cursor: 'pointer', color: t.textMuted }}>
            Logout
          </button>
          <button onClick={() => setDark(!dark)}
            style={{ flex: 1, padding: '7px', borderRadius: 8, border: `1px solid ${t.border}`, background: 'none', fontSize: 12, cursor: 'pointer', color: t.textMuted, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <ThemeToggleContent dark={dark} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  const t = dark ? theme.dark : theme.light

  if (loading) return <div style={{ padding: 32, color: '#888' }}>Loading...</div>
  if (!session) return <AuthPage dark={dark} setDark={setDark} t={t} />
  return <ChatPage session={session} dark={dark} setDark={setDark} t={t} />
}

// ─── Decorative SVG blobs for auth background ────────────────────────────────
function AuthBg() {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
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
      {/* Decorative circles */}
      <circle cx="10%" cy="85%" r="120" fill="rgba(109,40,217,0.12)" />
      <circle cx="90%" cy="10%" r="90" fill="rgba(79,70,229,0.15)" />
      <circle cx="50%" cy="50%" r="200" fill="rgba(79,70,229,0.04)" />
      {/* Dot grid pattern */}
      <pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
        <circle cx="1.5" cy="1.5" r="1.5" fill="rgba(255,255,255,0.07)" />
      </pattern>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  )
}

function AuthPage({ dark, setDark, t }) {
  // screen: 'landing' | 'login' | 'register'
  const [screen, setScreen] = useState('landing')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const isLogin = screen === 'login'

  const goTo = (s) => {
    setError('')
    setSuccess('')
    setEmail('')
    setPassword('')
    setScreen(s)
  }

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

  // shared wrapper
  const base = {
    position: 'fixed', inset: 0,
    background: 'linear-gradient(135deg, #0d0d1a 0%, #13102a 40%, #1a1040 70%, #0f0f1e 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.12)',
    fontSize: 14, boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.07)',
    color: '#f0f0f0', outline: 'none',
    transition: 'border-color 0.2s',
  }

  const btnPrimary = {
    width: '100%', padding: '13px', borderRadius: 12, border: 'none',
    background: 'linear-gradient(135deg, #6d28d9, #4f46e5)',
    color: '#ffffff', fontSize: 15, fontWeight: 600,
    cursor: 'pointer', letterSpacing: '0.02em',
    boxShadow: '0 4px 20px rgba(79,70,229,0.4)',
    transition: 'opacity 0.2s, transform 0.15s',
  }

  const btnOutline = {
    width: '100%', padding: '13px', borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(255,255,255,0.06)',
    color: '#e0e0ff', fontSize: 15, fontWeight: 500,
    cursor: 'pointer', letterSpacing: '0.02em',
    transition: 'background 0.2s',
  }

  // ── Landing screen ──────────────────────────────────────────────────────────
  if (screen === 'landing') {
    return (
      <div style={base}>
        <AuthBg />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px', maxWidth: 400, width: '100%', animation: 'authFadeUp 0.5s ease both' }}>
          {/* Logo */}
          <div style={{
            width: 72, height: 72, borderRadius: 22, margin: '0 auto 28px',
            background: 'linear-gradient(135deg, #6d28d9, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(79,70,229,0.5)',
          }}>
            <FiMessageCircle size={32} color="#fff" aria-hidden="true" />
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#ffffff', margin: '0 0 10px', letterSpacing: '-0.5px' }}>
            Welcome to Chat
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(200,190,255,0.7)', margin: '0 0 48px', lineHeight: 1.6 }}>
            Realtime messaging,<br />channels, and presence.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={() => goTo('login')} style={btnPrimary}>
              Login
            </button>
            <button onClick={() => goTo('register')} style={btnOutline}>
              Create account
            </button>
          </div>


        </div>

        <style>{`
          @keyframes authFadeUp {
            from { opacity: 0; transform: translateY(24px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes authSlideIn {
            from { opacity: 0; transform: translateX(40px); }
            to   { opacity: 1; transform: translateX(0); }
          }
        `}</style>
      </div>
    )
  }

  // ── Login / Register screen ─────────────────────────────────────────────────
  return (
    <div style={base}>
      <AuthBg />
      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 400,
        padding: '0 20px', boxSizing: 'border-box',
        animation: 'authSlideIn 0.35s ease both',
      }}>
        {/* Back button */}
        <button onClick={() => goTo('landing')}
          style={{ background: 'none', border: 'none', color: 'rgba(180,170,255,0.6)', cursor: 'pointer', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 28, padding: 0 }}>
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
          {/* Icon + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'linear-gradient(135deg, #6d28d9, #4f46e5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(79,70,229,0.4)', flexShrink: 0,
            }}>
              <FiMessageCircle size={20} color="#fff" aria-hidden="true" />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#f0f0ff', letterSpacing: '-0.3px' }}>
                {isLogin ? 'Welcome back' : 'Create account'}
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(180,170,255,0.6)', margin: '2px 0 0' }}>
                {isLogin ? 'Login to your account' : 'Sign up for free'}
              </p>
            </div>
          </div>

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />
            <input
              type="password" placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ color: '#f87171', fontSize: 13, margin: '14px 0 0', padding: '10px 14px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10 }}>
              {error}
            </p>
          )}
          {success && (
            <p style={{ color: '#4ade80', fontSize: 13, margin: '14px 0 0', padding: '10px 14px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 10 }}>
              {success}
            </p>
          )}

          <button onClick={handleSubmit} disabled={loading}
            style={{ ...btnPrimary, marginTop: 20, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
          </button>

          {/* Switch */}
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(180,170,255,0.5)' }}>
            {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
            <span
              onClick={() => goTo(isLogin ? 'register' : 'login')}
              style={{ color: '#a78bfa', cursor: 'pointer', fontWeight: 600 }}>
              {isLogin ? 'Register' : 'Login'}
            </span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes authFadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes authSlideIn {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}

function ChatPage({ session, dark, setDark, t }) {
  const [room, setRoom] = useState('general')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typingUsers, setTypingUsers] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [unreadCounts, setUnreadCounts] = useState({})
  const [replyTo, setReplyTo] = useState(null)       // { id, username, content }
  const [onlineUsers, setOnlineUsers] = useState([]) // list of usernames online in current room
  const bottomRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const channelRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const isAtBottomRef = useRef(true)
  const inputRef = useRef(null)
  const username = session.user.email.split('@')[0]

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const atBottom = distFromBottom < 80
    isAtBottomRef.current = atBottom
    setShowScrollBtn(!atBottom)
  }, [])

  useEffect(() => {
    setMessages([])
    setTypingUsers([])
    setReplyTo(null)
    setOnlineUsers([])

    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages').select('*').eq('room', room)
        .order('created_at', { ascending: true }).limit(50)
      if (data) {
        setMessages(data)
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 50)
      }
    }
    loadMessages()

    const channel = supabase.channel(`room:${room}`)

    channel
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room=eq.${room}` },
        (payload) => {
          setMessages(prev => {
            // Avoid duplicate if optimistic update already added it
            if (prev.find(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const all = Object.values(state).flat()

        // Typing
        const typing = all
          .filter(p => p.username !== username && p.isTyping)
          .map(p => p.username)
        setTypingUsers(typing)

        // Online users (unique usernames)
        const online = [...new Set(all.map(p => p.username))]
        setOnlineUsers(online)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        setOnlineUsers(prev => {
          const added = newPresences.map(p => p.username)
          return [...new Set([...prev, ...added])]
        })
      })
      .on('presence', { event: 'leave' }, () => {
        // Re-sync on leave
        const state = channel.presenceState()
        const online = [...new Set(Object.values(state).flat().map(p => p.username))]
        setOnlineUsers(online)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ username, isTyping: false })
        }
      })

    channelRef.current = channel
    return () => supabase.removeChannel(channel)
  }, [room])

  // Unread badges for other rooms
  useEffect(() => {
    const otherRooms = ROOMS.filter(r => r !== room)
    const subs = otherRooms.map(r => {
      const ch = supabase.channel(`unread:${r}`)
      ch.on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room=eq.${r}` },
        (payload) => {
          if (payload.new.username !== username) {
            setUnreadCounts(prev => ({ ...prev, [r]: (prev[r] || 0) + 1 }))
          }
        }
      ).subscribe()
      return ch
    })
    return () => subs.forEach(ch => supabase.removeChannel(ch))
  }, [room])

  // Auto-scroll
  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, typingUsers])

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowScrollBtn(false)
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
    if (!channelRef.current) return
    channelRef.current.track({ username, isTyping: true })
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      channelRef.current?.track({ username, isTyping: false })
    }, 1500)
  }

  const handleReply = (msg) => {
    setReplyTo({ id: msg.id, username: msg.username, content: msg.content })
    inputRef.current?.focus()
  }

  const cancelReply = () => setReplyTo(null)

  const sendMessage = async () => {
    if (!input.trim()) return
    const content = input.trim()
    const replyData = replyTo ? { id: replyTo.id, username: replyTo.username, content: replyTo.content } : null
    setInput('')
    setReplyTo(null)
    clearTimeout(typingTimeoutRef.current)
    channelRef.current?.track({ username, isTyping: false })

    const optimisticMsg = {
      id: `opt-${Date.now()}`,
      username,
      content,
      room,
      created_at: new Date().toISOString(),
      reply_to: replyData,
    }
    setMessages(prev => [...prev, optimisticMsg])
    isAtBottomRef.current = true
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 30)

    await supabase.from('messages').insert({ username, content, room, reply_to: replyData })
  }

  const switchRoom = (r) => {
    setUnreadCounts(prev => ({ ...prev, [r]: 0 }))
    setMessages([])
    setTypingUsers([])
    setReplyTo(null)
    setRoom(r)
    isAtBottomRef.current = true
    setShowScrollBtn(false)
    if (isMobile) setSidebarOpen(false)
  }

  const typingText = typingUsers.length === 1
    ? `${typingUsers[0]} is typing...`
    : typingUsers.length > 1
    ? `${typingUsers.join(', ')} are typing...`
    : ''

  const getDateKey = (iso) => new Date(iso).toDateString()

  // Truncate quoted content for preview
  const truncate = (str, n = 60) => str.length > n ? str.slice(0, n) + '…' : str

  return (
    <div style={{ display: 'flex', height: '100vh', background: t.bg, color: t.text, position: 'relative', overflow: 'hidden' }}>

      {!isMobile && (
        <div style={{ width: 220, borderRight: `1px solid ${t.border}`, flexShrink: 0 }}>
          <SidebarContent t={t} isMobile={isMobile} setSidebarOpen={setSidebarOpen}
            switchRoom={switchRoom} room={room} username={username}
            dark={dark} setDark={setDark} unreadCounts={unreadCounts} onlineUsers={onlineUsers} />
        </div>
      )}

      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: t.overlay, zIndex: 10 }} />
      )}

      {isMobile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: 260, zIndex: 20,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          boxShadow: sidebarOpen ? '8px 0 32px rgba(0,0,0,0.25)' : 'none'
        }}>
          <SidebarContent t={t} isMobile={isMobile} setSidebarOpen={setSidebarOpen}
            switchRoom={switchRoom} room={room} username={username}
            dark={dark} setDark={setDark} unreadCounts={unreadCounts} onlineUsers={onlineUsers} />
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header */}
        <div style={{
          padding: isMobile ? '10px 14px' : '12px 20px',
          borderBottom: `1px solid ${t.border}`,
          background: t.headerBg,
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0
        }}>
          {isMobile && (
            <button onClick={() => setSidebarOpen(true)} aria-label="Open sidebar"
              style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 22, padding: 0, lineHeight: 1, flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>
              <FiMenu aria-hidden="true" />
            </button>
          )}
          <span style={{ color: t.textFaint, fontSize: 18, fontWeight: 300 }}>#</span>
          <span style={{ fontWeight: 600, fontSize: 15, color: t.text }}>{room}</span>

          {/* Online count pill — visible on both mobile and desktop */}
          {onlineUsers.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: t.presenceBg, borderRadius: 20,
              padding: '3px 10px', fontSize: 12, color: t.textMuted,
              marginLeft: isMobile ? 'auto' : 6,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.onlineDot, display: 'inline-block', flexShrink: 0 }} />
              {onlineUsers.length} online
            </div>
          )}

          {!isMobile && (
            <div style={{ marginLeft: 'auto' }}>
              <button onClick={() => setDark(!dark)}
                style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${t.border}`, background: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ThemeToggleContent dark={dark} />
              </button>
            </div>
          )}
        </div>

        {/* Messages */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px' : '16px 20px', display: 'flex', flexDirection: 'column', gap: 2, position: 'relative' }}>

          {messages.length === 0 && (
            <div style={{ color: t.textFaint, fontSize: 14, textAlign: 'center', marginTop: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              Belum ada pesan di #{room} <FiSmile aria-hidden="true" />
            </div>
          )}

          {messages.map((msg, i) => {
            const isSelf = msg.username === username
            const prevMsg = messages[i - 1]
            const showMeta = !prevMsg || prevMsg.username !== msg.username || msg.reply_to
            const showDateDivider = !prevMsg || getDateKey(prevMsg.created_at) !== getDateKey(msg.created_at)

            const nextMsg = messages[i + 1]
            const showTime = !nextMsg
              || nextMsg.username !== msg.username
              || (new Date(nextMsg.created_at) - new Date(msg.created_at)) > 5 * 60 * 1000

            return (
              <div key={msg.id}>
                {showDateDivider && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 12px' }}>
                    <div style={{ flex: 1, height: 1, background: t.border }} />
                    <span style={{ fontSize: 11, color: t.textFaint, fontWeight: 500, whiteSpace: 'nowrap', padding: '2px 8px', border: `1px solid ${t.border}`, borderRadius: 10 }}>
                      {formatDateDivider(msg.created_at)}
                    </span>
                    <div style={{ flex: 1, height: 1, background: t.border }} />
                  </div>
                )}

                {/* Hover-to-reply wrapper */}
                <div
                  className="msg-row"
                  style={{
                    display: 'flex',
                    flexDirection: isSelf ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    gap: 6,
                    marginTop: showMeta && !showDateDivider ? 10 : 2,
                  }}>

                  {/* Reply button — shows on hover via CSS class */}
                  <button
                    onClick={() => handleReply(msg)}
                    aria-label="Reply"
                    className="reply-btn"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: t.textFaint, padding: '4px', borderRadius: 6,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0, transition: 'opacity 0.15s',
                      flexShrink: 0,
                    }}>
                    <FiCornerUpLeft size={14} aria-hidden="true" />
                  </button>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isSelf ? 'flex-end' : 'flex-start', width: 'fit-content', maxWidth: isMobile ? '82%' : '65%' }}>
                    {showMeta && !isSelf && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Avatar name={msg.username} size={22} />
                        <span style={{ fontSize: 12, color: t.textMuted, fontWeight: 500 }}>{msg.username}</span>
                      </div>
                    )}
                    {showMeta && isSelf && (
                      <div style={{ textAlign: 'right', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: t.textMuted, fontWeight: 500 }}>{msg.username}</span>
                      </div>
                    )}

                    {/* Quoted message preview */}
                    {msg.reply_to && (
                      <div style={{
                        background: t.replyBg,
                        borderLeft: `3px solid ${t.replyBorder}`,
                        borderRadius: isSelf ? '8px 8px 0 0' : '8px 8px 0 0',
                        padding: '6px 10px',
                        marginBottom: -6,
                        maxWidth: '100%',
                        width: '100%',
                      }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: t.replyBorder, display: 'block', marginBottom: 2 }}>
                          {msg.reply_to.username}
                        </span>
                        <span style={{ fontSize: 12, color: t.textMuted, display: 'block', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {truncate(msg.reply_to.content)}
                        </span>
                      </div>
                    )}

                    <div style={{
                      background: isSelf ? t.bubbleSelf : t.bubbleOther,
                      color: isSelf ? t.bubbleSelfText : t.bubbleOtherText,
                      borderRadius: msg.reply_to
                        ? (isSelf ? '0 4px 14px 14px' : '4px 0 14px 14px')
                        : (isSelf ? '14px 4px 14px 14px' : '4px 14px 14px 14px'),
                      padding: '9px 14px', fontSize: 14, wordBreak: 'break-word', lineHeight: 1.45,
                    }}>
                      {msg.content}
                    </div>

                    {showTime && (
                      <div style={{ fontSize: 11, color: t.textFaint, marginTop: 3, textAlign: isSelf ? 'right' : 'left', paddingLeft: isSelf ? 0 : 4, paddingRight: isSelf ? 4 : 0 }}>
                        {formatTime(msg.created_at)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {typingText && (
            <div style={{ marginTop: 8, marginLeft: 0 }}>
              <div style={{ background: t.bubbleOther, borderRadius: '4px 14px 14px 14px', padding: '9px 14px', fontSize: 13, color: t.textMuted, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: t.textMuted, display: 'inline-block', animation: 'bounce 1s infinite', animationDelay: `${i * 0.2}s` }} />
                  ))}
                </span>
                {typingText}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button
            onClick={scrollToBottom}
            aria-label="Scroll to latest"
            style={{
              position: 'absolute',
              bottom: isMobile ? 74 : 80,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'auto', height: 34, borderRadius: 20, padding: '0 14px',
              background: t.scrollBtnBg, color: t.scrollBtnText,
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
              zIndex: 5, fontSize: 18,
              animation: 'fadeIn 0.15s ease',
            }}>
            <FiChevronDown aria-hidden="true" />
            <span style={{ fontSize: 12, fontWeight: 500, marginLeft: 4 }}>Terbaru</span>
          </button>
        )}

        {/* Reply preview bar */}
        {replyTo && (
          <div style={{
            padding: '8px 16px',
            background: t.replyPreviewBg,
            borderTop: `1px solid ${t.replyPreviewBorder}`,
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'fadeIn 0.15s ease',
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: t.replyBorder, display: 'block' }}>
                Replying to {replyTo.username}
              </span>
              <span style={{ fontSize: 12, color: t.textMuted, display: 'block', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {replyTo.content}
              </span>
            </div>
            <button onClick={cancelReply} aria-label="Cancel reply"
              style={{ background: 'none', border: 'none', color: t.textFaint, cursor: 'pointer', padding: 4, display: 'inline-flex', alignItems: 'center', borderRadius: 4 }}>
              <FiX size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Input bar */}
        <div style={{ padding: isMobile ? '10px 12px' : '12px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, background: t.bg }}>
          <input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={`Pesan di #${room}...`}
            style={{
              flex: 1, padding: '11px 16px', borderRadius: 24,
              border: `1px solid ${t.border}`,
              fontSize: 14, color: t.text, background: t.input,
              outline: 'none', minWidth: 0,
            }}
          />
          <button onClick={sendMessage}
            style={{
              width: 42, height: 42, borderRadius: '50%',
              border: 'none', background: t.button, color: t.buttonText,
              cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
            <FiSend aria-hidden="true" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        input { -webkit-appearance: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${dark ? '#333' : '#ddd'}; border-radius: 4px; }

        /* Reply button shows on bubble hover */
        .msg-row:hover .reply-btn {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  )
}