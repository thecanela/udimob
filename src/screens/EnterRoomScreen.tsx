import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function EnterRoomScreen() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const enterRoom = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError('')
    const { data: room } = await supabase
      .from('rooms')
      .select()
      .eq('code', code.trim().toUpperCase())
      .single()
    if (!room) {
      setError('Sala não encontrada')
      setLoading(false)
      return
    }
    setLoading(false)
    navigate(`/convidado/${room.code}`)
  }

  return (
    <div className="screen" style={{ gap: 24 }}>
      <div className="header">
        <button className="header-back" onClick={() => navigate('/')}>←</button>
        <h1>Entrar na Sala</h1>
      </div>
      <div className="input-group">
        <label>Código da Sala</label>
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="EX: SALA-1234"
          maxLength={8}
        />
      </div>
      {error && <p style={{ color: 'var(--destructive)', fontSize: 14 }}>{error}</p>}
      <button className="btn btn-primary" onClick={enterRoom} disabled={loading || code.length < 6}>
        {loading ? 'Buscando...' : 'Entrar Agora'}
      </button>
    </div>
  )
}
