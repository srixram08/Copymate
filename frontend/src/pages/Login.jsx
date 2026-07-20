import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../utils/api.js';
import Logo from '../components/Logo.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect depending on user role
      if (user.role === 'customer') {
        navigate('/customer');
      } else if (user.role === 'shop_owner') {
        navigate('/shop');
      } else if (user.role === 'delivery_agent') {
        navigate('/delivery');
      } else if (user.role === 'admin') {
        navigate('/admin');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Login failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row relative overflow-hidden">
      {/* 3D Animated background rings */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[100px] animate-float-orb-1 pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-pink-600/10 blur-[100px] animate-float-orb-2 pointer-events-none" />

      {/* Brand Column */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-8 md:p-16 border-b md:border-b-0 md:border-r border-slate-900 z-10">
        <div className="cursor-pointer" onClick={() => navigate('/')}>
          <Logo size="medium" />
        </div>

        <div className="my-auto py-12 md:py-24">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4">
            Remote Document Printing Made Simple.
          </h1>
          <p className="text-slate-400 text-sm max-w-md leading-relaxed">
            Log in to manage print operations, track remote orders, or dispatch en-route deliveries.
          </p>
        </div>

        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">
          © 2026 CopyMate. Your Documents, Our Delivery.
        </div>
      </div>

      {/* Form Column */}
      <div className="w-full md:w-1/2 flex flex-col justify-center p-8 md:p-16 z-10">
        <div className="max-w-md w-full mx-auto">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-slate-400 text-xs mb-8 font-semibold">
            New to CopyMate? <Link to="/register" className="text-pink-400 hover:text-pink-300 font-bold hover:underline transition">Create an account</Link>
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-bold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-pink-500/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-pink-500/50 transition-colors"
                />
              </div>
            </div>

            <button
              id="login-btn"
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:to-pink-500 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:translate-y-0.5"
            >
              {loading ? "Signing In..." : "Sign In"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
