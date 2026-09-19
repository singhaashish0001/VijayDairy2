import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { LayoutDashboard, Package, FilePlus, FileText, Settings as SettingsIcon, LogOut, ChevronRight, Menu, CalendarDays } from 'lucide-react';
import { useStore } from '../contexts/store-provider';
import { BrandLogo, BrandMark } from './illustrations/brand-logo';

const navGroups = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, testId: 'nav-dashboard', end: true }],
  },
  {
    label: 'Sales',
    items: [
      { to: '/invoices/new', label: 'Create Invoice', icon: FilePlus, testId: 'nav-create-invoice', end: true },
      { to: '/invoices', label: 'Invoices', icon: FileText, testId: 'nav-invoices', end: true },
    ],
  },
  {
    label: 'Catalog',
    items: [{ to: '/products', label: 'Products', icon: Package, testId: 'nav-products', end: true }],
  },
  {
    label: 'System',
    items: [{ to: '/settings', label: 'Settings', icon: SettingsIcon, testId: 'nav-settings', end: true }],
  },
];

export const SIDEBAR_COLLAPSED_KEY = 'vd_sidebar_collapsed';

/** Pasture silhouette at the foot of the sidebar — pure decoration. */
const SidebarHills = () => (
  <svg viewBox="0 0 256 60" preserveAspectRatio="none" className="w-full h-14 block" aria-hidden="true">
    <path d="M0 34c40-22 80-18 128 0s90 14 128-6v32H0z" fill="rgba(255,255,255,0.06)" />
    <path d="M0 46c50-20 92-10 138 4s80 4 118-8v18H0z" fill="rgba(255,255,255,0.08)" />
  </svg>
);

