import { Outlet } from "react-router-dom";
import { Header } from "./Header";

export function AppShell() {
  return (
    <div className="app-shell">
      <Header />
      <Outlet />
      <footer className="site-footer">
        <span className="footer-mark">NOCTURNE CLUB</span>
        <span>Private Game Night · Nur virtuelle Tokens – kein Echtgeldwert</span>
      </footer>
    </div>
  );
}
