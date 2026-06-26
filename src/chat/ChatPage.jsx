import { useEffect, useState, useRef, useCallback } from 'react'
import {
  FiMenu, FiMessageCircle, FiMoon, FiSend, FiSmile,
  FiSun, FiX, FiChevronDown, FiUsers,
  FiCornerUpLeft, FiEdit2, FiTrash2, FiPlus, FiHash,
} from 'react-icons/fi'
import { supabase } from '../supabaseClient'
import { Avatar } from '../components/Avatar'
import { formatTime, formatDateDivider, truncate } from '../utils/time'

const PAGE_SIZE = 50
const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '😡', '😍', '🤔', '🔥', '👏', '🎉', '💯', '🙏', '💀', '🤣', '😭', '😤', '🥹', '✅', '👀']

// ─── Small presentational helpers ────────────────────────────────────────────
function ThemeToggleContent({ dark }) {
  return (
    <>
      {dark ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}
      {dark ? 'Light' : 'Dark'}
    </>
  )
}

// ─── Create Channel Modal ─────────────────────────────────────────────────────
function CreateChannelModal({ t, onClose, onCreate }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close on outside click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleSubmit = async () => {
    const cleaned = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    if (!cleaned) { setError('Nama channel tidak boleh kosong'); return }
    if (cleaned.length < 2) { setError('Minimal 2 karakter'); return }
    if (cleaned.length > 32) { setError('Maksimal 32 karakter'); return }

    setLoading(true)
    setError('')
    const result = await onCreate(cleaned)
    setLoading(false)
    if (result?.error) {
      setError(result.error === 'duplicate' ? 'Channel sudah ada' : 'Gagal membuat channel')
    } else {
      onClose()
    }
  }

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: t.bg, border: `1px solid ${t.border}`,
          borderRadius: 16, padding: '24px',
          width: '100%', maxWidth: 360,
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          animation: 'slideUp 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: t.text }}>Buat Channel Baru</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', padding: 4, display: 'inline-flex', borderRadius: 6 }}>
            <FiX size={18} />
          </button>
        </div>

        <label style={{ fontSize: 11, color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, display: 'block', marginBottom: 6 }}>
          Nama Channel
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.input, border: `1.5px solid ${error ? '#f87171' : t.border}`, borderRadius: 10, padding: '0 12px', marginBottom: 6 }}>
          <FiHash size={14} color={t.textFaint} />
          <input
            ref={inputRef}
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSubmit()
              if (e.key === 'Escape') onClose()
            }}
            placeholder="nama-channel"
            maxLength={32}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 14, color: t.text, padding: '11px 0',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {error && <p style={{ margin: '0 0 8px', fontSize: 12, color: '#f87171' }}>{error}</p>}

        <p style={{ margin: '0 0 20px', fontSize: 12, color: t.textFaint }}>
          Huruf kecil, angka, dan tanda hubung saja. Spasi otomatis diganti <code style={{ background: t.input, padding: '1px 4px', borderRadius: 4 }}>-</code>
        </p>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '9px', borderRadius: 10, border: `1px solid ${t.border}`, background: 'none', fontSize: 13, cursor: 'pointer', color: t.textMuted }}
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ flex: 1, padding: '9px', borderRadius: 10, border: 'none', background: loading ? t.border : t.button, color: t.buttonText, fontSize: 13, cursor: loading ? 'default' : 'pointer', fontWeight: 500 }}
          >
            {loading ? 'Membuat...' : 'Buat Channel'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Online presence list (desktop sidebar) ───────────────────────────────────
function OnlineList({ onlineUsers, t }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ borderTop: `1px solid ${t.border}`, padding: '10px 8px' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}
      >
        <FiUsers size={14} color={t.textMuted} aria-hidden="true" />
        <span style={{ fontSize: 11, color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, flex: 1 }}>
          Online
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: t.onlineDot }}>{onlineUsers.length}</span>
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
                  background: t.onlineDot, border: `1.5px solid ${t.sidebar}`,
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

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ t, isMobile, setSidebarOpen, switchRoom, room, username, dark, setDark, unreadCounts, onlineUsers, channels, onCreateChannel }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: t.sidebar }}>

      {/* Header */}
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiMessageCircle size={18} color={t.textMuted} aria-hidden="true" />
          <span style={{ fontWeight: 600, fontSize: 15, color: t.text }}>Chat</span>
        </div>
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 18, padding: 4, display: 'inline-flex', alignItems: 'center' }}
          >
            <FiX aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Channels */}
      <div style={{ padding: '12px 8px', flex: 1, overflowY: 'auto' }}>
        {/* Channels header + add button */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px 8px' }}>
          <span style={{ fontSize: 11, color: t.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, flex: 1 }}>
            Channels
          </span>
          <button
            onClick={onCreateChannel}
            title="Buat channel baru"
            aria-label="Buat channel baru"
            style={{
              background: 'none', border: 'none', color: t.textFaint,
              cursor: 'pointer', padding: '2px', display: 'inline-flex',
              alignItems: 'center', borderRadius: 4,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = t.text}
            onMouseLeave={e => e.currentTarget.style.color = t.textFaint}
          >
            <FiPlus size={15} />
          </button>
        </div>

        {channels.length === 0 && (
          <div style={{ padding: '8px 12px', fontSize: 12, color: t.textFaint, fontStyle: 'italic' }}>
            Memuat channels...
          </div>
        )}

        {channels.map(r => {
          const count = unreadCounts[r.name] || 0
          return (
            <div
              key={r.id}
              onClick={() => switchRoom(r.name)}
              style={{
                padding: '9px 12px', cursor: 'pointer', borderRadius: 8, marginBottom: 2,
                fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
                background: room === r.name ? t.activeRoom : 'transparent',
                color: room === r.name ? t.activRoomText : t.textMuted,
                fontWeight: room === r.name || count > 0 ? 500 : 400,
              }}
            >
              <span style={{ opacity: 0.5, fontSize: 15 }}>#</span>
              <span style={{ flex: 1 }}>{r.name}</span>
              {count > 0 && room !== r.name && (
                <span style={{
                  background: t.badgeBg, color: t.badgeText,
                  borderRadius: 10, fontSize: 11, fontWeight: 600,
                  padding: '1px 6px', minWidth: 18, textAlign: 'center',
                }}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Online list — desktop only */}
      {!isMobile && <OnlineList onlineUsers={onlineUsers} t={t} />}

      {/* User footer */}
      <div style={{ padding: '12px', borderTop: `1px solid ${t.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ position: 'relative' }}>
            <Avatar name={username} size={30} />
            <span style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 8, height: 8, borderRadius: '50%',
              background: t.onlineDot, border: `2px solid ${t.sidebar}`,
            }} />
          </div>
          <span style={{ fontSize: 13, color: t.textMuted, fontWeight: 500 }}>{username}</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{ flex: 1, padding: '7px', borderRadius: 8, border: `1px solid ${t.border}`, background: 'none', fontSize: 12, cursor: 'pointer', color: t.textMuted }}
          >
            Logout
          </button>
          <button
            onClick={() => setDark(!dark)}
            style={{ flex: 1, padding: '7px', borderRadius: 8, border: `1px solid ${t.border}`, background: 'none', fontSize: 12, cursor: 'pointer', color: t.textMuted, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <ThemeToggleContent dark={dark} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Reusable context menu item ───────────────────────────────────────────────
function MenuItem({ icon, label, onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '9px 14px',
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 13, color, textAlign: 'left',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(128,128,128,0.08)'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      <span style={{ display: 'inline-flex', opacity: 0.75 }}>{icon}</span>
      {label}
    </button>
  )
}

// ─── Emoji Picker ─────────────────────────────────────────────────────────────
function EmojiPicker({ t, onSelect, onClose, anchorRef, onPickerMouseEnter, onPickerMouseLeave }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ top: -9999, left: -9999 })

  useEffect(() => {
    if (!anchorRef?.current) return
    const a = anchorRef.current.getBoundingClientRect()
    setPos({ top: Math.max(8, a.top - 52), left: Math.max(8, a.left) })
    requestAnimationFrame(() => {
      if (!ref.current) return
      const pw = ref.current.offsetWidth
      const left = Math.min(Math.max(8, a.left), window.innerWidth - pw - 8)
      setPos({ top: Math.max(8, a.top - 52), left })
    })
  }, [anchorRef])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    const tid = setTimeout(() => window.addEventListener('click', handler), 50)
    return () => { clearTimeout(tid); window.removeEventListener('click', handler) }
  }, [onClose])

  return (
    <div
      ref={ref}
      onClick={e => e.stopPropagation()}
      onMouseEnter={onPickerMouseEnter}
      onMouseLeave={onPickerMouseLeave}
      style={{
        position: 'fixed', top: pos.top, left: pos.left,
        background: t.bg, border: `1px solid ${t.border}`,
        borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        zIndex: 9999, padding: '4px 6px',
        display: 'flex', gap: 0, flexWrap: 'nowrap',
        overflowX: 'auto', overflowY: 'hidden',
        maxWidth: 'min(320px, calc(100vw - 16px))',
        scrollbarWidth: 'none', animation: 'fadeInUp 0.12s ease',
      }}
    >
      {EMOJI_LIST.map(emoji => (
        <button
          key={emoji}
          onClick={() => { onSelect(emoji); onClose() }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 20, padding: '4px 6px', borderRadius: 8,
            lineHeight: 1, transition: 'background 0.1s, transform 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = t.activeRoom; e.currentTarget.style.transform = 'scale(1.2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.transform = 'scale(1)' }}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

// ─── Reaction pills ───────────────────────────────────────────────────────────
function ReactionBar({ reactions, username, messageId, t, onToggle }) {
  if (!reactions || reactions.length === 0) return null
  const grouped = reactions.reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = []
    acc[r.emoji].push(r)
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
      {Object.entries(grouped).map(([emoji, list]) => {
        const reacted = list.some(r => r.username === username)
        const names = list.map(r => r.username).join(', ')
        return (
          <button
            key={emoji}
            title={names}
            onClick={() => onToggle(messageId, emoji, reacted)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 12, fontSize: 13,
              border: `1.5px solid ${reacted ? t.button : t.border}`,
              background: reacted ? `${t.button}22` : t.replyBg,
              color: reacted ? t.button : t.textMuted,
              cursor: 'pointer', lineHeight: 1.4,
              transition: 'all 0.15s', fontWeight: reacted ? 600 : 400,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <span style={{ fontSize: 14 }}>{emoji}</span>
            <span style={{ fontSize: 12 }}>{list.length}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, isSelf, t, isMobile, onReply, onEdit, onDelete, onReact, reactions, username, hasReply }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [editInput, setEditInput] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [hovered, setHovered] = useState(false)
  const emojiAnchorRef = useRef(null)
  const hoverLeaveTimer = useRef(null)

  const handleMouseEnter = () => { clearTimeout(hoverLeaveTimer.current); setHovered(true) }
  const handleMouseLeave = () => {
    hoverLeaveTimer.current = setTimeout(() => {
      setEmojiPickerOpen(prev => { if (!prev) setHovered(false); return prev })
    }, 150)
  }
  const handlePickerMouseEnter = () => { clearTimeout(hoverLeaveTimer.current); setHovered(true) }
  const handlePickerMouseLeave = () => { setEmojiPickerOpen(false); setHovered(false) }

  useEffect(() => {
    if (!menuOpen) return
    const handler = () => setMenuOpen(false)
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [menuOpen])

  const startEdit = () => { setEditInput(msg.content); setIsEditing(true); setMenuOpen(false) }
  const cancelEdit = () => { setIsEditing(false); setEditInput('') }
  const submitEdit = () => {
    if (!editInput.trim()) return
    onEdit(msg.id, editInput.trim())
    setIsEditing(false)
  }

  if (msg.deleted_at) {
    return (
      <div style={{ background: 'transparent', border: `1px solid ${t.border}`, borderRadius: 14, padding: '8px 14px', fontSize: 13, color: t.textFaint, fontStyle: 'italic' }}>
        This message was deleted
      </div>
    )
  }

  if (isEditing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
        <textarea
          value={editInput}
          onChange={e => setEditInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitEdit() }
            if (e.key === 'Escape') cancelEdit()
          }}
          autoFocus
          rows={Math.min(editInput.split('\n').length + 1, 5)}
          style={{
            padding: '9px 14px', borderRadius: 12, border: `1.5px solid ${t.button}`,
            fontSize: 14, background: t.input, color: t.text,
            outline: 'none', resize: 'none', lineHeight: 1.45,
            width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', gap: 6, justifyContent: isSelf ? 'flex-end' : 'flex-start' }}>
          <button onClick={cancelEdit} style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${t.border}`, background: 'none', fontSize: 12, cursor: 'pointer', color: t.textMuted }}>Cancel</button>
          <button onClick={submitEdit} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: t.button, color: t.buttonText, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>Save</button>
        </div>
        <span style={{ fontSize: 11, color: t.textFaint, textAlign: isSelf ? 'right' : 'left' }}>Enter to save · Esc to cancel</span>
      </div>
    )
  }

  const bubbleBorderRadius = msg.reply_to
    ? (isSelf ? '0 4px 14px 14px' : '4px 0 14px 14px')
    : (isSelf ? '14px 4px 14px 14px' : '4px 14px 14px 14px')

  const actionBtn = (color = null) => ({
    background: 'none', border: 'none', cursor: 'pointer',
    color: color || t.textMuted, padding: '2px 7px', borderRadius: 14,
    fontSize: 14, display: 'inline-flex', alignItems: 'center', transition: 'background 0.1s',
  })

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {hovered && !msg.deleted_at && (
        <div
          onClick={e => e.stopPropagation()}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'absolute', bottom: '100%', marginBottom: 4,
            [isSelf ? 'right' : 'left']: 0,
            display: 'flex', gap: 2,
            background: t.bg, border: `1px solid ${t.border}`,
            borderRadius: 20, padding: '3px 6px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            zIndex: 50, animation: 'fadeIn 0.1s ease',
          }}
        >
          <button ref={emojiAnchorRef} onClick={e => { e.stopPropagation(); setEmojiPickerOpen(o => !o) }} title="React" style={actionBtn()} onMouseEnter={e => e.currentTarget.style.background = t.activeRoom} onMouseLeave={e => e.currentTarget.style.background = 'none'}><FiSmile size={14} /></button>
          <button onClick={e => { e.stopPropagation(); onReply(msg) }} title="Reply" style={actionBtn()} onMouseEnter={e => e.currentTarget.style.background = t.activeRoom} onMouseLeave={e => e.currentTarget.style.background = 'none'}><FiCornerUpLeft size={14} /></button>
          {isSelf && (
            <>
              <button onClick={e => { e.stopPropagation(); startEdit() }} title="Edit" style={actionBtn()} onMouseEnter={e => e.currentTarget.style.background = t.activeRoom} onMouseLeave={e => e.currentTarget.style.background = 'none'}><FiEdit2 size={14} /></button>
              <button onClick={e => { e.stopPropagation(); onDelete(msg.id) }} title="Delete" style={actionBtn('#f87171')} onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'none'}><FiTrash2 size={14} /></button>
            </>
          )}
        </div>
      )}

      {emojiPickerOpen && (
        <EmojiPicker t={t} anchorRef={emojiAnchorRef}
          onSelect={emoji => { onReact(msg.id, emoji); setEmojiPickerOpen(false); setHovered(false) }}
          onClose={() => { setEmojiPickerOpen(false); setHovered(false) }}
          onPickerMouseEnter={handlePickerMouseEnter}
          onPickerMouseLeave={handlePickerMouseLeave}
        />
      )}

      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={isSelf ? (e) => { e.stopPropagation(); setMenuOpen(o => !o) } : undefined}
        onDoubleClick={!isSelf ? () => onReply(msg) : undefined}
        style={{
          background: isSelf ? t.bubbleSelf : t.bubbleOther,
          color: isSelf ? t.bubbleSelfText : t.bubbleOtherText,
          borderRadius: bubbleBorderRadius,
          padding: '9px 14px', fontSize: 14,
          wordBreak: 'break-word', lineHeight: 1.45,
          cursor: isSelf ? 'pointer' : 'default',
          position: 'relative',
        }}
      >
        {msg.content}
        {menuOpen && isSelf && (
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: '110%', right: 0, background: t.bg, border: `1px solid ${t.border}`, borderRadius: 10, boxShadow: '0 4px 24px rgba(0,0,0,0.3)', zIndex: 100, overflow: 'hidden', minWidth: 140, animation: 'fadeIn 0.12s ease' }}>
            <MenuItem icon={<FiSmile size={14} />} label="React" color={t.text} onClick={() => { setMenuOpen(false); setEmojiPickerOpen(true) }} />
            <MenuItem icon={<FiCornerUpLeft size={14} />} label="Reply" color={t.text} onClick={() => { onReply(msg); setMenuOpen(false) }} />
            <MenuItem icon={<FiEdit2 size={14} />} label="Edit" color={t.text} onClick={startEdit} />
            <MenuItem icon={<FiTrash2 size={14} />} label="Delete" color="#f87171" onClick={() => { onDelete(msg.id); setMenuOpen(false) }} />
          </div>
        )}
      </div>

      <ReactionBar reactions={reactions} username={username} messageId={msg.id} t={t} onToggle={onReact} />
    </div>
  )
}

