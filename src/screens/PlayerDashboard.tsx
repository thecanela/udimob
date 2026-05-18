import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePlayer } from '../hooks/usePlayer'
import type { Player, PlayerProperty } from '../types'

export default function PlayerDashboard() {
  const navigate = useNavigate()
  const { roomId } = useParams()
  const [searchParams] = useSearchParams()
  const { player: contextPlayer, setPlayer: setContextPlayer } = usePlayer()
  const playerId = searchParams.get('playerId') || contextPlayer?.id
  const [player, setPlayer] = useState<Player | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [properties, setProperties] = useState<PlayerProperty[]>([])
  const [amount, setAmount] = useState('')
  const [recipientId, setRecipientId] = useState('')
  const [fabOpen, setFabOpen] = useState(false)
  const [confirmLap, setConfirmLap] = useState(false)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!roomId) return
    loadData()
    const sub = supabase
      .channel(`game-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_properties', filter: `player_id=eq.${playerId}` }, loadData)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions', filter: `room_id=eq.${roomId}` }, loadData)
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [roomId, playerId])

  const loadData = async () => {
    if (!roomId) return
    const { data: p } = await supabase.from('players').select().eq('room_id', roomId)
    if (p) setPlayers(p)
    const { data: room } = await supabase.from('rooms').select('code').eq('id', roomId).single()
    if (room) setRoomCode(room.code)
    if (playerId) {
      const me = p?.find(pl => pl.id === playerId)
      if (me) { setPlayer(me); setContextPlayer(me) }
      const { data: pp } = await supabase.from('player_properties').select('*, property:property_id(*)').eq('player_id', playerId)
      if (pp) setProperties(pp)
    }
    await supabase.from('transactions').select().eq('room_id', roomId).order('created_at', { ascending: false }).limit(20)
  }

  const transfer = async () => {
    if (!player || !recipientId || !amount) return
    const val = Number(amount)
    if (val > player.balance) return
    await supabase.from('players').update({ balance: player.balance - val }).eq('id', player.id)
    if (recipientId !== 'bank') {
      await supabase.from('players').update({ balance: players.find(p => p.id === recipientId)!.balance + val }).eq('id', recipientId)
    }
    await supabase.from('transactions').insert({
      room_id: roomId, from_player_id: player.id, to_player_id: recipientId === 'bank' ? null : recipientId, amount: val,
      type: recipientId === 'bank' ? 'bank' : 'transfer',
      description: recipientId === 'bank' ? `Pagamento ao Banco por ${player.name}` : `Transferência de ${player.name}`
    })
    setAmount('')
  }

  if (!player) return <div className="screen">Carregando...</div>

  return (
    <div className="screen" style={{ gap: 20, paddingBottom: 100 }}>
      <div className="header">
        <h1>Olá, {player.name}</h1>
      </div>

      <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary), #7C6FF4)' }}>
        <p style={{ fontSize: 14, opacity: 0.8 }}>Saldo</p>
        <p style={{ fontSize: 32, fontWeight: 800 }}>R$ {player.balance.toLocaleString()}</p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ fontSize: 14, color: 'var(--muted)' }}>Transferir Dinheiro</h3>
        <div className="input-group">
          <label>Valor</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="R$ 0" />
        </div>
        <div className="input-group">
          <label>Para</label>
          <select value={recipientId} onChange={e => setRecipientId(e.target.value)}>
            <option value="">Selecione...</option>
            <option value="bank">🏦 Banco</option>
            {players.filter(p => p.id !== player.id && p.is_active).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={transfer} disabled={!recipientId || !amount}>
          Transferir Agora
        </button>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ fontSize: 14, color: 'var(--muted)' }}>Minhas Propriedades ({properties.length})</h3>
        {properties.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Nenhuma propriedade ainda</p>
        ) : properties.map(pp => {
          const prop = pp.property
          if (!prop) return null
          const rentMap: Record<string, number> = {
            base: prop.rent_base,
            full_set: prop.rent_full_set,
            '1': prop.rent_1_house,
            '2': prop.rent_2_houses,
            '3': prop.rent_3_houses,
            '4': prop.rent_4_houses,
            hotel: prop.rent_hotel,
          }
          const rentByType = rentMap[pp.rent_type] ?? prop.rent_base
          return (
            <div key={pp.id} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                 onClick={() => navigate(`/jogo/${roomId}/minha-propriedade/${pp.id}?playerId=${player.id}`)}>
              <div style={{ width: 4, height: 36, borderRadius: 2, background: prop.color }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600 }}>{prop.name}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {pp.has_hotel ? '🏨 Hotel' : pp.houses > 0 ? `🏠 ${pp.houses} casa${pp.houses > 1 ? 's' : ''}` : ''}
                  {pp.is_mortgaged ? ' • 🔒 Hipotecada' : ''}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 14, fontWeight: 700 }}>R$ {rentByType}</p>
              </div>
              <span style={{ color: 'var(--muted)' }}>›</span>
            </div>
          )
        })}
      </div>

      {fabOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9 }}
             onClick={() => setFabOpen(false)}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--surface)', borderRadius: '20px 20px 0 0', padding: 24 }}
               onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 20px' }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Menu do Jogo</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => navigate(`/jogo/${roomId}/loja?playerId=${player.id}`)}>
                🏪 Loja de Propriedades
              </button>
              <button className="btn btn-secondary" onClick={() => { setFabOpen(false); setConfirmLap(true) }}>
                🔄 Completei uma Volta (R$ 200)
              </button>
              <button className="btn btn-secondary" onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/convidado/${roomCode}`); setFabOpen(false); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>
                👥 Convidar Jogadores
              </button>
              <button className="btn btn-secondary" onClick={() => setFabOpen(false)}>
                Sair do Jogo
              </button>
              <button className="btn btn-destructive" onClick={() => { setFabOpen(false); setConfirmEnd(true) }}>
                Terminar o Jogo
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmLap && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}
             onClick={() => setConfirmLap(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 320, textAlign: 'center' }}
               onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>🔄 Completou uma volta?</p>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>Você vai receber R$ 200</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setConfirmLap(false)} style={{ flex: 1 }}>
                Não
              </button>
              <button className="btn btn-primary" onClick={async () => {
                await supabase.from('players').update({ balance: player.balance + 200 }).eq('id', player.id)
                await supabase.from('transactions').insert({
                  room_id: roomId, to_player_id: player.id, amount: 200, type: 'bank',
                  description: `${player.name} completou uma volta`
                })
                setConfirmLap(false)
              }} style={{ flex: 1 }}>
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmEnd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}
             onClick={() => setConfirmEnd(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 320, textAlign: 'center' }}
               onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>🏁 Terminar o jogo?</p>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>Tem certeza que quer encerrar a partida?</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => setConfirmEnd(false)} style={{ flex: 1 }}>
                Não
              </button>
              <button className="btn btn-destructive" onClick={async () => {
                await supabase.from('rooms').update({ status: 'finished' }).eq('id', roomId)
                setConfirmEnd(false)
                navigate(`/jogo/${roomId}/ranking`)
              }} style={{ flex: 1 }}>
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {copied && (
        <div style={{ position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', padding: '12px 24px', borderRadius: 999, fontSize: 14, fontWeight: 600, zIndex: 100 }}>
          ✅ Link copiado!
        </div>
      )}
      <button className="fab" onClick={() => setFabOpen(!fabOpen)}>
        {fabOpen ? '✕' : '+'}
      </button>
    </div>
  )
}
