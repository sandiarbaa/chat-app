import { useEffect, useState, useRef } from 'react'
import { supabase } from './supabaseClient'

const ROOMS = ['general', 'random', 'dev', 'design']

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

const theme = {
  light: {
    bg: '#ffffff',
    sidebar: '#f7f7f7',
    border: '#e0e0e0',
    text: '#111111',
    textMuted: '#666666',
    textFaint: '#999999',
    input: '#ffffff',
    activeRoom: '#e8e8e8',
    bubbleSelf: '#111111',
    bubbleSelfText: '#ffffff',
    bubbleOther: '#f0f0f0',
    bubbleOtherText: '#111111',
    button: '#111111',
    buttonText: '#ffffff',
  },
  dark: {
    bg: '#1a1a1a',
    sidebar: '#111111',
    border: '#2e2e2e',
    text: '#f0f0f0',
    textMuted: '#aaaaaa',
    textFaint: '#666666',
    input: '#2a2a2a',
    activeRoom: '#2e2e2e',
    bubbleSelf: '#4f46e5',
    bubbleSelfText: '#ffffff',
    bubbleOther: '#2a2a2a',
    bubbleOtherText: '#f0f0f0',
    button: '#4f46e5',
    buttonText: '#ffffff',
  }
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: t.bg }}>
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <ToggleButton dark={dark} setDark={setDark} t={t} />
      </div>
      <div style={{ width: 360, padding: 32, background: t.sidebar, border: `1px solid ${t.border}`, borderRadius: 12 }}>
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

function ToggleButton({ dark, setDark, t }) {
  return (
    <button onClick={() => setDark(!dark)}
      style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${t.border}`, background: t.sidebar, color: t.text, cursor: 'pointer', fontSize: 13 }}>
      {dark ? '☀️ Light' : '🌙 Dark'}
    </button>
  )
}

function ChatPage({ session, dark, setDark, t }) {
  const [room, setRoom] = useState('general')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const username = session.user.email.split('@')[0]

  useEffect(() => {
    setMessages([])
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('room', room)
        .order('created_at', { ascending: true })
        .limit(50)
      if (data) setMessages(data)
    }
    loadMessages()

    const channel = supabase
      .channel(`room:${room}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room=eq.${room}` },
        (payload) => setMessages(prev => [...prev, payload.new])
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [room])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return
    await supabase.from('messages').insert({ username, content: input.trim(), room })
    setInput('')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: t.bg, color: t.text }}>
      {/* Sidebar */}
      <div style={{ width: 200, borderRight: `1px solid ${t.border}`, background: t.sidebar, padding: '16px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 16px 16px', fontWeight: 500, fontSize: 15, color: t.text }}>💬 Chat</div>
        <div style={{ fontSize: 11, color: t.textFaint, padding: '0 16px 8px', textTransform: 'uppercase', letterSpacing: 1 }}>Channels</div>
        {ROOMS.map(r => (
          <div key={r} onClick={() => setRoom(r)}
            style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: 6, margin: '0 8px', fontSize: 14, background: room === r ? t.activeRoom : 'none', fontWeight: room === r ? 500 : 400, color: room === r ? t.text : t.textMuted }}>
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

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: t.bg }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${t.border}`, fontWeight: 500, fontSize: 15, color: t.text }}>
          # {room}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.length === 0 && (
            <div style={{ color: t.textFaint, fontSize: 14, textAlign: 'center', marginTop: 40 }}>
              Belum ada pesan di #{room}
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} style={{ alignSelf: msg.username === username ? 'flex-end' : 'flex-start' }}>
              <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 2 }}>{msg.username}</div>
              <div style={{ background: msg.username === username ? t.bubbleSelf : t.bubbleOther, color: msg.username === username ? t.bubbleSelfText : t.bubbleOtherText, borderRadius: 12, padding: '8px 14px', fontSize: 14, maxWidth: 360 }}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div style={{ padding: '12px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={`Pesan di #${room}...`}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${t.border}`, fontSize: 14, color: t.text, background: t.input }}
          />
          <button onClick={sendMessage}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: t.button, color: t.buttonText, cursor: 'pointer', fontSize: 14 }}>
            Kirim
          </button>
        </div>
      </div>
    </div>
  )
}