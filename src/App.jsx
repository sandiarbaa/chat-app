import { useEffect, useState, useRef } from 'react'
import { supabase } from './supabaseClient'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) return <div style={{ padding: 32 }}>Loading...</div>
  if (!session) return <AuthPage />
  return <ChatPage session={session} />
}

function AuthPage() {
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg, #f5f5f5)' }}>
      <div style={{ width: 360, padding: 32, background: '#ffffff', border: '1px solid #e0e0e0', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 24, color: '#111' }}>
          {isLogin ? '🔐 Login' : '📝 Register'}
        </h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', marginBottom: 12, padding: '10px 12px', borderRadius: 8, border: '1px solid #d0d0d0', fontSize: 14, boxSizing: 'border-box', background: '#fff', color: '#111' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{ width: '100%', marginBottom: 12, padding: '10px 12px', borderRadius: 8, border: '1px solid #d0d0d0', fontSize: 14, boxSizing: 'border-box', background: '#fff', color: '#111' }}
        />
        {error && <p style={{ color: '#cc0000', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: '#111', color: '#fff', fontSize: 14, cursor: 'pointer' }}
        >
          {loading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
        </button>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#555' }}>
          {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
          <span onClick={() => setIsLogin(!isLogin)} style={{ color: '#111', cursor: 'pointer', fontWeight: 500, textDecoration: 'underline' }}>
            {isLogin ? 'Register' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  )
}

function ChatPage({ session }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const username = session.user.email.split('@')[0]

  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50)
      if (data) setMessages(data)
    }
    loadMessages()

    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => setMessages(prev => [...prev, payload.new])
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return
    await supabase.from('messages').insert({ username, content: input.trim() })
    setInput('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 500 }}>💬 Realtime Chat</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#666' }}>{username}</span>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #ddd', background: 'none', fontSize: 13, cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ alignSelf: msg.username === username ? 'flex-end' : 'flex-start' }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{msg.username}</div>
            <div style={{
              background: msg.username === username ? '#1a1a1a' : '#f0f0f0',
              color: msg.username === username ? '#fff' : '#000',
              borderRadius: 12,
              padding: '8px 14px',
              fontSize: 14,
              maxWidth: 320,
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Ketik pesan..."
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}
        />
        <button onClick={sendMessage} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', cursor: 'pointer' }}>
          Kirim
        </button>
      </div>
    </div>
  )
}