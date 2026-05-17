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
    <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', gap: 24, textAlign: 'center' }}>
      <span style={{ fontSize: 64 }}>🏠</span>
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Banco Imobiliário</h1>
        <p style={{ color: 'var(--muted)', marginTop: 8 }}>Jogue com seus amigos em tempo real!</p>
      </div>
      <div className="input-group" style={{ width: '100%' }}>
        <label>Seu Nome</label>
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
  )
}
