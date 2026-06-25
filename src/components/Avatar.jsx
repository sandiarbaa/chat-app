export function getInitials(name) {
  return name.slice(0, 2).toUpperCase()
}

export function Avatar({ name, size = 32 }) {
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