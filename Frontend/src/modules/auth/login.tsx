import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff, ShieldCheck, FileText, Boxes } from 'lucide-react';
import { useStore } from '../../contexts/store-provider';
import { SIDEBAR_COLLAPSED_KEY } from '../../shared-components/layout';
import { BrandLogo } from '../../shared-components/illustrations/brand-logo';
import { FarmScene } from '../../shared-components/illustrations/farm-scene';
import { Drops } from '../../shared-components/illustrations/dairy-illustrations';
import { MilkDropSpinner } from '../../shared-components/illustrations/loaders';

const highlights = [
  { icon: FileText, title: 'Smart invoicing', text: 'Sell by quantity or amount, print branded PDFs.' },
  { icon: Boxes, title: 'Live inventory', text: 'Stock levels and low-stock alerts at a glance.' },
  { icon: ShieldCheck, title: 'Secure by default', text: 'Token-based sign-in for every session.' },
];

const Login = () => {
  const { authStore } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await authStore.login(email, password);
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, '1');
      navigate('/');
    } catch {
      setError('Invalid email or password');
    }
  }

  return (
    <div data-testid="login-page" className="min-h-screen flex bg-[var(--color-page-bg)]">
      <div className="flex-1 flex items-center justify-center px-6 sm:px-10 relative overflow-hidden">
        <Drops size={90} className="absolute top-10 right-10 opacity-60 animate-float pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-primary-light/70 blur-3xl pointer-events-none" />

        <div className="w-full max-w-sm relative animate-fade-in">
          <BrandLogo size={48} subtitle="Operations Suite" className="mb-10" />

          <h1 className="text-3xl font-extrabold text-slate-900 mb-1.5 tracking-tight">Welcome back</h1>
          <p className="text-sm text-slate-500 mb-8">Sign in to manage your dairy operations.</p>

          <form data-testid="login-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="login-email"
                  data-testid="login-email-input"
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="admin@vijaydairy.com"
                  className="input-base pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="login-password"
                  data-testid="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input-base pl-10 pr-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary-light/60"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div data-testid="login-error" role="alert" className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              data-testid="login-submit-button"
              type="submit"
              disabled={authStore.inProgress}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 group"
            >
              {authStore.inProgress ? (
                <>
                  <MilkDropSpinner size={20} label="Signing in" /> Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-xs text-slate-400">© {new Date().getFullYear()} Vijay Dairy · Fresh from the farm. Daily.</p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col" style={{ background: 'linear-gradient(170deg, var(--color-primary-light), #fdf6d8 70%)' }}>
        <div className="relative z-10 p-12 pt-14 max-w-xl">
          <span className="badge badge-gold mb-4">Trusted by local dairies</span>
          <h2 className="text-4xl font-extrabold text-primary-dark leading-tight tracking-tight mb-3" style={{ fontFamily: 'var(--font-serif-accent)' }}>
            Fresh from the farm.
            <br />
            Daily.
          </h2>
          <p className="text-primary-dark/70 text-sm max-w-md">Manage products, invoices and inventory for your dairy business in one place.</p>
        </div>

        <div className="relative z-10 px-12 grid grid-cols-3 gap-3 max-w-2xl">
          {highlights.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl bg-white/90 backdrop-blur p-3.5 shadow-lg shadow-primary/10 border border-white">
              <div className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center mb-2">
                <Icon size={16} />
              </div>
              <div className="text-xs font-bold text-slate-800">{title}</div>
              <div className="text-[11px] text-slate-500 leading-snug mt-0.5">{text}</div>
            </div>
          ))}
        </div>

        <FarmScene className="absolute inset-x-0 bottom-0 w-full h-[62%]" transparentSky fit="contain" />
      </div>
    </div>
  );
};

export default observer(Login);
