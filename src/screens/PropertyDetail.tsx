import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Property } from '../types'

export default function PropertyDetail() {
  const navigate = useNavigate()
  const { roomId, propertyId } = useParams()
  const [searchParams] = useSearchParams()
  const playerId = searchParams.get('playerId')
  const [property, setProperty] = useState<Property | null>(null)
  const [playerBalance, setPlayerBalance] = useState(0)
  const [isOwned, setIsOwned] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!propertyId) return
    supabase.from('properties').select().eq('id', propertyId).single().then(({ data }) => setProperty(data))
    if (playerId) {
      supabase.from('players').select('balance').eq('id', playerId).single().then(({ data }) => {
        if (data) setPlayerBalance(data.balance)
      })
    }
    if (roomId && propertyId) {
      ;(async () => {
        const { data: roomPlayers } = await supabase
          .from('players').select('id').eq('room_id', roomId)
        const playerIds = (roomPlayers || []).map(p => p.id)
        if (playerIds.length === 0) return
        const { data: owned } = await supabase
          .from('player_properties').select('id').eq('property_id', propertyId).in('player_id', playerIds)
        if (owned && owned.length > 0) setIsOwned(true)
      })()
    }
  }, [propertyId, playerId, roomId])

  const buy = async () => {
    if (!property || !playerId || !roomId) return
    if (playerBalance < property.purchase_price || isOwned) return
    setLoading(true)
    await supabase.from('players').update({ balance: playerBalance - property.purchase_price }).eq('id', playerId)
    await supabase.from('player_properties').insert({ player_id: playerId, property_id: propertyId! })
    await supabase.from('transactions').insert({
      room_id: roomId, from_player_id: playerId, amount: property.purchase_price, type: 'purchase',
      description: `Compra de ${property.name}`
    })
    setLoading(false)
    navigate(`/jogo/${roomId}?playerId=${playerId}`)
  }

  if (!property) return <div className="screen">Carregando...</div>

  const rents = [
    { label: 'Aluguel Base', value: property.rent_base },
    { label: 'Aluguel Conjunto', value: property.rent_full_set },
    { label: '1 Casa', value: property.rent_1_house },
    { label: '2 Casas', value: property.rent_2_houses },
    { label: '3 Casas', value: property.rent_3_houses },
    { label: '4 Casas', value: property.rent_4_houses },
    { label: 'Hotel', value: property.rent_hotel },
  ]

  return (
    <div className="screen" style={{ gap: 20 }}>
      <div className="header">
        <button className="header-back" onClick={() => navigate(`/jogo/${roomId}/loja?playerId=${playerId}`)}>←</button>
        <h1>{property.name}</h1>
      </div>
      <div style={{ width: '100%', height: 6, borderRadius: 3, background: property.color }} />
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 style={{ fontSize: 14, color: 'var(--muted)' }}>Valores de Aluguel</h3>
        {rents.map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 14 }}>{r.label}</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>R$ {r.value}</span>
          </div>
        ))}
      </div>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14 }}>Preço de Compra</span>
          <span style={{ fontSize: 14, fontWeight: 600 }}>R$ {property.purchase_price}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14 }}>Casas custam</span>
          <span style={{ fontSize: 14 }}>R$ {property.house_cost}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14 }}>Hotéis custam</span>
          <span style={{ fontSize: 14 }}>R$ {property.hotel_cost}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14 }}>Hipoteca</span>
          <span style={{ fontSize: 14 }}>R$ {property.mortgage_value}</span>
        </div>
      </div>
      {isOwned ? (
        <p style={{ color: 'var(--destructive)', fontSize: 16, fontWeight: 600, textAlign: 'center' }}>
          Essa propriedade já foi vendida
        </p>
      ) : (
        <>
          <button className="btn btn-primary" onClick={buy} disabled={loading || playerBalance < property.purchase_price}>
            {loading ? 'Comprando...' : `Comprar por R$ ${property.purchase_price}`}
          </button>
          {playerBalance < property.purchase_price && (
            <p style={{ color: 'var(--destructive)', fontSize: 14, textAlign: 'center' }}>Saldo insuficiente</p>
          )}
        </>
      )}
    </div>
  )
}
