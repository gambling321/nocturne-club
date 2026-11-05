import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { Lobby } from "./pages/Lobby";
import { Roulette } from "./pages/Roulette";
import { Blackjack } from "./pages/Blackjack";
import { Slots } from "./pages/Slots";
import { Dice } from "./pages/Dice";
import { HiLo } from "./pages/HiLo";
import { Plinko } from "./pages/Plinko";
import { Baccarat } from "./pages/Baccarat";
import { Wheel } from "./pages/Wheel";
import { Mines } from "./pages/Mines";
import { Crash } from "./pages/Crash";
import { Limbo } from "./pages/Limbo";
import { Keno } from "./pages/Keno";
import { VideoPoker } from "./pages/VideoPoker";
import { DragonTiger } from "./pages/DragonTiger";
import { CoinFlip } from "./pages/CoinFlip";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Lobby />} />
        <Route path="/roulette" element={<Roulette />} />
        <Route path="/blackjack" element={<Blackjack />} />
        <Route path="/slots" element={<Slots />} />
        <Route path="/dice" element={<Dice />} />
        <Route path="/hilo" element={<HiLo />} />
        <Route path="/plinko" element={<Plinko />} />
        <Route path="/baccarat" element={<Baccarat />} />
        <Route path="/wheel" element={<Wheel />} />
        <Route path="/mines" element={<Mines />} />
        <Route path="/crash" element={<Crash />} />
        <Route path="/limbo" element={<Limbo />} />
        <Route path="/keno" element={<Keno />} />
        <Route path="/video-poker" element={<VideoPoker />} />
        <Route path="/dragon-tiger" element={<DragonTiger />} />
        <Route path="/coinflip" element={<CoinFlip />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
