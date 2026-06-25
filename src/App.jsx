import { useEffect, useState, useRef } from 'react'
import { supabase } from './supabaseClient'

const ROOMS = ['general', 'random', 'dev', 'design']

const theme = {
  light: {
    bg: '#ffffff', sidebar: '#f7f7f7', border: '#e0e0e0',
    text: '#111111', textMuted: '#666666', textFaint: '#999999',
    input: '#ffffff', activeRoom: '#e8e8e8',
    bubbleSelf: '#111111', bubbleSelfText: '#ffffff',
    bubbleOther: '#f0f0f0', bubbleOtherText: '#111111',
    button: '#111111', buttonText: '#ffffff',
    overlay: 'rgba(0,0,0,0.3)',
  },
  dark: {
    bg: '#1a1a1a', sidebar: '#111111', border: '#2e2e2e',
    text: '#f0f0f0', textMuted: '#aaaaaa', textFaint: '#555555',
    input: '#2a2a2a', activeRoom: '#2e2e2e',
    bubbleSelf: '#4f46e5', bubbleSelfText: '#ffffff',
    bubbleOther: '#2a2a2a', bubbleOtherText: '#f0f0f0',
    button: '#4f46e5', buttonText: '#ffffff',
    overlay: 'rgba(0,0,0,0.5)',
  }
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

  if (loading) return <div style={{ padding: 32 }}>Loading...</div>
  if (!session) return <AuthPage dark={dark} setDark={setDark} t={t} />
  return <ChatPage session={session} dark={dark} setDark={setDark} t={t} />
}

