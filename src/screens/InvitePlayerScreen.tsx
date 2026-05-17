import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePlayer } from '../hooks/usePlayer'
import type { Room } from '../types'

export default function InvitePlayerScreen() {
  const navigate = useNavigate()
  const { roomCode } = useParams()
  const { setPlayer } = usePlayer()
  const [room, setRoom] = useState<Room | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!roomCode) return
    supabase.from('rooms').select().eq('code', roomCode).single().then(({ data }) => setRoom(data))
  }, [roomCode])

  const joinRoom = async () => {
    if (!room || !name.trim()) return
    setLoading(true)
    const { data: player } = await supabase
      .from('players')
      .insert({ room_id: room.id, name, balance: room.initial_balance, is_host: false })
      .select()
      .single()
    if (!player) { setLoading(false); return }
    setPlayer(player)
    setLoading(false)
    navigate(`/jogo/${room.id}?playerId=${player.id}`)
  }

  if (!room) return <div className="screen">Carregando...</div>

  return (
    <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', gap: 24, textAlign: 'center' }}>
      <span style={{ fontSize: 64 }}>🎲</span>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Você foi convidado!</h1>
      <p style={{ color: 'var(--muted)' }}>Entre na sala para jogar</p>
      <div className="card" style={{ width: '100%', textAlign: 'left' }}>
        <p style={{ fontWeight: 600 }}>🏠 {room.name}</p>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>Código: {room.code}</p>
      </div>
      <div className="input-group" style={{ width: '100%' }}>
        <label>Seu Nome</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Digite seu nome" />
      </div>
      <button className="btn btn-primary" onClick={joinRoom} disabled={loading || !name.trim()}>
        {loading ? 'Entrando...' : 'Entrar Agora'}
      </button>
    </div>
  )
}
