import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, FileText, CheckCircle, XCircle, 
  Settings, RefreshCw, Star, LogOut, ArrowRight, ToggleLeft, ToggleRight, Menu, X, Printer, TrendingUp
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api.js';
import Logo from '../components/Logo.jsx';

export default function ShopDashboard() {
  const [user, setUser] = useState(null);
  const [shop, setShop] = useState(null);
  const [orders, setOrders] = useState([]);
  const [deliveryAgents, setDeliveryAgents] = useState([]);
  const [activeTab, setActiveTab] = useState('orders'); // orders, analytics, settings
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Settings states
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [priceBw, setPriceBw] = useState(0);
  const [priceColor, setPriceColor] = useState(0);
  const [priceA3, setPriceA3] = useState(0);
  const [priceDelivery, setPriceDelivery] = useState(0);
  const [shopStatus, setShopStatus] = useState('active');

  // Account details edit states
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);

  // Selected order details modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const cachedUser = localStorage.getItem('user');
    if (!cachedUser) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(cachedUser);
    setUser(parsedUser);

    const fetchUserProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(prev => ({ ...prev, ...res.data }));
        localStorage.setItem('user', JSON.stringify({ ...parsedUser, ...res.data }));
      } catch (err) {
        console.error("Error fetching user profile", err);
      }
    };
    fetchUserProfile();
    
    if (parsedUser.shopId) {
      fetchShopDetails(parsedUser.shopId);
      fetchOrders(parsedUser.shopId);
      fetchDeliveryAgents();
    }
  }, []);

  const fetchShopDetails = async (id) => {
    try {
      const res = await api.get(`/shops/${id}`);
      setShop(res.data);
      
      // Seed settings inputs
      setShopName(res.data.name);
      setShopAddress(res.data.address);
      setShopPhone(res.data.phone);
      setShopDescription(res.data.description || '');
      setPriceBw(res.data.pricing.bw);
      setPriceColor(res.data.pricing.color);
      setPriceA3(res.data.pricing.a3 || 5);
      setPriceDelivery(res.data.pricing.delivery || 30);
      setShopStatus(res.data.status);
    } catch (err) {
      console.error("Error fetching shop", err);
    }
  };

  const fetchOrders = async (shopId) => {
    try {
      setRefreshing(true);
      const res = await api.get(`/orders/shop/${shopId}`);
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching shop orders", err);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchDeliveryAgents = async () => {
    try {
      setDeliveryAgents([
        { id: "usr_delivery1", name: "Amit Kumar", phone: "+15550103" }
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus, deliveryAgentId = undefined) => {
    try {
      const payload = { status: newStatus };
      if (deliveryAgentId !== undefined) {
        payload.deliveryAgentId = deliveryAgentId;
      }
      
      const res = await api.put(`/orders/${orderId}/status`, payload);
      
      // Update local orders list
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: res.data.status, deliveryAgentId: res.data.deliveryAgentId || o.deliveryAgentId } : o));
      
      // If modal open, update modal too
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: res.data.status, deliveryAgentId: res.data.deliveryAgentId || selectedOrder.deliveryAgentId });
      }
      
      // If order is completed or updated, fetch again
      if (shop) fetchOrders(shop.id);
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    if (!shop) return;
    setLoading(true);

    try {
      const res = await api.put(`/shops/${shop.id}`, {
        name: shopName,
        address: shopAddress,
        phone: shopPhone,
        description: shopDescription,
        status: shopStatus,
        pricing: {
          bw: parseFloat(priceBw),
          color: parseFloat(priceColor),
          a3: parseFloat(priceA3),
          delivery: parseFloat(priceDelivery)
        }
      });
      setShop(res.data);
      alert("Settings updated successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to update shop settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    setSavingAccount(true);
    try {
      const res = await api.put('/auth/me', {
        name: editName,
        email: editEmail,
        phone: editPhone,
        password: editPassword || undefined
      });
      setUser(prev => ({ ...prev, ...res.data }));
      localStorage.setItem('user', JSON.stringify({ ...user, ...res.data }));
      setIsEditingAccount(false);
      setEditPassword('');
      alert("Account details updated successfully!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to update account details.");
    } finally {
      setSavingAccount(false);
    }
  };

  const startEditingAccount = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditPhone(user?.phone || '');
    setEditPassword('');
    setIsEditingAccount(true);
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
  const totalEarnings = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const printingCount = orders.filter(o => o.status === 'accepted' || o.status === 'printing').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;

  // Chart seed details (group earnings by date)
  const getRevenueChartData = () => {
    const dates = {};
    orders.filter(o => o.status === 'completed').forEach(o => {
      const date = new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      dates[date] = (dates[date] || 0) + o.totalPrice;
    });

    const data = Object.keys(dates).map(key => ({
      date: key,
      revenue: dates[key]
    }));

    if (data.length === 0) {
      return [
        { date: 'Mon', revenue: 0 },
        { date: 'Tue', revenue: 0 },
        { date: 'Wed', revenue: 0 },
        { date: 'Thu', revenue: 0 },
        { date: 'Fri', revenue: 0 }
      ];
    }
    return data;
  };

  const menuItems = [
    { id: 'orders', label: `Order Queue (${pendingCount + printingCount})`, icon: <Printer className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'settings', label: 'Pricing & Profile', icon: <Settings className="w-4 h-4" /> },
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
      <aside className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-0'} md:translate-x-0 transition-transform duration-300 ease-in-out z-20 w-64 bg-slate-900 border-r border-slate-850 flex flex-col justify-between p-6 shrink-0`}>
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
              <span className="text-xs font-bold text-white truncate">{shop?.name || user?.name}</span>
              <span className="text-[10px] text-slate-500 truncate">Shop Owner</span>
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
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Revenue</div>
                <div className="text-2xl font-extrabold text-white mt-1 translate-z-10">₹{totalEarnings}</div>
              </div>
              <div className="p-3 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-card card-3d rounded-2xl p-5 flex items-center justify-between preserve-3d">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pending Approvals</div>
                <div className="text-2xl font-extrabold text-blue-400 mt-1 translate-z-10">{pendingCount}</div>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-card card-3d rounded-2xl p-5 flex items-center justify-between preserve-3d">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Printing Queue</div>
                <div className="text-2xl font-extrabold text-purple-400 mt-1 translate-z-10">{printingCount}</div>
              </div>
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
                <Printer className="w-5 h-5" />
              </div>
            </div>

            <div className="glass-card card-3d rounded-2xl p-5 flex items-center justify-between preserve-3d">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Completed Orders</div>
                <div className="text-2xl font-extrabold text-pink-400 mt-1 translate-z-10">{completedCount}</div>
              </div>
              <div className="p-3 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </section>

          {/* TAB 1: Order Queue Management */}
          {activeTab === 'orders' && (
            <div className="flex-1 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-white">Incoming Order Queue</h1>
                  <p className="text-slate-400 text-xs mt-0.5">Manage printing pipelines and assign local dispatch agents.</p>
                </div>
                
                <button 
                  onClick={() => shop && fetchOrders(shop.id)}
                  disabled={refreshing}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-2 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh list
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {orders.filter(o => o.status !== 'completed' && o.status !== 'rejected').length === 0 ? (
                  <div className="glass-card rounded-2xl p-12 text-center text-slate-500 text-sm">
                    The print pipeline is empty. Nice job!
                  </div>
                ) : (
                  orders
                    .filter(o => o.status !== 'completed' && o.status !== 'rejected')
                    .map(o => (
                      <div key={o.id} className="glass-card rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-slate-800 transition">
                        <div className="space-y-1.5 flex-1 cursor-pointer" onClick={() => setSelectedOrder(o)}>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-white bg-slate-900 px-2 py-1 rounded border border-slate-800">{o.id}</span>
                            <span className="text-sm font-extrabold text-blue-400">{o.documentName}</span>
                            <span className={`text-[9px] uppercase px-2 py-0.5 rounded font-black ${
                              o.status === 'pending' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                              o.status === 'accepted' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                              o.status === 'printing' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' :
                              'bg-gradient-to-r from-blue-600 to-pink-600 text-white'
                            }`}>{o.status}</span>
                          </div>
                          <div className="text-xs text-slate-400">
                            Customer: <span className="font-semibold text-white">{o.customerName} ({o.customerPoints || 0} pts)</span> • Size: <span className="text-slate-300 uppercase font-bold">{o.printSettings.paperSize}</span> • Sides: <span className="text-slate-300 capitalize">{o.printSettings.sideMode} side</span> • Copies: <span className="text-slate-300 font-bold">{o.printSettings.copies}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Created at: {new Date(o.createdAt).toLocaleString()} • Type: <span className="capitalize font-semibold text-slate-400">{o.deliveryType}</span>
                          </div>
                        </div>

                        {/* State Action Buttons */}
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                          {o.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(o.id, 'rejected')}
                                className="px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-bold hover:bg-red-500 hover:text-white transition flex items-center gap-1.5"
                              >
                                <XCircle className="w-4 h-4" /> Reject
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(o.id, 'accepted')}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-50 hover:to-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-blue-600/10"
                              >
                                <CheckCircle className="w-4 h-4" /> Accept Order
                              </button>
                            </>
                          )}

                          {o.status === 'accepted' && (
                            <button
                              onClick={() => handleUpdateStatus(o.id, 'printing')}
                              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                            >
                              <Printer className="w-4 h-4" /> Start Printing
                            </button>
                          )}

                          {o.status === 'printing' && (
                            <button
                              onClick={() => handleUpdateStatus(o.id, 'ready_for_pickup')}
                              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-50 hover:to-pink-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                            >
                              <CheckCircle className="w-4 h-4" /> Finished (Ready)
                            </button>
                          )}

                          {o.status === 'ready_for_pickup' && (
                            o.deliveryType === 'delivery' ? (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">Rider:</span>
                                <select
                                  onChange={(e) => handleUpdateStatus(o.id, 'ready_for_pickup', e.target.value)}
                                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                                  defaultValue=""
                                >
                                  <option value="" disabled>Assign Rider...</option>
                                  {deliveryAgents.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleUpdateStatus(o.id, 'completed')}
                                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-50 hover:to-pink-50 text-white text-xs font-bold transition"
                              >
                                Confirm Customer Pickup
                              </button>
                            )
                          )}

                          {o.status === 'out_for_delivery' && (
                            <span className="text-xs text-slate-500 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
                              Rider {o.deliveryAgentName} En Route
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Analytics Dashboard */}
          {activeTab === 'analytics' && (
            <div className="flex-1 flex flex-col gap-6">
              <div>
                <h1 className="text-xl font-bold text-white">Revenue Performance Analytics</h1>
                <p className="text-slate-400 text-xs mt-0.5">Visualize your business earnings over time.</p>
              </div>

              {/* Earnings Chart with Logo Gradients */}
              <div className="glass-card rounded-2xl p-6 h-[350px]">
                <h3 className="text-sm font-bold text-slate-400 mb-4">Earnings History (₹)</h3>
                <ResponsiveContainer width="100%" height="85%">
                  <AreaChart data={getRevenueChartData()}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#db2777" stopOpacity={0.45}/>
                        <stop offset="50%" stopColor="#7c3aed" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                    <Tooltip 
                      contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#db2777', fontSize: '13px' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#db2777" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Historic log */}
              <div className="glass-card rounded-2xl overflow-hidden mt-4 border border-slate-900">
                <h3 className="text-sm font-bold text-white p-5 border-b border-slate-900 bg-slate-900/20">All Completed Orders</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 bg-slate-900/30 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <th className="p-4">ID</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Document</th>
                        <th className="p-4">Revenue</th>
                        <th className="p-4">Mode</th>
                        <th className="p-4">Completed Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-xs text-slate-400">
                      {orders.filter(o => o.status === 'completed').length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-10 text-center text-slate-600">No completed orders found.</td>
                        </tr>
                      ) : (
                        orders
                          .filter(o => o.status === 'completed')
                          .map(o => (
                            <tr key={o.id} className="hover:bg-slate-900/10">
                              <td className="p-4 text-slate-300 font-bold">{o.id}</td>
                              <td className="p-4 font-semibold text-white">{o.customerName}</td>
                              <td className="p-4 truncate max-w-[200px]">{o.documentName}</td>
                              <td className="p-4 font-bold text-pink-400">₹{o.totalPrice}</td>
                              <td className="p-4 capitalize">{o.deliveryType}</td>
                              <td className="p-4 text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Pricing & Profile Settings */}
          {activeTab === 'settings' && (
            <div className="flex-1 flex flex-col gap-6">
              <div>
                <h1 className="text-xl font-bold text-white">Pricing & Shop Profile Config</h1>
                <p className="text-slate-400 text-xs mt-0.5">Customize your print fees per-page and update address coordinates.</p>
              </div>

              <div className="space-y-8">
                <form onSubmit={handleUpdateSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  
                  {/* Profile card fields */}
                  <div className="lg:col-span-2 glass-card rounded-2xl p-6 space-y-5">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-3">Shop Profile Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2">Shop Name</label>
                        <input
                          type="text"
                          required
                          value={shopName}
                          onChange={(e) => setShopName(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2">Shop Phone</label>
                        <input
                          type="text"
                          required
                          value={shopPhone}
                          onChange={(e) => setShopPhone(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500/30"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-2">Shop Address</label>
                      <input
                        type="text"
                        required
                        value={shopAddress}
                        onChange={(e) => setShopAddress(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-2">Shop Description</label>
                      <textarea
                        value={shopDescription}
                        onChange={(e) => setShopDescription(e.target.value)}
                        rows="3"
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500/30"
                      />
                    </div>
                  </div>

                  {/* Pricing settings panel */}
                  <div className="glass-card rounded-2xl p-6 space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-3">Pricing Settings</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">B&W Print Rate (₹/page)</label>
                        <input
                          type="number"
                          step="0.5"
                          required
                          value={priceBw}
                          onChange={(e) => setPriceBw(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Color Print Rate (₹/page)</label>
                        <input
                          type="number"
                          step="0.5"
                          required
                          value={priceColor}
                          onChange={(e) => setPriceColor(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">A3 Paper Premium (₹/page)</label>
                        <input
                          type="number"
                          step="0.5"
                          required
                          value={priceA3}
                          onChange={(e) => setPriceA3(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Delivery Fee (₹)</label>
                        <input
                          type="number"
                          step="1"
                          required
                          value={priceDelivery}
                          onChange={(e) => setPriceDelivery(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-bold"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-900">
                        <span className="text-xs text-slate-400 font-semibold">Shop Open Status:</span>
                        <button
                          type="button"
                          onClick={() => setShopStatus(shopStatus === 'active' ? 'inactive' : 'active')}
                          className="text-slate-400 hover:text-white transition"
                        >
                          {shopStatus === 'active' ? (
                            <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs"><ToggleRight className="w-9 h-9" /> OPEN</div>
                          ) : (
                            <div className="flex items-center gap-1 text-red-400 font-bold text-xs"><ToggleLeft className="w-9 h-9" /> CLOSED</div>
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 mt-6 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-50 hover:to-pink-500 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:translate-y-0.5"
                    >
                      {loading ? "Saving Settings..." : "Save Configuration"}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>

                {/* Personal Owner Account details editor */}
                {isEditingAccount ? (
                  <form onSubmit={handleUpdateAccount} className="max-w-3xl glass-card rounded-2xl p-8 space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-3">Edit Owner Account Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2">Owner Name</label>
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2">Email Address</label>
                        <input
                          type="email"
                          required
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500/30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2">Contact Phone</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2">Password (Leave blank to keep unchanged)</label>
                        <input
                          type="password"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500/30"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-900">
                      <button
                        type="button"
                        onClick={() => setIsEditingAccount(false)}
                        className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition"
                      >
                        Exit Edit
                      </button>
                      <button
                        type="submit"
                        disabled={savingAccount}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-500 hover:to-pink-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
                      >
                        {savingAccount ? "Saving..." : "Save Account"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="max-w-3xl glass-card rounded-2xl p-8 space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-3">Owner Account Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                      <div>
                        <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Owner Name</div>
                        <div className="text-white mt-1 font-semibold">{user?.name}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Email Address</div>
                        <div className="text-white mt-1 font-semibold">{user?.email}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Phone Contact</div>
                        <div className="text-white mt-1 font-semibold">{user?.phone || 'Not Specified'}</div>
                      </div>
                    </div>
                    <div className="pt-6 border-t border-slate-900 flex justify-end">
                      <button
                        onClick={startEditingAccount}
                        className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition"
                      >
                        Edit Account Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Selected Order Detail Drawer / Modal overlay */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full rounded-2xl p-6 relative flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              ✕
            </button>

            {/* Left side detail */}
            <div className="flex-1 space-y-4">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Order Review</span>
                <h3 className="text-lg font-bold text-white truncate">{selectedOrder.documentName}</h3>
                <div className="text-[10px] text-slate-500 mt-0.5">Order Code: {selectedOrder.id}</div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-900 py-1.5">
                  <span className="text-slate-400">Customer Name</span>
                  <span className="text-white font-semibold">{selectedOrder.customerName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 py-1.5">
                  <span className="text-slate-400">Color Profile</span>
                  <span className="text-white font-semibold capitalize">{selectedOrder.printSettings.colorMode}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 py-1.5">
                  <span className="text-slate-400">Paper Layout</span>
                  <span className="text-white font-semibold uppercase">{selectedOrder.printSettings.paperSize} ({selectedOrder.printSettings.sideMode} side)</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 py-1.5">
                  <span className="text-slate-400">Total Copies</span>
                  <span className="text-white font-semibold">{selectedOrder.printSettings.copies}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 py-1.5">
                  <span className="text-slate-400">Fulfillment Type</span>
                  <span className="text-white font-semibold capitalize">{selectedOrder.deliveryType}</span>
                </div>
                {selectedOrder.deliveryType === 'delivery' && (
                  <div className="border-b border-slate-900 py-1.5 text-left">
                    <span className="text-slate-400 block mb-1">Destination Address</span>
                    <span className="text-white font-semibold">{selectedOrder.deliveryAddress}</span>
                  </div>
                )}
                <div className="flex justify-between py-1.5 text-sm font-bold border-t border-slate-900 mt-2">
                  <span className="text-slate-400">Transaction Net</span>
                  <span className="text-pink-400 font-extrabold">₹{selectedOrder.totalPrice}</span>
                </div>
              </div>
            </div>

            {/* Right side mock document view */}
            <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-slate-900 pt-6 md:pt-0 md:pl-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Mock Print Preview</span>
                <div className="aspect-[3/4] w-full bg-slate-900 rounded-xl border border-slate-800 p-4 relative overflow-hidden flex flex-col justify-between">
                  {/* Margin guide overlay */}
                  <div className="absolute inset-2 border border-dashed border-pink-500/10 rounded pointer-events-none" />
                  
                  <div className="flex justify-between items-start">
                    <div className="text-[8px] font-bold text-slate-600 bg-slate-950 px-1 py-0.5 rounded uppercase">{selectedOrder.printSettings.paperSize}</div>
                    <div className="text-[8px] font-bold text-slate-600 bg-slate-950 px-1 py-0.5 rounded capitalize">{selectedOrder.printSettings.colorMode}</div>
                  </div>

                  <div className="text-center py-6">
                    <FileText className="w-12 h-12 text-slate-700 mx-auto" />
                    <div className="text-[9px] text-slate-500 mt-2 truncate font-semibold px-2">{selectedOrder.documentName}</div>
                    <div className="text-[8px] text-slate-600 mt-1">Pages: {selectedOrder.pageCount}</div>
                  </div>

                  <div className="text-[7px] text-slate-600 text-center font-bold">
                    CopyMate Print Verification
                  </div>
                </div>
              </div>

              {/* Modal footer controls */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-900">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
