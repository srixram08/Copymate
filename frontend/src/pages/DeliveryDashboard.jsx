import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, MapPin, CheckCircle, Navigation, Phone, 
  DollarSign, Package, RefreshCw, LogOut, ArrowRight, Menu, X, User
} from 'lucide-react';
import api from '../utils/api.js';
import Logo from '../components/Logo.jsx';

export default function DeliveryDashboard() {
  const [user, setUser] = useState(null);
  const [availableDeliveries, setAvailableDeliveries] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [activeTab, setActiveTab] = useState('available'); // available, active, logs
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
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setRefreshing(true);
      const resAvailable = await api.get('/delivery/available');
      setAvailableDeliveries(resAvailable.data);

      const resMy = await api.get('/delivery/agent');
      setMyDeliveries(resMy.data);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePickup = async (orderId) => {
    try {
      await api.put(`/delivery/${orderId}/pickup`);
      alert("Delivery accepted! Go to 'Active Shipments' to process.");
      fetchDeliveries();
      setActiveTab('active');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to pick up order.");
    }
  };

  const handleDeliver = async (orderId) => {
    try {
      await api.put(`/delivery/${orderId}/deliver`);
      alert("Delivery confirmed!");
      fetchDeliveries();
      setActiveTab('logs');
    } catch (err) {
      console.error(err);
      alert("Failed to confirm delivery.");
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

  // Stats calculation
  const completedJobs = myDeliveries.filter(o => o.status === 'completed').length;
  const activeJobs = myDeliveries.filter(o => o.status === 'out_for_delivery').length;
  const totalEarnings = completedJobs * 30; // ₹30 per delivery commission

  const menuItems = [
    { id: 'available', label: `Available Jobs (${availableDeliveries.length})`, icon: <Truck className="w-4 h-4" /> },
    { id: 'active', label: `Active Shipments (${activeJobs})`, icon: <Package className="w-4 h-4" /> },
    { id: 'logs', label: 'Earnings Log', icon: <DollarSign className="w-4 h-4" /> },
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
              <span className="text-[10px] text-slate-500 truncate">Delivery Agent</span>
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
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 perspective-1000">
            <div className="glass-card card-3d rounded-2xl p-5 flex items-center justify-between preserve-3d">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Commission</div>
                <div className="text-2xl font-extrabold text-white mt-1 translate-z-10">₹{totalEarnings}</div>
              </div>
              <div className="p-3 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-card card-3d rounded-2xl p-5 flex items-center justify-between preserve-3d">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Shipments</div>
                <div className="text-2xl font-extrabold text-blue-400 mt-1 translate-z-10">{activeJobs}</div>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                <Package className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-card card-3d rounded-2xl p-5 flex items-center justify-between preserve-3d">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Completed Drops</div>
                <div className="text-2xl font-extrabold text-purple-400 mt-1 translate-z-10">{completedJobs}</div>
              </div>
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </section>

          {/* TAB 1: Available Jobs */}
          {activeTab === 'available' && (
            <div className="flex-1 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-white">Available Print Shipments</h1>
                  <p className="text-slate-400 text-xs mt-0.5">Accept order deliveries from local print hubs.</p>
                </div>
                
                <button 
                  onClick={fetchDeliveries}
                  disabled={refreshing}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-2 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh board
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableDeliveries.length === 0 ? (
                  <div className="md:col-span-2 glass-card rounded-2xl p-12 text-center text-slate-500 text-sm">
                    No shipments need picking up right now. Check back shortly.
                  </div>
                ) : (
                  availableDeliveries.map(o => (
                    <div key={o.id} className="glass-card rounded-2xl p-6 flex flex-col justify-between hover:border-slate-800 transition relative overflow-hidden animate-fade-in">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-pink-500/5 rounded-bl-full pointer-events-none" />
                      
                      <div>
                        <div className="flex justify-between items-center gap-3 mb-4">
                          <span className="text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">{o.id}</span>
                          <span className="text-xs font-bold text-pink-400">Commission: ₹30</span>
                        </div>

                        <div className="space-y-4">
                          {/* Shop Info */}
                          <div className="space-y-1">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pickup From</div>
                            <div className="text-sm font-extrabold text-white">{o.shopName}</div>
                            <div className="text-xs text-slate-400 flex items-start gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                              <span>{o.shopAddress}</span>
                            </div>
                          </div>

                          {/* Customer Info */}
                          <div className="space-y-1 pt-3 border-t border-slate-900">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deliver To</div>
                            <div className="text-xs text-slate-400 flex items-start gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{o.deliveryAddress}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handlePickup(o.id)}
                        className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-50 hover:to-pink-500 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/10 active:translate-y-0.5"
                      >
                        Accept Shipment Delivery
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Active Shipments */}
          {activeTab === 'active' && (
            <div className="flex-1 flex flex-col gap-6">
              <div>
                <h1 className="text-xl font-bold text-white">Active Rider Shipments</h1>
                <p className="text-slate-400 text-xs mt-0.5">Collect items from shops and confirm deliveries to clients.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myDeliveries.filter(o => o.status === 'out_for_delivery').length === 0 ? (
                  <div className="md:col-span-2 glass-card rounded-2xl p-12 text-center text-slate-500 text-sm">
                    You don't have any active deliveries. Select one on the "Available Jobs" panel.
                  </div>
                ) : (
                  myDeliveries
                    .filter(o => o.status === 'out_for_delivery')
                    .map(o => (
                      <div key={o.id} className="glass-card border-pink-500/20 bg-pink-500/5 rounded-2xl p-6 flex flex-col justify-between hover:border-pink-500/30 transition">
                        <div>
                          <div className="flex justify-between items-center gap-3 mb-4">
                            <span className="text-xs font-bold text-white bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">{o.id}</span>
                            <div className="flex items-center gap-1 text-xs text-pink-400 font-bold bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-lg">
                              <Navigation className="w-3.5 h-3.5 animate-pulse" /> Out for Delivery
                            </div>
                          </div>

                          <div className="space-y-4">
                            {/* Pick details */}
                            <div className="space-y-1.5">
                              <div className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">1. Collect From Printshop</div>
                              <div className="text-sm font-extrabold text-white">{o.shopName}</div>
                              <div className="text-xs text-slate-400 flex items-start gap-1">
                                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <span>{o.shopAddress}</span>
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5" />
                                <a href={`tel:${o.shopPhone}`} className="hover:underline text-blue-400">{o.shopPhone}</a>
                              </div>
                            </div>

                            {/* Drop details */}
                            <div className="space-y-1.5 pt-4 border-t border-slate-900">
                              <div className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">2. Hand over to Client</div>
                              <div className="text-xs text-slate-300 flex items-start gap-1">
                                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <span>{o.deliveryAddress}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeliver(o.id)}
                          className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-50 hover:to-pink-500 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/10 active:translate-y-0.5"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Confirm Package Delivered
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Earnings Log */}
          {activeTab === 'logs' && (
            <div className="flex-1 flex flex-col gap-6">
              <div>
                <h1 className="text-xl font-bold text-white">Earnings Ledger</h1>
                <p className="text-slate-400 text-xs mt-0.5">Logs of all completed shipments and paid commission balances.</p>
              </div>

              <div className="glass-card rounded-2xl overflow-hidden border border-slate-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-900/30 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <th className="p-4">Drop ID</th>
                        <th className="p-4">Shop</th>
                        <th className="p-4">Delivery Coordinates</th>
                        <th className="p-4">Commission</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-xs text-slate-400">
                      {myDeliveries.filter(o => o.status === 'completed').length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-10 text-center text-slate-600">No completed earnings ledger found.</td>
                        </tr>
                      ) : (
                        myDeliveries
                          .filter(o => o.status === 'completed')
                          .map(o => (
                            <tr key={o.id} className="hover:bg-slate-900/10">
                              <td className="p-4 text-slate-300 font-bold">{o.id}</td>
                              <td className="p-4 font-semibold text-white">{o.shopName}</td>
                              <td className="p-4 truncate max-w-[200px]">{o.deliveryAddress}</td>
                              <td className="p-4 font-bold text-pink-400">₹30.00</td>
                              <td className="p-4 text-pink-400 font-bold">Paid</td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
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