// ─── Message row ──────────────────────────────────────────────────────────────
function MessageRow({ msg, prevMsg, nextMsg, username, t, isMobile, onReply, onEdit, onDelete, onReact, reactionsMap }) {
  const isSelf = msg.username === username
  const showMeta = !prevMsg || prevMsg.username !== msg.username || msg.reply_to
  const showDateDivider = !prevMsg || new Date(prevMsg.created_at).toDateString() !== new Date(msg.created_at).toDateString()
  const showTime = !nextMsg || nextMsg.username !== msg.username || (new Date(nextMsg.created_at) - new Date(msg.created_at)) > 5 * 60 * 1000
  const reactions = reactionsMap[msg.id] || []

  return (
    <>
      {showDateDivider && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 12px' }}>
          <div style={{ flex: 1, height: 1, background: t.border }} />
          <span style={{ fontSize: 11, color: t.textFaint, fontWeight: 500, whiteSpace: 'nowrap', padding: '2px 8px', border: `1px solid ${t.border}`, borderRadius: 10 }}>{formatDateDivider(msg.created_at)}</span>
          <div style={{ flex: 1, height: 1, background: t.border }} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: isSelf ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 6, marginTop: showMeta && !showDateDivider ? 10 : 2 }}>
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

          {msg.reply_to && !msg.deleted_at && (
            <div style={{ background: t.replyBg, borderLeft: `3px solid ${t.replyBorder}`, borderRadius: '8px 8px 0 0', padding: '6px 10px', marginBottom: -6, maxWidth: '100%', width: '100%' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: t.replyBorder, display: 'block', marginBottom: 2 }}>{msg.reply_to.username}</span>
              <span style={{ fontSize: 12, color: t.textMuted, display: 'block', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{truncate(msg.reply_to.content)}</span>
            </div>
          )}

          <MessageBubble
            msg={msg} isSelf={isSelf} t={t} isMobile={isMobile}
            onReply={onReply} onEdit={onEdit} onDelete={onDelete}
            onReact={onReact} reactions={reactions} username={username}
            hasReply={!!(msg.reply_to && !msg.deleted_at)}
          />

          {showTime && (
            <div style={{ fontSize: 11, color: t.textFaint, marginTop: 3, textAlign: isSelf ? 'right' : 'left', paddingLeft: isSelf ? 0 : 4, paddingRight: isSelf ? 4 : 0, display: 'flex', gap: 4, alignItems: 'center', justifyContent: isSelf ? 'flex-end' : 'flex-start' }}>
              {msg.edited_at && !msg.deleted_at && <span style={{ fontStyle: 'italic' }}>edited ·</span>}
              {formatTime(msg.created_at)}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── ChatPage ─────────────────────────────────────────────────────────────────
export default function ChatPage({ session, dark, setDark, t }) {
  const [channels, setChannels] = useState([])
  const [room, setRoom] = useState('general')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typingUsers, setTypingUsers] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [unreadCounts, setUnreadCounts] = useState({})
  const [replyTo, setReplyTo] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [reactionsMap, setReactionsMap] = useState({})
  const [showCreateChannel, setShowCreateChannel] = useState(false)

  const bottomRef = useRef(null)
  const topSentinelRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const channelRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const isAtBottomRef = useRef(true)
  const inputRef = useRef(null)

  const username = session.user.email.split('@')[0]

  // Responsive
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── Load channels + realtime sync ─────────────────────────────────────────
  useEffect(() => {
    const loadChannels = async () => {
      const { data } = await supabase
        .from('channels')
        .select('*')
        .order('created_at', { ascending: true })
      if (data) setChannels(data)
    }
    loadChannels()

    // Realtime: new channel added by anyone
    const ch = supabase
      .channel('channels:realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'channels' },
        (payload) => {
          setChannels(prev => {
            if (prev.find(c => c.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
        }
      )
      .subscribe()

    return () => supabase.removeChannel(ch)
  }, [])

  // ── Create channel handler ────────────────────────────────────────────────
  const handleCreateChannel = useCallback(async (name) => {
    const { data, error } = await supabase
      .from('channels')
      .insert({ name, created_by: username })
      .select()
      .single()

    if (error) {
      // Postgres unique violation code
      if (error.code === '23505') return { error: 'duplicate' }
      return { error: 'unknown' }
    }

    // Auto-switch to new channel
    if (data) switchRoom(data.name)
    return {}
  }, [username])

  // ── Unread badges — watch all channels except current ─────────────────────
  useEffect(() => {
    const otherChannels = channels.filter(c => c.name !== room).map(c => c.name)
    if (otherChannels.length === 0) return

    const subs = otherChannels.map(r => {
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
  }, [channels, room])

  // ── Load messages + realtime + presence ───────────────────────────────────
  const fetchReactionsForMessages = useCallback(async (messageIds) => {
    if (!messageIds || messageIds.length === 0) return
    const { data } = await supabase.from('reactions').select('*').in('message_id', messageIds)
    if (data) {
      setReactionsMap(prev => {
        const next = { ...prev }
        messageIds.forEach(id => { next[id] = [] })
        data.forEach(r => {
          if (!next[r.message_id]) next[r.message_id] = []
          next[r.message_id].push(r)
        })
        return next
      })
    }
  }, [])

  const applyReactionInsert = useCallback((reaction) => {
    setReactionsMap(prev => {
      const list = prev[reaction.message_id] || []
      if (list.find(r => r.id === reaction.id)) return prev
      return { ...prev, [reaction.message_id]: [...list, reaction] }
    })
  }, [])

  const applyReactionDelete = useCallback((reaction) => {
    setReactionsMap(prev => {
      const list = prev[reaction.message_id] || []
      return { ...prev, [reaction.message_id]: list.filter(r => r.id !== reaction.id) }
    })
  }, [])

  useEffect(() => {
    setMessages([])
    setTypingUsers([])
    setReplyTo(null)
    setOnlineUsers([])
    setHasMore(false)
    setLoadingMore(false)
    setReactionsMap({})

    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages').select('*').eq('room', room)
        .order('created_at', { ascending: false }).limit(PAGE_SIZE)
      if (data) {
        const sorted = data.reverse()
        setMessages(sorted)
        setHasMore(data.length === PAGE_SIZE)
        fetchReactionsForMessages(sorted.map(m => m.id))
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 50)
      }
    }
    loadMessages()

    const channel = supabase.channel(`room:${room}`)
    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room=eq.${room}` },
        (payload) => { setMessages(prev => { if (prev.find(m => m.id === payload.new.id)) return prev; return [...prev, payload.new] }) })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `room=eq.${room}` },
        (payload) => { setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m)) })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reactions' },
        (payload) => applyReactionInsert(payload.new))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'reactions' },
        (payload) => applyReactionDelete(payload.old))
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const all = Object.values(state).flat()
        setTypingUsers(all.filter(p => p.username !== username && p.isTyping).map(p => p.username))
        setOnlineUsers([...new Set(all.map(p => p.username))])
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        setOnlineUsers(prev => [...new Set([...prev, ...newPresences.map(p => p.username)])])
      })
      .on('presence', { event: 'leave' }, () => {
        const state = channel.presenceState()
        setOnlineUsers([...new Set(Object.values(state).flat().map(p => p.username))])
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ username, isTyping: false })
      })

    channelRef.current = channel
    return () => supabase.removeChannel(channel)
  }, [room])

  // Load older messages
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || messages.length === 0) return
    const oldest = messages[0]
    if (!oldest) return
    setLoadingMore(true)
    const el = scrollContainerRef.current
    const prevScrollHeight = el ? el.scrollHeight : 0
    const { data } = await supabase
      .from('messages').select('*').eq('room', room)
      .lt('created_at', oldest.created_at)
      .order('created_at', { ascending: false }).limit(PAGE_SIZE)
    if (data && data.length > 0) {
      const older = data.reverse()
      setMessages(prev => [...older, ...prev])
      setHasMore(data.length === PAGE_SIZE)
      fetchReactionsForMessages(older.map(m => m.id))
      requestAnimationFrame(() => { if (el) el.scrollTop = el.scrollHeight - prevScrollHeight })
    } else {
      setHasMore(false)
    }
    setLoadingMore(false)
  }, [loadingMore, hasMore, messages, room])

  useEffect(() => {
    const sentinel = topSentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore() },
      { root: scrollContainerRef.current, threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    isAtBottomRef.current = distFromBottom < 80
    setShowScrollBtn(!isAtBottomRef.current)
  }, [])

  useEffect(() => {
    if (isAtBottomRef.current) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const scrollToBottom = () => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); setShowScrollBtn(false) }

  const handleInputChange = (e) => {
    setInput(e.target.value)
    if (!channelRef.current) return
    channelRef.current.track({ username, isTyping: true })
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => { channelRef.current?.track({ username, isTyping: false }) }, 1500)
  }

  const sendMessage = async () => {
    if (!input.trim()) return
    const content = input.trim()
    const replyData = replyTo ? { id: replyTo.id, username: replyTo.username, content: replyTo.content } : null
    setInput(''); setReplyTo(null)
    clearTimeout(typingTimeoutRef.current)
    channelRef.current?.track({ username, isTyping: false })
    const optimisticMsg = { id: `opt-${Date.now()}`, username, content, room, created_at: new Date().toISOString(), reply_to: replyData }
    setMessages(prev => [...prev, optimisticMsg])
    isAtBottomRef.current = true
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 30)
    await supabase.from('messages').insert({ username, content, room, reply_to: replyData })
  }

  const handleReply = (msg) => { setReplyTo({ id: msg.id, username: msg.username, content: msg.content }); inputRef.current?.focus() }
  const handleEdit = async (msgId, content) => {
    const edited_at = new Date().toISOString()
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content, edited_at } : m))
    await supabase.from('messages').update({ content, edited_at }).eq('id', msgId)
  }
  const handleDelete = async (msgId) => {
    const deleted_at = new Date().toISOString()
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, deleted_at } : m))
    await supabase.from('messages').update({ deleted_at }).eq('id', msgId)
  }

  const handleReact = useCallback(async (messageId, emoji) => {
    const existing = (reactionsMap[messageId] || []).find(r => r.username === username && r.emoji === emoji)
    if (existing) {
      setReactionsMap(prev => ({ ...prev, [messageId]: (prev[messageId] || []).filter(r => r.id !== existing.id) }))
      await supabase.from('reactions').delete().eq('id', existing.id)
    } else {
      const optimistic = { id: `opt-${Date.now()}`, message_id: messageId, username, emoji, created_at: new Date().toISOString() }
      setReactionsMap(prev => ({ ...prev, [messageId]: [...(prev[messageId] || []), optimistic] }))
      const { data } = await supabase.from('reactions').insert({ message_id: messageId, username, emoji }).select().single()
      if (data) {
        setReactionsMap(prev => ({ ...prev, [messageId]: (prev[messageId] || []).map(r => r.id === optimistic.id ? data : r) }))
      }
    }
  }, [reactionsMap, username])

  const switchRoom = (r) => {
    setUnreadCounts(prev => ({ ...prev, [r]: 0 }))
    setMessages([]); setTypingUsers([]); setReplyTo(null)
    setRoom(r); setReactionsMap({})
    isAtBottomRef.current = true; setShowScrollBtn(false)
    if (isMobile) setSidebarOpen(false)
  }

  const typingText = typingUsers.length === 1
    ? `${typingUsers[0]} is typing...`
    : typingUsers.length > 1 ? `${typingUsers.join(', ')} are typing...` : ''

  const sidebarProps = {
    t, isMobile, setSidebarOpen, switchRoom, room, username, dark, setDark,
    unreadCounts, onlineUsers, channels,
    onCreateChannel: () => setShowCreateChannel(true),
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: t.bg, color: t.text, position: 'relative', overflow: 'hidden' }}>

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <CreateChannelModal
          t={t}
          onClose={() => setShowCreateChannel(false)}
          onCreate={handleCreateChannel}
        />
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <div style={{ width: 220, borderRight: `1px solid ${t.border}`, flexShrink: 0 }}>
          <Sidebar {...sidebarProps} />
        </div>
      )}

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: t.overlay, zIndex: 10 }} />
      )}

      {/* Mobile drawer */}
      {isMobile && (
        <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 260, zIndex: 20, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.25s ease', boxShadow: sidebarOpen ? '8px 0 32px rgba(0,0,0,0.25)' : 'none' }}>
          <Sidebar {...sidebarProps} />
        </div>
      )}

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header */}
        <div style={{ padding: isMobile ? '10px 14px' : '12px 20px', borderBottom: `1px solid ${t.border}`, background: t.headerBg, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {isMobile && (
            <button onClick={() => setSidebarOpen(true)} aria-label="Open sidebar" style={{ background: 'none', border: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 22, padding: 0, lineHeight: 1, flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>
              <FiMenu aria-hidden="true" />
            </button>
          )}
          <span style={{ color: t.textFaint, fontSize: 18, fontWeight: 300 }}>#</span>
          <span style={{ fontWeight: 600, fontSize: 15, color: t.text }}>{room}</span>

          {onlineUsers.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: t.presenceBg, borderRadius: 20, padding: '3px 10px', fontSize: 12, color: t.textMuted, marginLeft: isMobile ? 'auto' : 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.onlineDot, display: 'inline-block', flexShrink: 0 }} />
              {onlineUsers.length} online
            </div>
          )}

          {!isMobile && (
            <div style={{ marginLeft: 'auto' }}>
              <button onClick={() => setDark(!dark)} style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${t.border}`, background: 'none', color: t.textMuted, cursor: 'pointer', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ThemeToggleContent dark={dark} />
              </button>
            </div>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollContainerRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px' : '16px 20px', display: 'flex', flexDirection: 'column', gap: 2, position: 'relative' }}>
          <div ref={topSentinelRef} style={{ height: 1 }} />

          {loadingMore && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: t.textFaint, background: t.input, borderRadius: 20, padding: '6px 14px' }}>
                <span style={{ display: 'flex', gap: 3 }}>
                  {[0,1,2].map(i => <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: t.textFaint, display: 'inline-block', animation: 'bounce 1s infinite', animationDelay: `${i * 0.2}s` }} />)}
                </span>
                Loading older messages...
              </div>
            </div>
          )}

          {!hasMore && messages.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 16px' }}>
              <div style={{ flex: 1, height: 1, background: t.border }} />
              <span style={{ fontSize: 11, color: t.textFaint, whiteSpace: 'nowrap', padding: '2px 10px', border: `1px solid ${t.border}`, borderRadius: 10 }}>Beginning of #{room}</span>
              <div style={{ flex: 1, height: 1, background: t.border }} />
            </div>
          )}

          {messages.length === 0 && !loadingMore && (
            <div style={{ color: t.textFaint, fontSize: 14, textAlign: 'center', marginTop: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              Belum ada pesan di #{room} <FiSmile aria-hidden="true" />
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageRow
              key={msg.id} msg={msg}
              prevMsg={messages[i - 1]} nextMsg={messages[i + 1]}
              username={username} t={t} isMobile={isMobile}
              onReply={handleReply} onEdit={handleEdit}
              onDelete={handleDelete} onReact={handleReact}
              reactionsMap={reactionsMap}
            />
          ))}

          {typingText && (
            <div style={{ marginTop: 8 }}>
              <div style={{ background: t.bubbleOther, borderRadius: '4px 14px 14px 14px', padding: '9px 14px', fontSize: 13, color: t.textMuted, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: t.textMuted, display: 'inline-block', animation: 'bounce 1s infinite', animationDelay: `${i * 0.2}s` }} />)}
                </span>
                {typingText}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Scroll-to-bottom */}
        {showScrollBtn && (
          <button onClick={scrollToBottom} aria-label="Scroll to latest" style={{ position: 'absolute', bottom: isMobile ? 74 : 80, left: '50%', transform: 'translateX(-50%)', height: 34, borderRadius: 20, padding: '0 14px', background: t.scrollBtnBg, color: t.scrollBtnText, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.25)', zIndex: 5, animation: 'fadeIn 0.15s ease' }}>
            <FiChevronDown aria-hidden="true" />
            <span style={{ fontSize: 12, fontWeight: 500, marginLeft: 4 }}>Terbaru</span>
          </button>
        )}

        {/* Reply preview */}
        {replyTo && (
          <div style={{ padding: '8px 16px', background: t.replyPreviewBg, borderTop: `1px solid ${t.replyPreviewBorder}`, display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeIn 0.15s ease' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: t.replyBorder, display: 'block' }}>Replying to {replyTo.username}</span>
              <span style={{ fontSize: 12, color: t.textMuted, display: 'block', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{replyTo.content}</span>
            </div>
            <button onClick={() => setReplyTo(null)} aria-label="Cancel reply" style={{ background: 'none', border: 'none', color: t.textFaint, cursor: 'pointer', padding: 4, display: 'inline-flex', alignItems: 'center', borderRadius: 4 }}>
              <FiX size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Input */}
        <div style={{ padding: isMobile ? '10px 12px' : '12px 20px', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, background: t.bg }}>
          <input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={`Pesan di #${room}...`}
            style={{ flex: 1, padding: '11px 16px', borderRadius: 24, border: `1px solid ${t.border}`, fontSize: 14, color: t.text, background: t.input, outline: 'none', minWidth: 0 }}
          />
          <button onClick={sendMessage} style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', background: t.button, color: t.buttonText, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FiSend aria-hidden="true" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(4px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        input { -webkit-appearance: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${dark ? '#333' : '#ddd'}; border-radius: 4px; }
      `}</style>
    </div>
  )
}