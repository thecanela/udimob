import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePlayer } from '../hooks/usePlayer'
import type { Room, Player } from '../types'

export default function RoomSetupScreen() {
  const navigate = useNavigate()
  const { roomId } = useParams()
  const { player, setPlayer } = usePlayer()
  const [room, setRoom] = useState<Room | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [roomName, setRoomName] = useState('')
  const [initialBalance, setInitialBalance] = useState('1500')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!roomId) return
    supabase.from('rooms').select().eq('id', roomId).single().then(({ data }) => {
      if (!data) return
      setRoom(data)
      setRoomName(data.name)
      setInitialBalance(String(data.initial_balance))
      supabase.from('players').select().eq('room_id', roomId).then(({ data: players }) => {
        setPlayers(players || [])
        const host = players?.find(p => p.is_host)
        if (host && !player) setPlayer(host)
      })
    })
    const sub = supabase
      .channel('room-setup')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
        payload => setPlayers(p => [...p, payload.new as Player])
      )
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [roomId])

  const startGame = async () => {
    if (!roomId) return
    await supabase.from('rooms').update({ name: roomName, initial_balance: Number(initialBalance), status: 'playing' }).eq('id', roomId)
    const p = player || players.find(p => p.is_host) || players[0]
    navigate(`/jogo/${roomId}?playerId=${p?.id}`)
  }

  const shareInvite = () => {
    if (!room) return
    const link = `${window.location.origin}/convidado/${room.code}`
    navigator.clipboard?.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="screen" style={{ gap: 24 }}>
      <div className="header">
        <button className="header-back" onClick={() => navigate('/')}>←</button>
        <h1>Configurar Sala</h1>
      </div>
      <div className="input-group">
        <label>Nome da Sala</label>
        <input value={roomName} onChange={e => setRoomName(e.target.value)} />
      </div>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ fontSize: 14, color: 'var(--muted)' }}>Jogadores ({players.length})</h3>
        {players.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: p.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>{p.name[0]}</div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{p.name} {p.is_host ? '👑' : ''}</p>
              <p style={{ color: 'var(--muted)', fontSize: 12 }}>R$ {p.balance}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-primary" onClick={startGame}>
        Iniciar Jogo
      </button>
      <button className="btn btn-secondary" onClick={shareInvite}>
        Convidar Jogadores
      </button>
      {copied && (
        <div style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', padding: '12px 24px', borderRadius: 999, fontSize: 14, fontWeight: 600, zIndex: 100 }}>
          ✅ Link copiado!
        </div>
      )}
    </div>
  )
}
