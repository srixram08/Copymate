import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, ShoppingBag, DollarSign, RefreshCw, 
  MapPin, LogOut, ChartBar, Star, Menu, X, Shield, Printer, User
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api.js';
import Logo from '../components/Logo.jsx';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [shopsList, setShopsList] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, shops
  const [refreshing, setRefreshing] = useState(false);

  // Mobile sidebar toggles
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const cachedUser = localStorage.getItem('user');
    if (!cachedUser) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(cachedUser));
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setRefreshing(true);
      const resStats = await api.get('/admin/dashboard');
      setStats(resStats.data);

      const resUsers = await api.get('/admin/users');
      setUsersList(resUsers.data);

      const resShops = await api.get('/shops');
      setShopsList(resShops.data);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleShopStatus = async (shopId) => {
    try {
      await api.put(`/admin/shops/${shopId}/toggle-status`);
      alert("Shop status modified successfully!");
      fetchAdminData();
    } catch (err) {
      console.error(err);
      alert("Failed to modify shop status.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleSwitchProfile = async (targetRole) => {
    const demoUsers = {
      customer: { email: 'sriram@copymate.com', password: 'admin123' },
      shop_owner: { email: 'rajesh@copymate.com', password: 'admin123' },
      delivery_agent: { email: 'amit@copymate.com', password: 'admin123' },
      admin: { email: 'admin@copymate.com', password: 'admin123' }
    };
    
    const credentials = demoUsers[targetRole];
    if (!credentials) return;
    
    try {
      const res = await api.post('/auth/login', credentials);
      const { token, user: loggedUser } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      
      // Navigate to correct route and reload to clear state contexts
      if (targetRole === 'customer') navigate('/customer');
      else if (targetRole === 'shop_owner') navigate('/shop');
      else if (targetRole === 'delivery_agent') navigate('/delivery');
      else if (targetRole === 'admin') navigate('/admin');
      
      window.location.reload();
    } catch (err) {
      console.error("Profile switcher error:", err);
      alert("Failed to switch profile.");
    }
  };

  const getChartData = () => {
    if (!stats || !stats.statusBreakdown) return [];
    return Object.keys(stats.statusBreakdown).map(key => ({
      name: key.replace(/_/g, ' '),
      count: stats.statusBreakdown[key]
    }));
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: <ChartBar className="w-4 h-4" /> },
    { id: 'users', label: 'Platform Users', icon: <Users className="w-4 h-4" /> },
    { id: 'shops', label: 'Print Shops', icon: <Printer className="w-4 h-4" /> },
    { id: 'account', label: 'My Account', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex relative overflow-hidden">
      
      {/* Background radial blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-blue-600/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-pink-600/5 blur-[100px] pointer-events-none" />

      {/* Mobile Sidebar Hamburger Toggle */}
      <div className="absolute top-4 left-4 z-30 md:hidden">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-lg"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Unified Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-0'} md:translate-x-0 transition-transform duration-300 ease-in-out z-20 w-64 bg-slate-900 border-r border-slate-855 flex flex-col justify-between p-6 shrink-0`}>
        <div className="space-y-8">
          <Logo size="small" />

          {/* Sidebar Menu Items */}
          <nav className="space-y-1.5 pt-4">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-3 border ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-blue-500/20 text-white shadow-md'
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom Panel containing user details */}
        <div className="space-y-6 pt-6 border-t border-slate-800/60">
          {/* User Card & Log Out */}
          <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
            <div className="flex flex-col truncate max-w-[140px]">
              <span className="text-xs font-bold text-white truncate">{user?.name}</span>
              <span className="text-[10px] text-slate-500 truncate">Administrator</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 md:ml-0 overflow-y-auto h-screen pl-0 md:pl-64">
        
        {/* Responsive padding header gap on mobile */}
        <div className="h-16 md:hidden"></div>

        <main className="max-w-7xl w-full mx-auto p-6 md:p-8 relative z-10 flex flex-col">
          
          {/* KPI Panel */}
          <section className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-8 perspective-1000">
            <div className="glass-card card-3d rounded-2xl p-5 flex items-center justify-between preserve-3d">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Gross Platform GMV</div>
                <div className="text-2xl font-extrabold text-white mt-1 translate-z-10">₹{stats?.totalRevenue || 0}</div>
              </div>
              <div className="p-3 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-card card-3d rounded-2xl p-5 flex items-center justify-between preserve-3d">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Users Registered</div>
                <div className="text-2xl font-extrabold text-blue-400 mt-1 translate-z-10">{stats?.totalUsers || 0}</div>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-card card-3d rounded-2xl p-5 flex items-center justify-between preserve-3d">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Partner Printshops</div>
                <div className="text-2xl font-extrabold text-purple-400 mt-1 translate-z-10">{stats?.totalShops || 0}</div>
              </div>
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
                <Printer className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-card card-3d rounded-2xl p-5 flex items-center justify-between preserve-3d">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Gross Order Volume</div>
                <div className="text-2xl font-extrabold text-pink-400 mt-1 translate-z-10">{stats?.totalOrders || 0}</div>
              </div>
              <div className="p-3 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
          </section>

          {/* TAB 1: Overview Summary */}
          {activeTab === 'overview' && (
            <div className="flex-1 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-white">System Diagnostics Panel</h1>
                  <p className="text-slate-400 text-xs mt-0.5">Real-time status breakdown across CopyMate database metrics.</p>
                </div>

                <button 
                  onClick={fetchAdminData}
                  disabled={refreshing}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-2 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh metrics
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Order Status Bar Chart with nice logo gradients */}
                <div className="lg:col-span-2 glass-card rounded-2xl p-6 h-[380px]">
                  <h3 className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-2">
                    <ChartBar className="w-4 h-4" /> Order Pipeline Volume
                  </h3>
                  <ResponsiveContainer width="100%" height="80%">
                    <BarChart data={getChartData()}>
                      <defs>
                        <linearGradient id="adminBarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#db2777" stopOpacity={0.85}/>
                          <stop offset="50%" stopColor="#7c3aed" stopOpacity={0.65}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0.4}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickFormatter={(str) => str.toUpperCase()} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#db2777', fontSize: '13px' }}
                      />
                      <Bar dataKey="count" fill="url(#adminBarGrad)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Transactions list */}
                <div className="glass-card rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white border-b border-slate-900 pb-3">Recent Transactions</h3>
                  <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-1">
                    {stats?.recentPayments?.length === 0 ? (
                      <div className="text-center py-8 text-slate-600 text-xs">No recent transactions recorded.</div>
                    ) : (
                      stats?.recentPayments?.map(p => (
                        <div key={p.id} className="p-3 bg-slate-900/40 border border-slate-900 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-white uppercase">{p.id}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{new Date(p.createdAt).toLocaleTimeString()}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-pink-400">₹{p.amount}</div>
                            <div className="text-[9px] text-slate-500 uppercase">{p.paymentMethod}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Users Manager list */}
          {activeTab === 'users' && (
            <div className="flex-1 flex flex-col gap-6">
              <div>
                <h1 className="text-xl font-bold text-white">Registered Users Profile Ledger</h1>
                <p className="text-slate-400 text-xs mt-0.5">Comprehensive audit trail of users enrolled in the system database.</p>
              </div>

              <div className="glass-card rounded-2xl overflow-hidden border border-slate-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-900/30 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <th className="p-4">User ID</th>
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">System Role</th>
                        <th className="p-4">Contact Phone</th>
                        <th className="p-4">Points Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-xs text-slate-400">
                      {usersList.map(u => (
                        <tr key={u.id} className="hover:bg-slate-900/10">
                          <td className="p-4 text-slate-300 font-semibold">{u.id}</td>
                          <td className="p-4 font-extrabold text-white">{u.name}</td>
                          <td className="p-4 font-medium text-slate-400">{u.email}</td>
                          <td className="p-4">
                            <span className={`uppercase font-bold tracking-wider text-[9px] px-2 py-0.5 rounded ${
                              u.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              u.role === 'shop_owner' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              u.role === 'delivery_agent' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' :
                              'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}>{u.role.replace('_', ' ')}</span>
                          </td>
                          <td className="p-4 font-semibold text-slate-300">{u.phone || "N/A"}</td>
                          <td className="p-4 font-black text-pink-400">{u.role === 'customer' ? `${u.points || 0} pts` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Print Shops Ledger */}
          {activeTab === 'shops' && (
            <div className="flex-1 flex flex-col gap-6">
              <div>
                <h1 className="text-xl font-bold text-white">Platform Partner Printshops</h1>
                <p className="text-slate-400 text-xs mt-0.5">Toggle activation status or inspect pricing catalogs for local operators.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 perspective-1000">
                {shopsList.map(s => (
                  <div key={s.id} className="glass-card card-3d rounded-2xl p-6 flex flex-col justify-between hover:border-slate-800 transition preserve-3d">
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <h3 className="font-extrabold text-base text-white">{s.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-amber-400 font-bold bg-amber-500/5 px-2.5 py-0.5 rounded-lg border border-amber-500/15">
                          <Star className="w-3 h-3 fill-current" /> {s.rating}
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">{s.description}</p>
                      
                      <div className="text-xs text-slate-500 flex items-start gap-1 mb-6">
                        <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-0.5" />
                        <span>{s.address}</span>
                      </div>

                      <div className="pt-4 border-t border-slate-900 grid grid-cols-2 gap-4 text-[11px] text-slate-400">
                        <div>
                          <div>B&W Rate</div>
                          <div className="font-bold text-white mt-0.5">₹{s.pricing.bw}/page</div>
                        </div>
                        <div>
                          <div>Color Rate</div>
                          <div className="font-bold text-white mt-0.5">₹{s.pricing.color}/page</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-900 mt-6 pt-4">
                      <span className="text-xs text-slate-500 font-semibold">Active Status</span>
                      <button
                        onClick={() => handleToggleShopStatus(s.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          s.status === 'active' 
                            ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-600 hover:text-white' 
                            : 'bg-red-600/10 border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white'
                        }`}
                      >
                        {s.status === 'active' ? "Active (Online)" : "Inactive (Banned)"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: My Account Details */}
          {activeTab === 'account' && (
            <div className="flex-1 flex flex-col gap-6">
              <div>
                <h1 className="text-2xl font-bold text-white">My Profile</h1>
                <p className="text-slate-400 text-xs mt-1">View your registered details.</p>
              </div>

              <div className="max-w-3xl w-full">
                {/* Profile card details */}
                <div className="glass-card rounded-2xl p-8 space-y-6">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center text-xl font-bold text-white uppercase">
                      {user?.name?.slice(0, 2) || 'CM'}
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-white">{user?.name}</h2>
                      <span className="text-[10px] text-pink-400 font-bold uppercase tracking-wider bg-pink-500/10 px-2.5 py-0.5 rounded border border-pink-500/20">{user?.role?.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-900 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div>
                      <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Email Address</div>
                      <div className="text-white mt-1 font-semibold">{user?.email}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Contact Number</div>
                      <div className="text-white mt-1 font-semibold">{user?.phone || 'Not Specified'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
