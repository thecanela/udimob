import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Player, PlayerProperty, Property, RentType } from '../types'

export default function OwnedPropertyMgmt() {
  const navigate = useNavigate()
  const { roomId, playerPropertyId } = useParams()
  const [searchParams] = useSearchParams()
  const playerId = searchParams.get('playerId')
  const [pp, setPp] = useState<PlayerProperty | null>(null)
  const [property, setProperty] = useState<Property | null>(null)
  const [selectedRent, setSelectedRent] = useState<RentType>('base')
  const [players, setPlayers] = useState<Player[]>([])
  const [showSellPopup, setShowSellPopup] = useState(false)
  const [sellPrice, setSellPrice] = useState('')
  const [sellTarget, setSellTarget] = useState('')
  const [selling, setSelling] = useState(false)
  const [insufficientFunds, setInsufficientFunds] = useState(false)

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
    if (roomId && playerId) {
      supabase.from('players').select().eq('room_id', roomId).neq('id', playerId).then(({ data }) => {
        if (data) setPlayers(data)
      })
    }
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
      <div style={{
        background: property.color,
        margin: '-16px -16px 0',
        padding: '16px 16px 24px',
        borderRadius: '16px 16px 24px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <button className="header-back" onClick={() => navigate(`/jogo/${roomId}?playerId=${playerId}`)}
          style={{ color: 'white', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, width: 36, height: 36, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ←
        </button>
        <h1 style={{ color: 'white', margin: 0 }}>{property.name}</h1>
      </div>

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
        <button className="btn btn-destructive" onClick={sellToBank} disabled={selling}>
          Vender p/ Banco (R$ {property.mortgage_value})
        </button>
        <button className="btn btn-secondary" onClick={() => setShowSellPopup(true)}>
          Vender p/ Jogador
        </button>
      </div>

        {showSellPopup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}
             onClick={() => setShowSellPopup(false)}>
          <div className="card" style={{ width: '100%', maxWidth: 320 }}
               onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Vender {property.name}</h3>
            <div className="input-group" style={{ marginBottom: 12 }}>
              <label>Valor da Venda</label>
              <input type="number" value={sellPrice} onChange={e => setSellPrice(e.target.value)} placeholder="R$ 0" />
            </div>
            <div className="input-group" style={{ marginBottom: 20 }}>
              <label>Jogador</label>
              <select value={sellTarget} onChange={e => setSellTarget(e.target.value)}>
                <option value="">Selecione...</option>
                {players.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            {insufficientFunds && (
              <p style={{ color: 'var(--destructive)', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
                Jogador não tem saldo suficiente
              </p>
            )}
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-secondary" onClick={() => { setShowSellPopup(false); setInsufficientFunds(false) }} style={{ flex: 1 }}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={sellToPlayer} disabled={!sellPrice || !sellTarget || selling} style={{ flex: 1 }}>
                {selling ? 'Vendendo...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  async function sellToBank() {
    if (!pp || !property || !playerId || !roomId) return
    setSelling(true)
    const { data: p } = await supabase.from('players').select('balance').eq('id', playerId).single()
    await supabase.from('players').update({ balance: (p?.balance || 0) + property.mortgage_value }).eq('id', playerId)
    await supabase.from('player_properties').delete().eq('id', pp.id)
    await supabase.from('transactions').insert({
      room_id: roomId, to_player_id: playerId, amount: property.mortgage_value, type: 'bank',
      description: `Venda ao banco de ${property.name}`
    })
    setSelling(false)
    navigate(`/jogo/${roomId}?playerId=${playerId}`)
  }

  async function sellToPlayer() {
    if (!pp || !property || !playerId || !roomId || !sellTarget || !sellPrice) return
    const price = Number(sellPrice)
    setInsufficientFunds(false)
    const { data: buyer } = await supabase.from('players').select('balance').eq('id', sellTarget).single()
    if (!buyer || buyer.balance < price) {
      setInsufficientFunds(true)
      return
    }
    setSelling(true)
    const { data: seller } = await supabase.from('players').select('balance').eq('id', playerId).single()
    await supabase.from('players').update({ balance: buyer.balance - price }).eq('id', sellTarget)
    await supabase.from('players').update({ balance: (seller?.balance || 0) + price }).eq('id', playerId)
    await supabase.from('player_properties').update({ player_id: sellTarget }).eq('id', pp.id)
    await supabase.from('transactions').insert({
      room_id: roomId, from_player_id: sellTarget, to_player_id: playerId, amount: price, type: 'transfer',
      description: `Venda de ${property.name} para jogador`
    })
    setSelling(false)
    navigate(`/jogo/${roomId}?playerId=${playerId}`)
  }
}
