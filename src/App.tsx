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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
