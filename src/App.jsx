import { useEffect, useState, useRef } from 'react'
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
  }
}

function getInitials(name) {
  return name.slice(0, 2).toUpperCase()
}

function Avatar({ name, size = 32, t }) {
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

function AuthPage({ dark, setDark, t }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    const { error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: t.bg, padding: '0 16px', boxSizing: 'border-box' }}>
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <button onClick={() => setDark(!dark)}
          style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${t.border}`, background: 'none', color: t.text, cursor: 'pointer', fontSize: 12 }}>
          {dark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>
      <div style={{ width: '100%', maxWidth: 360, padding: 32, background: t.sidebar, border: `1px solid ${t.border}`, borderRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ fontSize: 24 }}>💬</div>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: t.text }}>
            {isLogin ? 'Welcome back' : 'Create account'}
          </h2>
        </div>
        <input type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', marginBottom: 10, padding: '11px 14px', borderRadius: 10, border: `1px solid ${t.border}`, fontSize: 14, boxSizing: 'border-box', background: t.input, color: t.text, outline: 'none' }}
        />
        <input type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{ width: '100%', marginBottom: 14, padding: '11px 14px', borderRadius: 10, border: `1px solid ${t.border}`, fontSize: 14, boxSizing: 'border-box', background: t.input, color: t.text, outline: 'none' }}
        />
        {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>{error}</p>}
        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: t.button, color: t.buttonText, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          {loading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
        </button>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: t.textMuted }}>
          {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
          <span onClick={() => setIsLogin(!isLogin)}
            style={{ color: t.button, cursor: 'pointer', fontWeight: 500 }}>
            {isLogin ? 'Register' : 'Login'}
          </span>
        </p>
      </div>
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
  const bottomRef = useRef(null)
  const channelRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const username = session.user.email.split('@')[0]

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setMessages([])
    setTypingUsers([])
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages').select('*').eq('room', room)
        .order('created_at', { ascending: true }).limit(50)
      if (data) setMessages(data)
    }
    loadMessages()

    const channel = supabase.channel(`room:${room}`)

    channel
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room=eq.${room}` },
        (payload) => setMessages(prev => [...prev, payload.new])
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const typing = Object.values(state)
          .flat()
          .filter(p => p.username !== username && p.isTyping)
          .map(p => p.username)
        setTypingUsers(typing)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ username, isTyping: false })
        }
      })

    channelRef.current = channel
    return () => supabase.removeChannel(channel)
  }, [room])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  const handleInputChange = (e) => {
    setInput(e.target.value)
    if (!channelRef.current) return
    channelRef.current.track({ username, isTyping: true })
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      channelRef.current?.track({ username, isTyping: false })
    }, 1500)
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    const content = input.trim()
    setInput('')
    clearTimeout(typingTimeoutRef.current)
    channelRef.current?.track({ username, isTyping: false })
    setMessages(prev => [...prev, { id: Date.now(), username, content, room, created_at: new Date().toISOString() }])
    await supabase.from('messages').insert({ username, content, room })
  }

  const switchRoom = (r) => {
    setRoom(r)
    if (isMobile) setSidebarOpen(false)
  }

  const typingText = typingUsers.length === 1
    ? `${typingUsers[0]} is typing...`
    : typingUsers.length > 1
    ? `${typingUsers.join(', ')} are typing...`
    : ''

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.sidebar }}>
      {/* Sidebar header */}
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>💬</span>
          <span style={{ fontWeight: 600, fontSize: 15, color: t.text }}>Chat</span>
        </div>
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)}
            style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 18, padding: 4 }}>
            ✕
          </button>
        )}
      </div>

      {/* Channel list */}
      <div style={{ padding: '12px 8px', flex: 1 }}>
        <div style={{ fontSize: 11, color: t.textFaint, padding: '0 10px 8px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>Channels</div>
        {ROOMS.map(r => (
          <div key={r} onClick={() => switchRoom(r)}
            style={{
              padding: '9px 12px', cursor: 'pointer', borderRadius: 8, marginBottom: 2,
              fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
              background: room === r ? t.activeRoom : 'transparent',
              color: room === r ? t.activRoomText : t.textMuted,
              fontWeight: room === r ? 500 : 400,
            }}>
            <span style={{ opacity: 0.5, fontSize: 15 }}>#</span> {r}
          </div>
        ))}
      </div>

      {/* User footer */}
      <div style={{ padding: '12px', borderTop: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Avatar name={username} size={30} t={t} />
          <span style={{ fontSize: 13, color: t.textMuted, fontWeight: 500 }}>{username}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => supabase.auth.signOut()}
            style={{ flex: 1, padding: '7px', borderRadius: 8, border: `1px solid ${t.border}`, background: 'none', fontSize: 12, cursor: 'pointer', color: t.textMuted }}>
            Logout
          </button>
          <button onClick={() => {}} // dark toggle handled in header
            style={{ flex: 1, padding: '7px', borderRadius: 8, border: `1px solid ${t.border}`, background: 'none', fontSize: 12, cursor: 'pointer', color: t.textMuted }}
            onClick={() => setDark(!dark)}>
            {dark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', background: t.bg, color: t.text, position: 'relative', overflow: 'hidden' }}>

      {/* Desktop sidebar */}
      {!isMobile && (
        <div style={{ width: 220, borderRight: `1px solid ${t.border}`, flexShrink: 0 }}>
          <SidebarContent />
        </div>
      )}

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: t.overlay, zIndex: 10 }} />
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: 260, zIndex: 20,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          boxShadow: sidebarOpen ? '8px 0 32px rgba(0,0,0,0.25)' : 'none'
        }}>
          <SidebarContent />
        </div>
      )}

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header */}
        <div style={{
          padding: isMobile ? '10px 14px' : '12px 20px',
          borderBottom: `1px solid ${t.border}`,
          background: t.headerBg,
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0
        }}>
          {isMobile && (
            <button onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 22, padding: 0, lineHeight: 1, flexShrink: 0 }}>
              ☰
            </button>
          )}
          <span style={{ color: t.textFaint, fontSize: 18, fontWeight: 300 }}>#</span>
          <span style={{ fontWeight: 600, fontSize: 15, color: t.text }}>{room}</span>
          {!isMobile && (
            <div style={{ marginLeft: 'auto' }}>
              <button onClick={() => setDark(!dark)}
                style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${t.border}`, background: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 12 }}>
                {dark ? '☀️ Light' : '🌙 Dark'}
              </button>
            </div>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px' : '16px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {messages.length === 0 && (
            <div style={{ color: t.textFaint, fontSize: 14, textAlign: 'center', marginTop: 60 }}>
              Belum ada pesan di #{room} 👋
            </div>
          )}

          {messages.map((msg, i) => {
            const isSelf = msg.username === username
            const prevMsg = messages[i - 1]
            const showMeta = !prevMsg || prevMsg.username !== msg.username

            return (
              <div key={msg.id} style={{ alignSelf: isSelf ? 'flex-end' : 'flex-start', maxWidth: isMobile ? '82%' : '65%', marginTop: showMeta ? 10 : 2 }}>
                {/* Show avatar + name only for first consecutive msg */}
                {showMeta && !isSelf && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Avatar name={msg.username} size={22} t={t} />
                    <span style={{ fontSize: 12, color: t.textMuted, fontWeight: 500 }}>{msg.username}</span>
                  </div>
                )}
                {showMeta && isSelf && (
                  <div style={{ textAlign: 'right', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: t.textMuted, fontWeight: 500 }}>{msg.username}</span>
                  </div>
                )}
                <div style={{
                  background: isSelf ? t.bubbleSelf : t.bubbleOther,
                  color: isSelf ? t.bubbleSelfText : t.bubbleOtherText,
                  borderRadius: isSelf ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                  padding: '9px 14px', fontSize: 14, wordBreak: 'break-word', lineHeight: 1.45,
                }}>
                  {msg.content}
                </div>
              </div>
            )
          })}

          {/* Typing indicator */}
          {typingText && (
            <div style={{ alignSelf: 'flex-start', marginTop: 8 }}>
              <div style={{ background: t.bubbleOther, borderRadius: '4px 14px 14px 14px', padding: '9px 14px', fontSize: 13, color: t.textMuted, display: 'flex', alignItems: 'center', gap: 8 }}>
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

        {/* Input bar */}
        <div style={{ padding: isMobile ? '10px 12px' : '12px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, background: t.bg }}>
          <input
            value={input}
            onChange={handleInputChange}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={`Pesan di #${room}...`}
            style={{
              flex: 1, padding: '11px 16px',
              borderRadius: 24,
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
            ➤
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        input { -webkit-appearance: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${dark ? '#333' : '#ddd'}; border-radius: 4px; }
      `}</style>
    </div>
  )
}