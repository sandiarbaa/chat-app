import { useEffect, useState, useRef } from 'react'
import { supabase } from './supabaseClient'

const USERNAME = 'sandiarba' // ganti nama kamu

export default function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

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
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages(prev => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return
    await supabase
      .from('messages')
      .insert({ username: USERNAME, content: input.trim() })
    setInput('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <h1 style={{ fontSize: 18, fontWeight: 500, marginBottom: 16 }}>💬 Realtime Chat</h1>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ alignSelf: msg.username === USERNAME ? 'flex-end' : 'flex-start' }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{msg.username}</div>
            <div style={{
              background: msg.username === USERNAME ? '#1a1a1a' : '#f0f0f0',
              color: msg.username === USERNAME ? '#fff' : '#000',
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