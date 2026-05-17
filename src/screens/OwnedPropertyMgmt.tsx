import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { PlayerProperty, Property, RentType } from '../types'

export default function OwnedPropertyMgmt() {
  const navigate = useNavigate()
  const { roomId, playerPropertyId } = useParams()
  const [searchParams] = useSearchParams()
  const playerId = searchParams.get('playerId')
  const [pp, setPp] = useState<PlayerProperty | null>(null)
  const [property, setProperty] = useState<Property | null>(null)
  const [selectedRent, setSelectedRent] = useState<RentType>('base')

  useEffect(() => {
    if (!playerPropertyId) return
    ;(async () => {
      const { data: ppData } = await supabase
        .from('player_properties').select().eq('id', playerPropertyId).single()
      if (!ppData) return
      setPp(ppData)
      setSelectedRent(ppData.rent_type || 'base')

      const { data: prop } = await supabase
        .from('properties').select().eq('id', ppData.property_id).single()
      if (!prop) return
      setProperty(prop)
    })()
  }, [playerPropertyId])

  const changeRentType = async (type: RentType) => {
    if (!pp) return
    setSelectedRent(type)
    await supabase.from('player_properties').update({ rent_type: type }).eq('id', pp.id)
  }

  if (!property || !pp) return <div className="screen">Carregando...</div>

  const rentOptions: { type: RentType; label: string; value: number }[] = [
    { type: 'base', label: 'Base', value: property.rent_base },
    { type: 'full_set', label: 'Conjunto', value: property.rent_full_set },
    { type: '1', label: '1 Casa', value: property.rent_1_house },
    { type: '2', label: '2 Casas', value: property.rent_2_houses },
    { type: '3', label: '3 Casas', value: property.rent_3_houses },
    { type: '4', label: '4 Casas', value: property.rent_4_houses },
    { type: 'hotel', label: 'Hotel', value: property.rent_hotel },
  ]

  const currentRent = rentOptions.find(r => r.type === selectedRent)?.value ?? property.rent_base

  return (
    <div className="screen" style={{ gap: 20 }}>
      <div className="header">
        <button className="header-back" onClick={() => navigate(`/jogo/${roomId}?playerId=${playerId}`)}>←</button>
        <h1>{property.name}</h1>
      </div>
      <div style={{ width: '100%', height: 6, borderRadius: 3, background: property.color }} />

      <div className="card">
        <h3 style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 8 }}>Aluguel Atual</h3>
        <p style={{ fontSize: 28, fontWeight: 800 }}>R$ {currentRent}</p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ fontSize: 14, color: 'var(--muted)' }}>Tipo de Aluguel</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {rentOptions.map(opt => (
            <button key={opt.type} className="btn" style={{
              flex: '1 0 calc(50% - 3px)', padding: '10px 8px', fontSize: 12, fontWeight: 500,
              background: selectedRent === opt.type ? 'var(--primary)' : 'transparent',
              color: selectedRent === opt.type ? 'white' : 'var(--foreground)',
              border: selectedRent === opt.type ? 'none' : '1.5px solid var(--border)',
              cursor: 'pointer',
            }} onClick={() => changeRentType(opt.type)}>
              {opt.label} — R$ {opt.value}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 style={{ fontSize: 14, color: 'var(--muted)' }}>Custos da Propriedade</h3>
        <p style={{ fontSize: 14 }}>🏠 Casas custam <strong>R$ {property.house_cost}</strong></p>
        <p style={{ fontSize: 14 }}>🏨 Hotéis custam <strong>R$ {property.hotel_cost}</strong></p>
        <p style={{ fontSize: 14 }}>🔓 Para quitar hipoteca <strong>R$ {property.unmortgage_cost}</strong></p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button className="btn btn-destructive">Vender p/ Banco</button>
        <button className="btn btn-secondary">Vender p/ Jogador</button>
      </div>
    </div>
  )
}
