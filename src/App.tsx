import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import CatalogPage from './pages/CatalogPage';
import PricingPage from './pages/PricingPage';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-md px-4 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-slate-700 text-white'
      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
  }`;

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-100">
        <aside className="flex w-60 flex-col bg-slate-900">
          <div className="px-6 py-6 text-lg font-semibold text-white">
            Dropmaster
          </div>
          <nav className="flex flex-col gap-1 px-3">
            <NavLink to="/" end className={navLinkClass}>
              Pricing
            </NavLink>
            <NavLink to="/catalog" className={navLinkClass}>
              Catálogo
            </NavLink>
          </nav>
        </aside>
        <main className="flex-1 overflow-x-auto p-8">
          <Routes>
            <Route path="/" element={<PricingPage />} />
            <Route path="/catalog" element={<CatalogPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
