import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePlayer } from '../hooks/usePlayer'

export default function LoginScreen() {
  const navigate = useNavigate()
  const { setPlayer } = usePlayer()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const createRoom = async () => {
    if (!name.trim()) return
    setLoading(true)
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data: room } = await supabase
      .from('rooms')
      .insert({ name: `Sala de ${name}`, code, initial_balance: 1500, status: 'waiting' })
      .select()
      .single()
    if (!room) { setLoading(false); return }
    const { data: player } = await supabase.from('players').insert({
      room_id: room.id, name, balance: room.initial_balance, is_host: true,
    }).select().single()
    if (player) setPlayer(player)
    setLoading(false)
    navigate(`/sala/${room.id}`)
  }

  return (
    <div className="screen" style={{ alignItems: 'center', gap: 0, textAlign: 'center' }}>
      <div style={{ flex: 1 }} />
      <img src="/udimob_logo.svg" alt="UdIMob" style={{ width: 240 }} />
      <div style={{ flex: 1 }} />
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="input-group" style={{ width: '100%' }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Digite seu nome" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          <button className="btn btn-primary" onClick={createRoom} disabled={loading || !name.trim()}>
            {loading ? 'Criando...' : 'Criar Sala'}
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/entrar')}>
            Entrar em uma Sala
          </button>
        </div>
      </div>
    </div>
  )
}
