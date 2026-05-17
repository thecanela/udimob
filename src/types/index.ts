export interface Room {
  id: string
  name: string
  code: string
  initial_balance: number
  status: 'waiting' | 'playing' | 'finished'
  created_at: string
}

export interface Player {
  id: string
  room_id: string
  name: string
  balance: number
  avatar_color: string
  is_host: boolean
  is_active: boolean
  joined_at: string
}

export interface Property {
  id: string
  name: string
  color: string
  purchase_price: number
  rent_base: number
  rent_full_set: number
  rent_1_house: number
  rent_2_houses: number
  rent_3_houses: number
  rent_4_houses: number
  rent_hotel: number
  house_cost: number
  hotel_cost: number
  mortgage_value: number
  unmortgage_cost: number
  set_order: number
  set_id: number
}

export type RentType = 'base' | 'full_set' | '1' | '2' | '3' | '4' | 'hotel'

export interface PlayerProperty {
  id: string
  player_id: string
  property_id: string
  houses: number
  has_hotel: boolean
  is_mortgaged: boolean
  rent_type: RentType
  purchased_at: string
  property?: Property
}

export interface Transaction {
  id: string
  room_id: string
  from_player_id: string | null
  to_player_id: string | null
  amount: number
  type: 'transfer' | 'purchase' | 'rent' | 'house' | 'hotel' | 'mortgage' | 'unmortgage' | 'bank' | 'game_start' | 'game_end'
  description: string | null
  created_at: string
}
