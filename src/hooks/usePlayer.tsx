import { createContext, useContext, useState, type ReactNode } from 'react'
import type { Player } from '../types'

interface PlayerContextType {
  player: Player | null
  setPlayer: (p: Player | null) => void
}

const PlayerContext = createContext<PlayerContextType>({ player: null, setPlayer: () => {} })

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null)
  return (
    <PlayerContext.Provider value={{ player, setPlayer }}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  return useContext(PlayerContext)
}
