import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Player, Property } from '../types'

interface PlayerWithTotal extends Player {
  patrimonio: number
}

export default function RankingScreen() {
  const navigate = useNavigate()
  const { roomId } = useParams()
  const [players, setPlayers] = useState<PlayerWithTotal[]>([])

  useEffect(() => {
    if (!roomId) return
    ;(async () => {
      const { data: players } = await supabase
        .from('players').select().eq('room_id', roomId)
      if (!players) return

      const enriched: PlayerWithTotal[] = await Promise.all(
        players.map(async (p) => {
          const { data: props } = await supabase
            .from('player_properties').select('*, property:property_id(*)')
            .eq('player_id', p.id)
          const mortgageTotal = (props || []).reduce((sum, pp) => {
            const prop = pp.property as Property | undefined
            return sum + (prop?.mortgage_value ?? 0)
          }, 0)
          return { ...p, patrimonio: p.balance + mortgageTotal }
        })
      )

      const active = enriched.filter(p => p.is_active).sort((a, b) => b.patrimonio - a.patrimonio)
      const inactive = enriched.filter(p => !p.is_active)
      setPlayers([...active, ...inactive])
    })()
  }, [roomId])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="screen" style={{ alignItems: 'center', gap: 24, textAlign: 'center' }}>
      <span style={{ fontSize: 64 }}>🏆</span>
      <h1 style={{ fontSize: 28, fontWeight: 800 }}>Fim de Jogo!</h1>
      <p style={{ color: 'var(--muted)' }}>Ranking dos Jogadores</p>
      <p style={{ color: 'var(--muted)', fontSize: 13 }}>Patrimônio = Saldo + Valor de hipoteca das propriedades</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        {players.map((p) => {
          const isActive = p.is_active
          const activeIndex = players.filter(pl => pl.is_active).indexOf(p)
          return (
          <div key={p.id} className="card" style={{
            display: 'flex', alignItems: 'center', gap: 16,
            opacity: isActive ? 1 : 0.45,
            borderColor: isActive ? (activeIndex === 0 ? '#FFD700' : activeIndex === 1 ? '#C0C0C0' : activeIndex === 2 ? '#CD7F32' : 'var(--border)') : 'var(--border)',
          }}>
            <span style={{ fontSize: 32 }}>{isActive ? (medals[activeIndex] || `${activeIndex + 1}º`) : '💤'}</span>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{ fontWeight: 600 }}>{p.name}</p>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>R$ {p.balance.toLocaleString()}</p>
              <p style={{ color: 'var(--primary)', fontSize: 18, fontWeight: 700, marginTop: 2 }}>
                Patrimônio: R$ {p.patrimonio.toLocaleString()}
              </p>
            </div>
          </div>
          )
        })}
      </div>
      <button className="btn btn-primary" onClick={async () => {
        if (roomId) await supabase.from('rooms').delete().eq('id', roomId)
        navigate('/')
      }}>
        🆕 Novo Jogo
      </button>
    </div>
  )
}
