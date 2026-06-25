import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { theme } from './theme'
import Authentication from './auth/Authentication'
import ChatPage from './chat/ChatPage'

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

  if (loading) {
    return (
      <div style={{ padding: 32, color: '#888', fontFamily: 'system-ui, sans-serif' }}>
        Loading...
      </div>
    )
  }

  if (!session) {
    return <Authentication />
  }

  return <ChatPage session={session} dark={dark} setDark={setDark} t={t} />
}