function ToggleButton({ dark, setDark, t }) {
  return (
    <button onClick={() => setDark(!dark)}
      style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${t.border}`, background: 'none', color: t.text, cursor: 'pointer', fontSize: 12 }}>
      {dark ? 'Light' : 'Dark'}
    </button>
  )
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
        <ToggleButton dark={dark} setDark={setDark} t={t} />
      </div>
      <div style={{ width: '100%', maxWidth: 360, padding: 32, background: t.sidebar, border: `1px solid ${t.border}`, borderRadius: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 24, color: t.text }}>
          {isLogin ? '🔐 Login' : '📝 Register'}
        </h2>
        <input type="email" placeholder="Email" value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', marginBottom: 12, padding: '10px 12px', borderRadius: 8, border: `1px solid ${t.border}`, fontSize: 14, boxSizing: 'border-box', background: t.input, color: t.text }}
        />
        <input type="password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{ width: '100%', marginBottom: 12, padding: '10px 12px', borderRadius: 8, border: `1px solid ${t.border}`, fontSize: 14, boxSizing: 'border-box', background: t.input, color: t.text }}
        />
        {error && <p style={{ color: '#cc0000', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: t.button, color: t.buttonText, fontSize: 14, cursor: 'pointer' }}>
          {loading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
        </button>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: t.textMuted }}>
          {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
          <span onClick={() => setIsLogin(!isLogin)}
            style={{ color: t.text, cursor: 'pointer', fontWeight: 500, textDecoration: 'underline' }}>
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
    const loadMessages = async () => {
      setMessages([])
      setTypingUsers([])
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('room', room)
        .order('created_at', { ascending: true })
        .limit(50)
      if (data) setMessages(data)
    }
    loadMessages()

    const channel = supabase.channel(`room:${room}`, {
      config: { presence: { key: username } }
    })

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
    channelRef.current.track({ isTyping: true })
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      channelRef.current?.track({ isTyping: false })
    }, 1500)
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    const content = input.trim()
    setInput('')
    clearTimeout(typingTimeoutRef.current)
    channelRef.current?.track({ isTyping: false })
    const optimistic = {
      id: Date.now(),
      username,
      content,
      room,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, optimistic])
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
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 500, fontSize: 15, color: t.text }}>💬 Chat</span>
        {isMobile && (
          <button onClick={() => setSidebarOpen(false)}
            style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4 }}>
            ✕
          </button>
        )}
      </div>
      <div style={{ fontSize: 11, color: t.textFaint, padding: '0 16px 8px', textTransform: 'uppercase', letterSpacing: 1 }}>Channels</div>
      {ROOMS.map(r => (
        <div key={r} onClick={() => switchRoom(r)}
          style={{ padding: '10px 16px', cursor: 'pointer', borderRadius: 6, margin: '0 8px', fontSize: 14, background: room === r ? t.activeRoom : 'none', fontWeight: room === r ? 500 : 400, color: room === r ? t.text : t.textMuted }}>
          # {r}
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.border}` }}>
        <div style={{ fontSize: 12, color: t.textMuted, marginBottom: 6 }}>{username}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => supabase.auth.signOut()}
            style={{ flex: 1, padding: '6px', borderRadius: 6, border: `1px solid ${t.border}`, background: 'none', fontSize: 12, cursor: 'pointer', color: t.textMuted }}>
            Logout
          </button>
          <ToggleButton dark={dark} setDark={setDark} t={t} />
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', background: t.bg, color: t.text, position: 'relative', overflow: 'hidden' }}>

      {/* Desktop sidebar */}
      {!isMobile && (
        <div style={{ width: 200, borderRight: `1px solid ${t.border}`, flexShrink: 0 }}>
          <SidebarContent />
        </div>
      )}

      {/* Mobile drawer overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: t.overlay, zIndex: 10 }}
        />
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: 240,
          zIndex: 20, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease', boxShadow: sidebarOpen ? '4px 0 16px rgba(0,0,0,0.2)' : 'none'
        }}>
          <SidebarContent />
        </div>
      )}

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header */}
        <div style={{ padding: isMobile ? '12px 16px' : '14px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {isMobile && (
            <button onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 20, padding: 0, lineHeight: 1, flexShrink: 0 }}>
              ☰
            </button>
          )}
          <span style={{ fontWeight: 500, fontSize: 15, color: t.text }}># {room}</span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px' : '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.length === 0 && (
            <div style={{ color: t.textFaint, fontSize: 14, textAlign: 'center', marginTop: 40 }}>
              Belum ada pesan di #{room}
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} style={{ alignSelf: msg.username === username ? 'flex-end' : 'flex-start', maxWidth: isMobile ? '80%' : '60%' }}>
              <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 2, textAlign: msg.username === username ? 'right' : 'left' }}>{msg.username}</div>
              <div style={{ background: msg.username === username ? t.bubbleSelf : t.bubbleOther, color: msg.username === username ? t.bubbleSelfText : t.bubbleOtherText, borderRadius: msg.username === username ? '12px 4px 12px 12px' : '4px 12px 12px 12px', padding: '8px 14px', fontSize: 14, wordBreak: 'break-word' }}>
                {msg.content}
              </div>
            </div>
          ))}
          {typingText && (
            <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ background: t.bubbleOther, borderRadius: 12, padding: '8px 14px', fontSize: 13, color: t.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'flex', gap: 3 }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: 6, height: 6, borderRadius: '50%', background: t.textMuted, display: 'inline-block',
                      animation: 'bounce 1s infinite', animationDelay: `${i * 0.2}s`
                    }} />
                  ))}
                </span>
                {typingText}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: isMobile ? '10px 12px' : '12px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 8, flexShrink: 0 }}>
          <input value={input} onChange={handleInputChange}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={`Pesan di #${room}...`}
            style={{ flex: 1, padding: '10px 14px', borderRadius: isMobile ? 24 : 8, border: `1px solid ${t.border}`, fontSize: 14, color: t.text, background: t.input, outline: 'none', minWidth: 0 }}
          />
          <button onClick={sendMessage}
            style={{ padding: isMobile ? '10px 16px' : '8px 16px', borderRadius: isMobile ? 24 : 8, border: 'none', background: t.button, color: t.buttonText, cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>
            {isMobile ? '➤' : 'Kirim'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        * { -webkit-tap-highlight-color: transparent; }
        input, button { -webkit-appearance: none; }
      `}</style>
    </div>
  )
}