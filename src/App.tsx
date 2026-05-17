import { useRoutes, BrowserRouter } from 'react-router-dom'
import { PlayerProvider } from './hooks/usePlayer'
import LoginScreen from './screens/LoginScreen'
import EnterRoomScreen from './screens/EnterRoomScreen'
import InvitePlayerScreen from './screens/InvitePlayerScreen'
import RoomSetupScreen from './screens/RoomSetupScreen'
import PlayerDashboard from './screens/PlayerDashboard'
import PropertyShop from './screens/PropertyShop'
import PropertyDetail from './screens/PropertyDetail'
import OwnedPropertyMgmt from './screens/OwnedPropertyMgmt'
import RankingScreen from './screens/RankingScreen'

function Routes() {
  return useRoutes([
    { path: '/', element: <LoginScreen /> },
    { path: '/entrar', element: <EnterRoomScreen /> },
    { path: '/convidado/:roomCode', element: <InvitePlayerScreen /> },
    { path: '/sala/:roomId', element: <RoomSetupScreen /> },
    { path: '/jogo/:roomId', element: <PlayerDashboard /> },
    { path: '/jogo/:roomId/loja', element: <PropertyShop /> },
    { path: '/jogo/:roomId/propriedade/:propertyId', element: <PropertyDetail /> },
    { path: '/jogo/:roomId/minha-propriedade/:playerPropertyId', element: <OwnedPropertyMgmt /> },
    { path: '/jogo/:roomId/ranking', element: <RankingScreen /> },
  ])
}

export default function App() {
  return (
    <BrowserRouter>
      <PlayerProvider>
        <Routes />
      </PlayerProvider>
    </BrowserRouter>
  )
}
