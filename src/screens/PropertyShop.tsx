import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Property } from '../types'

export default function PropertyShop() {
  const navigate = useNavigate()
  const { roomId } = useParams()
  const [searchParams] = useSearchParams()
  const playerId = searchParams.get('playerId')
  const [properties, setProperties] = useState<Property[]>([])
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.from('properties').select().order('set_id').order('set_order').then(({ data }) => {
      if (data) setProperties(data)
    })
  }, [])

  useEffect(() => {
    if (!roomId) return
    ;(async () => {
      const { data: roomPlayers } = await supabase
        .from('players').select('id').eq('room_id', roomId)
      const playerIds = (roomPlayers || []).map(p => p.id)
      if (playerIds.length === 0) return
      const { data: owned } = await supabase
        .from('player_properties').select('property_id').in('player_id', playerIds)
      if (owned) setOwnedIds(new Set(owned.map(pp => pp.property_id)))
    })()
  }, [roomId])

  const filtered = properties.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const colorSets = [...new Set(filtered.map(p => p.set_id))]

  return (
    <div className="screen" style={{ gap: 16 }}>
      <div className="header">
        <button className="header-back" onClick={() => navigate(`/jogo/${roomId}?playerId=${playerId}`)}>←</button>
        <h1>Loja</h1>
      </div>
      <div className="input-group">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar propriedade..." />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {colorSets.map(setId => {
          const setProps = filtered.filter(p => p.set_id === setId)
          if (setProps.length === 0) return null
          return (
            <div key={setId} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {setProps.map(p => {
                const owned = ownedIds.has(p.id)
                return (
                  <div key={p.id} className="card" style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: 14,
                    cursor: owned ? 'not-allowed' : 'pointer', opacity: owned ? 0.5 : 1,
                  }} onClick={() => {
                    if (!owned) navigate(`/jogo/${roomId}/propriedade/${p.id}?playerId=${playerId}`)
                  }}>
                    <div style={{ width: 4, height: 40, borderRadius: 2, background: p.color }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--muted)' }}>R$ {p.purchase_price}</p>
                    </div>
                    {owned ? (
                      <span style={{ fontSize: 11, color: 'var(--destructive)', fontWeight: 600 }}>VENDIDA</span>
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>›</span>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