const Layout = () => {
  const { authStore } = useStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (stored !== null) return stored === '1';
    // No saved preference yet — default to collapsed on small screens so the
    // overlay drawer doesn't cover the whole viewport on first load.
    return window.matchMedia('(max-width: 767px)').matches;
  });
  const asideRef = useRef<HTMLElement>(null);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      return next;
    });
  }

  // On mobile the sidebar is a full overlay drawer — picking a page should close it so
  // the newly-navigated content underneath isn't blocked. Desktop's persistent sidebar
  // is unaffected (nav clicks there don't need to force a collapse).
  function handleNavClick() {
    if (window.matchMedia('(max-width: 767px)').matches) {
      setCollapsed(true);
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, '1');
    }
  }

  useEffect(() => {
    if (collapsed) return;

    function handlePointerDown(e: MouseEvent) {
      if (asideRef.current && !asideRef.current.contains(e.target as Node)) {
        setCollapsed(true);
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, '1');
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [collapsed]);

  async function handleLogout() {
    await authStore.logout();
    navigate('/login');
  }

  const initial = (authStore.authData.userEmail || '?').charAt(0).toUpperCase();
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="h-screen flex bg-[var(--color-page-bg)] overflow-hidden">
      {/* Backdrop — mobile only. Dims the page and closes the sidebar on tap when it's
          open as an overlay; the outside-click effect above also handles this, this is
          just the visual dimming layer. */}
      {!collapsed && <div className="fixed inset-0 bg-slate-900/50 z-30 md:hidden" onClick={toggleCollapsed} aria-hidden="true" />}

      <aside
        ref={asideRef}
        style={{ background: 'linear-gradient(180deg, var(--color-primary-dark) 0%, color-mix(in srgb, var(--color-primary-dark) 62%, #000) 100%)' }}
        className={`fixed inset-y-0 left-0 z-40 md:z-auto md:relative shrink-0 h-full w-72 text-white flex flex-col shadow-xl md:shadow-none transition-all duration-200 ease-in-out ${
          collapsed ? '-translate-x-full md:translate-x-0 md:w-[76px]' : 'translate-x-0 md:w-64'
        }`}
      >
        <div className="h-1 bg-linear-to-r from-accent-mid via-primary-mid to-accent shrink-0" />

        <div className={`flex items-center gap-2.5 py-5 ${collapsed ? 'justify-center px-2' : 'px-4'}`}>
          <button
            onClick={toggleCollapsed}
            data-testid="sidebar-toggle"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors shrink-0"
          >
            <Menu size={19} />
          </button>
          {!collapsed && <BrandLogo size={36} inverted subtitle="Operations" className="animate-fade-in" />}
        </div>

        <div className="mx-4 border-t border-white/10" />

        <nav className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-4 ${collapsed ? 'px-2' : 'px-3'}`} aria-label="Main">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-3">
              {!collapsed && <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 animate-fade-in">{group.label}</div>}
              {collapsed && <div className="mx-3 mb-1.5 border-t border-white/10 first:hidden" />}
              <div className="space-y-1">
                {group.items.map(({ to, label, icon: Icon, testId, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    data-testid={testId}
                    onClick={handleNavClick}
                    title={collapsed ? label : undefined}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${collapsed ? 'justify-center px-0' : 'px-3'} ${
                        isActive ? 'bg-white text-primary-dark shadow-lg shadow-black/20' : 'text-white/75 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && !collapsed && <span className="absolute -left-3 top-2 bottom-2 w-1 rounded-r-full bg-accent-mid" />}
                        <span
                          className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors shrink-0 ${
                            isActive ? 'bg-primary-light text-primary' : 'bg-white/10 text-white/80 group-hover:bg-white/15'
                          }`}
                        >
                          <Icon size={15} />
                        </span>
                        {!collapsed && <span className="flex-1 truncate animate-fade-in">{label}</span>}
                        {!collapsed && isActive && <ChevronRight size={14} className="opacity-60 shrink-0" />}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {!collapsed && <SidebarHills />}

        <div className={`py-4 border-t border-white/10 ${collapsed ? 'px-2' : 'px-4'}`}>
          <div className={`flex items-center gap-2.5 mb-3 ${collapsed ? 'justify-center' : 'px-1'}`}>
            <div
              title={collapsed ? authStore.authData.userEmail : undefined}
              className="w-9 h-9 rounded-full bg-linear-to-br from-accent-mid to-accent flex items-center justify-center text-white text-sm font-bold shrink-0 ring-2 ring-white/20"
            >
              {initial}
            </div>
            {!collapsed && (
              <div className="min-w-0 animate-fade-in">
                <div className="text-xs font-semibold text-white truncate">{authStore.authData.userEmail}</div>
                <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-mid">Administrator</span>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            data-testid="logout-button"
            title={collapsed ? 'Logout' : undefined}
            className={`w-full flex items-center gap-2 py-2 rounded-xl text-sm font-medium text-white/70 hover:bg-red-500/20 hover:text-red-100 transition-colors ${collapsed ? 'justify-center px-0' : 'px-3'}`}
          >
            <LogOut size={16} className="shrink-0" />
            {!collapsed && <span className="animate-fade-in">Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 shrink-0 flex items-center gap-3 px-4 sm:px-6 bg-white/80 backdrop-blur border-b border-[#e6e9df]">
          {/* Open-trigger — mobile only, shown while the sidebar is off-canvas (its own toggle moves off-screen with it). */}
          {collapsed && (
            <button
              onClick={toggleCollapsed}
              data-testid="sidebar-toggle-mobile"
              title="Open sidebar"
              aria-label="Open sidebar"
              className="md:hidden w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50"
            >
              <Menu size={18} />
            </button>
          )}
          <BrandMark size={26} className="md:hidden" />
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <CalendarDays size={14} className="text-primary" />
            {today}
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <span className="hidden sm:inline text-xs text-slate-500 truncate max-w-[220px]">{authStore.authData.userEmail}</span>
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary-mid to-primary-dark text-white text-xs font-bold flex items-center justify-center">{initial}</div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default observer(Layout);
