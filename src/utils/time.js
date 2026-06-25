export function formatTime(isoString) {
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

export function formatDateDivider(isoString) {
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

export function truncate(str, n = 60) {
  return str.length > n ? str.slice(0, n) + '…' : str
}