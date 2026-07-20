import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, Upload, FileText, CreditCard, 
  ShoppingBag, CheckCircle, RefreshCw, Star, Compass, Truck, Clock, LogOut, Menu, X, Users, Shield, Printer, User
} from 'lucide-react';
import api from '../utils/api.js';
import Logo from '../components/Logo.jsx';

export default function CustomerDashboard() {
  const [user, setUser] = useState(null);
  const [shops, setShops] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShop, setSelectedShop] = useState(null);
  
  // Document uploading states
  const [file, setFile] = useState(null);
  const [uploadedDoc, setUploadedDoc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Print configuration states
  const [colorMode, setColorMode] = useState('bw'); // bw, color
  const [sideMode, setSideMode] = useState('single'); // single, double
  const [paperSize, setPaperSize] = useState('A4'); // A4, A3
  const [copies, setCopies] = useState(1);
  const [pageRange, setPageRange] = useState('');

  // Checkout states
  const [deliveryType, setDeliveryType] = useState('pickup'); // pickup, delivery
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('online'); // online, cod
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [redeemPointsEnabled, setRedeemPointsEnabled] = useState(false);

  // Profile Edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Active tracking and history states
  const [activeTab, setActiveTab] = useState('shops'); // shops, config, checkout, track, history
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Review popup states
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Responsive sidebar toggles
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const cachedUser = localStorage.getItem('user');
    if (!cachedUser) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(cachedUser));

    const fetchUserProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      } catch (err) {
        console.error("Error fetching user profile", err);
      }
    };

    fetchUserProfile();
    fetchShops();
    fetchOrders();
  }, []);

  const fetchShops = async () => {
    try {
      const res = await api.get('/shops');
      setShops(res.data);
    } catch (err) {
      console.error("Error fetching shops", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/customer');
      setOrders(res.data);
      
      // If there's an active order, auto-track it
      const active = res.data.find(o => ['pending', 'accepted', 'printing', 'ready_for_pickup', 'out_for_delivery'].includes(o.status));
      if (active && !selectedOrder) {
        setSelectedOrder(active);
      }
    } catch (err) {
      console.error("Error fetching orders", err);
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

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setUploadError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('document', selectedFile);

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedDoc(res.data);
    } catch (err) {
      console.error(err);
      setUploadError(err.response?.data?.error || "Error uploading document.");
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.put('/auth/me', {
        name: editName,
        email: editEmail,
        phone: editPhone,
        password: editPassword || undefined
      });
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setIsEditingProfile(false);
      setEditPassword('');
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to update profile details.");
    } finally {
      setSavingProfile(false);
    }
  };

  const startEditing = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditPhone(user?.phone || '');
    setEditPassword('');
    setIsEditingProfile(true);
  };

  // Calculate pricing simulation dynamically
  const calculateEstimate = () => {
    if (!selectedShop || !uploadedDoc) return 0;
    
    // Pages calculation (estimate based on pageRange or file pages)
    let pages = uploadedDoc.pageCount;
    if (pageRange.trim() !== '') {
      if (pageRange.includes('-')) {
        const parts = pageRange.split('-');
        const start = parseInt(parts[0]);
        const end = parseInt(parts[1]);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          pages = (end - start) + 1;
        }
      } else if (pageRange.includes(',')) {
        pages = pageRange.split(',').length;
      } else {
        const single = parseInt(pageRange);
        if (!isNaN(single)) pages = 1;
      }
    }
    pages = Math.min(pages, uploadedDoc.pageCount);

    const rate = colorMode === 'color' ? selectedShop.pricing.color : selectedShop.pricing.bw;
    const a3Charge = paperSize === 'A3' ? (selectedShop.pricing.a3 || 5) : 0;
    
    let docCost = (rate + a3Charge) * pages * copies;
    let deliveryCost = deliveryType === 'delivery' ? (selectedShop.pricing.delivery || 30) : 0;
    
    return {
      pages,
      subtotal: docCost,
      deliveryFee: deliveryCost,
      total: docCost + deliveryCost
    };
  };

  const costObj = calculateEstimate();

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!selectedShop || !uploadedDoc) return;
    setSubmittingOrder(true);

    try {
      const maxPointsRedeemable = Math.min(user?.points || 0, costObj.total);
      const pointsToRedeem = redeemPointsEnabled ? maxPointsRedeemable : 0;

      // 1. Create order
      const orderRes = await api.post('/orders', {
        shopId: selectedShop.id,
        documentId: uploadedDoc.id,
        printSettings: {
          colorMode,
          sideMode,
          paperSize,
          copies,
          pageRange
        },
        deliveryType,
        deliveryAddress,
        redeemPoints: pointsToRedeem
      });

      const order = orderRes.data;

      // 2. Perform Mock Payment if online
      if (paymentMethod === 'online') {
        await api.post(`/orders/${order.id}/pay`, { paymentMethod: 'online' });
      }

      // 3. Clear setup state and redirect to tracker
      setUploadedDoc(null);
      setFile(null);
      setPageRange('');
      setCopies(1);
      setRedeemPointsEnabled(false);
      
      // Fetch user profile again to update their points balance
      const profileRes = await api.get('/auth/me');
      setUser(profileRes.data);
      localStorage.setItem('user', JSON.stringify(profileRes.data));
      
      // Fetch orders to update lists
      await fetchOrders();
      
      const updatedOrdersRes = await api.get('/orders/customer');
      const newlyCreatedOrder = updatedOrdersRes.data.find(o => o.id === order.id);
      setSelectedOrder(newlyCreatedOrder || order);
      
      setActiveTab('track');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Order failed to place.");
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewOrder) return;

    try {
      await api.post(`/orders/${reviewOrder.id}/review`, {
        rating: reviewRating,
        comment: reviewComment
      });
      setReviewOrder(null);
      setReviewComment('');
      setReviewRating(5);
      fetchOrders();
      alert("Thank you for your feedback!");
    } catch (err) {
      console.error(err);
      alert("Failed to submit review.");
    }
  };

  const filteredShops = shops.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusStepIndex = (status) => {
    const steps = ['pending', 'accepted', 'printing', 'ready_for_pickup', 'out_for_delivery', 'completed'];
    return steps.indexOf(status);
  };

  const menuItems = [
    { id: 'shops', label: 'Order Prints', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'track', label: 'Track Orders', icon: <Compass className="w-4 h-4" /> },
    { id: 'history', label: 'Order History', icon: <Clock className="w-4 h-4" /> },
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
                  if (item.id === 'track' || item.id === 'history') fetchOrders();
                  setSidebarOpen(false);
                }}
                className={`w-full px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-3 border ${
                  activeTab === item.id || (item.id === 'shops' && (activeTab === 'config' || activeTab === 'checkout'))
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
              <span className="text-[10px] text-slate-500 truncate">Customer</span>
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
          
          {/* TAB 1: Shop Selection */}
          {activeTab === 'shops' && (
            <div className="flex-1 flex flex-col gap-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-white">Select a Nearby Print Shop</h1>
                  <p className="text-slate-400 text-xs mt-1">Choose a local partner to upload and configure your documents.</p>
                </div>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search shops by name or address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 perspective-1000">
                {filteredShops.map((shop) => (
                  <div key={shop.id} className="glass-card card-3d rounded-2xl p-6 flex flex-col justify-between hover:border-pink-500/20 transition group relative overflow-hidden preserve-3d">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-bl-full group-hover:bg-pink-500/10 transition-all pointer-events-none" />
                    
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <h3 className="font-bold text-lg text-white group-hover:text-pink-400 transition-colors">{shop.name}</h3>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {shop.rating}
                        </div>
                      </div>
                      
                      <p className="text-slate-400 text-xs leading-relaxed mb-4">{shop.description}</p>
                      
                      <div className="flex items-start gap-2 text-slate-500 text-xs mb-6">
                        <MapPin className="w-4 h-4 shrink-0 text-slate-600" />
                        <span>{shop.address}</span>
                      </div>

                      <div className="pt-4 border-t border-slate-900 grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="text-slate-500">B&W Printing</div>
                          <div className="text-white font-bold mt-0.5">₹{shop.pricing.bw}/page</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Color Printing</div>
                          <div className="text-white font-bold mt-0.5">₹{shop.pricing.color}/page</div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedShop(shop);
                        setActiveTab('config');
                      }}
                      className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:to-pink-500 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/10 active:translate-y-0.5"
                    >
                      Select Print Shop
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Print Settings Configuration */}
          {activeTab === 'config' && selectedShop && (
            <div className="flex-1 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => { setSelectedShop(null); setActiveTab('shops'); }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition"
                >
                  ← Back
                </button>
                <div>
                  <h1 className="text-xl font-bold text-white">Configure Print Job</h1>
                  <p className="text-slate-400 text-xs">Shop: {selectedShop.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Document Upload Area */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass-card rounded-2xl p-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">1. Upload Document</h3>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.docx,.doc,.ppt,.pptx,.png,.jpg,.jpeg"
                    />

                    {!uploadedDoc ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-800 hover:border-pink-500/50 hover:bg-slate-900/30 rounded-2xl py-12 px-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-4"
                      >
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-full text-pink-400">
                          {uploading ? <RefreshCw className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{uploading ? "Uploading Document..." : "Click to Upload File"}</div>
                          <div className="text-xs text-slate-500 mt-1">PDF, Word, PPT or Image up to 25MB</div>
                        </div>
                        {uploadError && <div className="text-xs text-red-400 mt-2">{uploadError}</div>}
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl bg-pink-500/5 border border-pink-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gradient-to-br from-blue-600 to-pink-600 rounded-xl">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white truncate max-w-xs">{uploadedDoc.filename}</div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              Pages: <span className="text-pink-400 font-bold">{uploadedDoc.pageCount}</span> • File Size: {(uploadedDoc.size / (1024 * 1024)).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => setUploadedDoc(null)}
                          className="text-xs text-slate-500 hover:text-red-400 transition"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Print Preferences */}
                  <div className="glass-card rounded-2xl p-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">2. Select Preferences</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Color Mode */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2">Color Mode</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setColorMode('bw')}
                            className={`py-3 rounded-xl border text-sm font-semibold transition ${colorMode === 'bw' ? 'border-pink-500 bg-pink-500/10 text-white' : 'border-slate-800 text-slate-400 hover:bg-slate-900'}`}
                          >
                            Black & White
                          </button>
                          <button
                            onClick={() => setColorMode('color')}
                            className={`py-3 rounded-xl border text-sm font-semibold transition ${colorMode === 'color' ? 'border-pink-500 bg-pink-500/10 text-white' : 'border-slate-800 text-slate-400 hover:bg-slate-900'}`}
                          >
                            Color Print
                          </button>
                        </div>
                      </div>

                      {/* Side Mode */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2">Printing Sides</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setSideMode('single')}
                            className={`py-3 rounded-xl border text-sm font-semibold transition ${sideMode === 'single' ? 'border-pink-500 bg-pink-500/10 text-white' : 'border-slate-800 text-slate-400 hover:bg-slate-900'}`}
                          >
                            Single-Sided
                          </button>
                          <button
                            onClick={() => setSideMode('double')}
                            className={`py-3 rounded-xl border text-sm font-semibold transition ${sideMode === 'double' ? 'border-pink-500 bg-pink-500/10 text-white' : 'border-slate-800 text-slate-400 hover:bg-slate-900'}`}
                          >
                            Double-Sided
                          </button>
                        </div>
                      </div>

                      {/* Paper Size */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2">Paper Size</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setPaperSize('A4')}
                            className={`py-3 rounded-xl border text-sm font-semibold transition ${paperSize === 'A4' ? 'border-pink-500 bg-pink-500/10 text-white' : 'border-slate-800 text-slate-400 hover:bg-slate-900'}`}
                          >
                            Standard A4
                          </button>
                          <button
                            onClick={() => setPaperSize('A3')}
                            className={`py-3 rounded-xl border text-sm font-semibold transition ${paperSize === 'A3' ? 'border-pink-500 bg-pink-500/10 text-white' : 'border-slate-800 text-slate-400 hover:bg-slate-900'}`}
                          >
                            Larger A3 (+₹{selectedShop.pricing.a3 || 5})
                          </button>
                        </div>
                      </div>

                      {/* Copies & Page Range */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-2">Copies</label>
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={copies}
                            onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500/30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 mb-2">Page Range</label>
                          <input
                            type="text"
                            placeholder="e.g. 1-5 or 2"
                            value={pageRange}
                            onChange={(e) => setPageRange(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500/30 placeholder-slate-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estimate Summary Panel */}
                <div className="glass-card rounded-2xl p-6 space-y-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Summary</h3>
                  
                  {uploadedDoc ? (
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Print rate ({colorMode === 'color' ? 'Color' : 'B&W'})</span>
                        <span className="text-white font-semibold">₹{colorMode === 'color' ? selectedShop.pricing.color : selectedShop.pricing.bw}/page</span>
                      </div>

                      {paperSize === 'A3' && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">A3 size supplement</span>
                          <span className="text-white font-semibold">₹{selectedShop.pricing.a3 || 5}/page</span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Pages computed</span>
                        <span className="text-white font-semibold">{costObj.pages} pages</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Copies requested</span>
                        <span className="text-white font-semibold">{copies}</span>
                      </div>

                      <div className="pt-4 border-t border-slate-900 flex justify-between text-sm">
                        <span className="text-slate-400">Printing Subtotal</span>
                        <span className="text-white font-bold">₹{costObj.subtotal}</span>
                      </div>

                      <button
                        onClick={() => setActiveTab('checkout')}
                        className="w-full py-4 mt-6 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-50 hover:to-pink-500 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/20 active:translate-y-0.5"
                      >
                        Proceed to Checkout
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      Please upload a document to calculate cost.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Checkout and Simulated Payment */}
          {activeTab === 'checkout' && selectedShop && (
            <div className="flex-1 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveTab('config')}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition"
                >
                  ← Back
                </button>
                <div>
                  <h1 className="text-xl font-bold text-white">Checkout Details</h1>
                  <p className="text-slate-400 text-xs">Confirm shipping and payment mode</p>
                </div>
              </div>

              <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Fulfillment */}
                  <div className="glass-card rounded-2xl p-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">1. Delivery Mode</h3>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <button
                        type="button"
                        onClick={() => setDeliveryType('pickup')}
                        className={`py-3.5 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center gap-1.5 ${deliveryType === 'pickup' ? 'border-pink-500 bg-pink-500/10 text-white' : 'border-slate-800 text-slate-400 hover:bg-slate-900'}`}
                      >
                        <Clock className="w-4 h-4" />
                        Self Pickup (Free)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryType('delivery')}
                        className={`py-3.5 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center gap-1.5 ${deliveryType === 'delivery' ? 'border-pink-500 bg-pink-500/10 text-white' : 'border-slate-800 text-slate-400 hover:bg-slate-900'}`}
                      >
                        <Truck className="w-4 h-4" />
                        Home Delivery (+₹{selectedShop.pricing.delivery || 30})
                      </button>
                    </div>

                    {deliveryType === 'delivery' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-400">Delivery Address</label>
                        <textarea
                          required
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Provide your building, street, and contact details..."
                          rows="3"
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-pink-500/30"
                        />
                      </div>
                    )}
                  </div>

                  {/* Payment Options */}
                  <div className="glass-card rounded-2xl p-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">2. Payment Method</h3>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('online')}
                        className={`py-3 rounded-xl border text-sm font-semibold transition ${paymentMethod === 'online' ? 'border-pink-500 bg-pink-500/10 text-white' : 'border-slate-800 text-slate-400 hover:bg-slate-900'}`}
                      >
                        Online Payment
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cod')}
                        className={`py-3 rounded-xl border text-sm font-semibold transition ${paymentMethod === 'cod' ? 'border-pink-500 bg-pink-500/10 text-white' : 'border-slate-800 text-slate-400 hover:bg-slate-900'}`}
                      >
                        Cash on Delivery
                      </button>
                    </div>

                    {paymentMethod === 'online' && (
                      <div className="space-y-4 pt-4 border-t border-slate-900">
                        <div className="p-4 rounded-xl bg-pink-500/5 border border-pink-500/20 flex items-center gap-3 text-xs text-pink-400 mb-2">
                          <CreditCard className="w-5 h-5 animate-pulse" />
                          Simulated Credit/Debit Card Checkout Gateway
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-505 mb-1">Cardholder Name</label>
                            <input
                              type="text"
                              required={paymentMethod === 'online'}
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                              placeholder="Sriram Swaminathan"
                              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500/30"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-505 mb-1">Card Number</label>
                            <input
                              type="text"
                              required={paymentMethod === 'online'}
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                              maxLength="19"
                              placeholder="4000 1234 5678 9010"
                              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500/30"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-505 mb-1">Expiry Date</label>
                            <input
                              type="text"
                              required={paymentMethod === 'online'}
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              placeholder="MM/YY"
                              maxLength="5"
                              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500/30"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-505 mb-1">CVV Code</label>
                            <input
                              type="password"
                              required={paymentMethod === 'online'}
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                              placeholder="•••"
                              maxLength="3"
                              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-pink-500/30"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Calculation Column */}
                <div className="glass-card rounded-2xl p-6 space-y-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Bill Details</h3>
                  
                  {/* Points Redemption Option */}
                  {user?.points > 0 && (
                    <div className="p-4 bg-pink-500/5 border border-pink-500/20 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-pink-400 fill-current" /> Redeem Points
                        </span>
                        <input
                          type="checkbox"
                          checked={redeemPointsEnabled}
                          onChange={(e) => setRedeemPointsEnabled(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-800 text-pink-600 focus:ring-pink-500 bg-slate-900"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        You have <span className="font-bold text-pink-400">{user.points} points</span>. Redeem them for up to <span className="font-bold text-pink-400">₹{Math.min(user.points, costObj.total)}</span> off your order.
                      </p>
                    </div>
                  )}

                  <div className="space-y-3.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Items Subtotal</span>
                      <span className="text-white font-semibold">₹{costObj.subtotal}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Delivery Charge</span>
                      <span className="text-white font-semibold">₹{costObj.deliveryFee}</span>
                    </div>

                    {redeemPointsEnabled && (
                      <div className="flex justify-between text-pink-400 font-bold">
                        <span>Points Discount Offer</span>
                        <span>-₹{Math.min(user?.points || 0, costObj.total)}</span>
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-900 flex justify-between text-base">
                      <span className="text-white font-bold">Total Amount</span>
                      <span className="text-pink-400 font-extrabold">₹{Math.max(0, costObj.total - (redeemPointsEnabled ? Math.min(user?.points || 0, costObj.total) : 0))}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingOrder}
                    className="w-full py-4 mt-6 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-50 hover:to-pink-500 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/20 disabled:opacity-50 active:translate-y-0.5"
                  >
                    {submittingOrder ? "Confirming Order..." : `Pay ₹${Math.max(0, costObj.total - (redeemPointsEnabled ? Math.min(user?.points || 0, costObj.total) : 0))} & Place Order`}
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: Active Order Tracking */}
          {activeTab === 'track' && (
            <div className="flex-1 flex flex-col gap-6">
              <div>
                <h1 className="text-2xl font-bold text-white">Live Order Tracking</h1>
                <p className="text-slate-400 text-sm mt-1">Get real-time updates as your shop print status changes.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Tracker List Side Panel */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Orders</h3>
                  
                  {orders.filter(o => ['pending', 'accepted', 'printing', 'ready_for_pickup', 'out_for_delivery'].includes(o.status)).length === 0 ? (
                    <div className="glass-card rounded-2xl p-6 text-center text-xs text-slate-500">
                      No active orders found.
                    </div>
                  ) : (
                    orders
                      .filter(o => ['pending', 'accepted', 'printing', 'ready_for_pickup', 'out_for_delivery'].includes(o.status))
                      .map(o => (
                        <div 
                          key={o.id}
                          onClick={() => setSelectedOrder(o)}
                          className={`p-4 rounded-xl border text-left cursor-pointer transition ${selectedOrder?.id === o.id ? 'border-pink-500 bg-pink-500/5' : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900'}`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1.5">
                            <span className="text-xs font-bold text-white truncate max-w-[150px]">{o.documentName}</span>
                            <span className="text-[9px] uppercase px-2 py-0.5 rounded font-black bg-gradient-to-r from-blue-600 to-pink-600 text-white">{o.status}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">Order ID: {o.id}</div>
                          <div className="text-xs font-semibold text-pink-400 mt-2">Total: ₹{o.totalPrice}</div>
                        </div>
                      ))
                  )}
                  
                  <button 
                    onClick={fetchOrders}
                    className="w-full py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh Status
                  </button>
                </div>

                {/* Status Visual Tracker Card */}
                {selectedOrder ? (
                  <div className="lg:col-span-2 glass-card rounded-2xl p-6 md:p-8 space-y-8">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-slate-900">
                      <div>
                        <div className="text-xs text-slate-500">Tracking Code: {selectedOrder.id}</div>
                        <h2 className="text-lg font-extrabold text-white mt-1 truncate max-w-sm">{selectedOrder.documentName}</h2>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 sm:text-right">Fulfillment</div>
                        <div className="text-sm font-bold text-white mt-0.5 capitalize">{selectedOrder.deliveryType} • {selectedOrder.shopName}</div>
                      </div>
                    </div>

                    {/* Horizontal Stepper Animation */}
                    <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 md:gap-4 pt-4">
                      
                      {/* Stepper connector lines */}
                      <div className="hidden md:block absolute left-[5%] right-[5%] top-[18px] h-0.5 bg-slate-800 z-0" />
                      
                      {/* Step 1: Placed */}
                      <div className="flex flex-col items-center text-center relative z-10">
                        <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                          getStatusStepIndex(selectedOrder.status) >= 0 ? 'bg-pink-600 border-pink-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}>
                          1
                        </div>
                        <div className="text-xs font-bold text-white mt-2">Order Placed</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Awaiting shop accept</div>
                      </div>

                      {/* Step 2: Printing */}
                      <div className="flex flex-col items-center text-center relative z-10">
                        <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                          getStatusStepIndex(selectedOrder.status) >= 2 ? 'bg-pink-600 border-pink-500 text-white' : 
                          selectedOrder.status === 'accepted' ? 'status-step-active' : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}>
                          2
                        </div>
                        <div className="text-xs font-bold text-white mt-2">Printing</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Files in process</div>
                      </div>

                      {/* Step 3: Ready */}
                      <div className="flex flex-col items-center text-center relative z-10">
                        <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                          getStatusStepIndex(selectedOrder.status) >= 3 ? 'bg-pink-600 border-pink-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}>
                          3
                        </div>
                        <div className="text-xs font-bold text-white mt-2">Ready</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Packaged for pickup</div>
                      </div>

                      {/* Step 4: Dispatch/Completion */}
                      <div className="flex flex-col items-center text-center relative z-10">
                        <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                          selectedOrder.status === 'completed' ? 'bg-pink-600 border-pink-500 text-white' : 
                          selectedOrder.status === 'out_for_delivery' ? 'status-step-active' : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}>
                          4
                        </div>
                        <div className="text-xs font-bold text-white mt-2">
                          {selectedOrder.deliveryType === 'delivery' ? 'Out for Delivery' : 'Completed'}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {selectedOrder.deliveryType === 'delivery' ? 'Rider heading over' : 'Picked up by user'}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5 text-sm space-y-3">
                      <div className="font-bold text-white">Summary details</div>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="text-slate-500">Color format</div>
                          <div className="text-white font-semibold mt-0.5 capitalize">{selectedOrder.printSettings.colorMode}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Paper details</div>
                          <div className="text-white font-semibold mt-0.5 uppercase">{selectedOrder.printSettings.paperSize} ({selectedOrder.printSettings.sideMode} side)</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Copies</div>
                          <div className="text-white font-semibold mt-0.5">{selectedOrder.printSettings.copies}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Billing Total</div>
                          <div className="text-pink-400 font-bold mt-0.5">₹{selectedOrder.totalPrice}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="lg:col-span-2 glass-card rounded-2xl p-12 text-center text-slate-500 text-sm">
                    Select an active order on the left panel to begin live tracking.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Order History and Reviews */}
          {activeTab === 'history' && (
            <div className="flex-1 flex flex-col gap-6">
              <div>
                <h1 className="text-2xl font-bold text-white">Order History</h1>
                <p className="text-slate-400 text-sm mt-1">Review your completed purchases and send feedback to shops.</p>
              </div>

              <div className="glass-card rounded-2xl overflow-hidden border border-slate-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="p-5">Order ID</th>
                        <th className="p-5">Document Name</th>
                        <th className="p-5">Shop Name</th>
                        <th className="p-5">Settings</th>
                        <th className="p-5">Total Price</th>
                        <th className="p-5">Date</th>
                        <th className="p-5">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-xs">
                      {orders.filter(o => o.status === 'completed' || o.status === 'rejected').length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-10 text-center text-slate-500">
                            No history found. Complete an order to write reviews.
                          </td>
                        </tr>
                      ) : (
                        orders
                          .filter(o => o.status === 'completed' || o.status === 'rejected')
                          .map(o => (
                            <tr key={o.id} className="hover:bg-slate-900/30 transition-colors">
                              <td className="p-5 font-semibold text-slate-400">{o.id}</td>
                              <td className="p-5 text-white font-semibold max-w-[150px] truncate">{o.documentName}</td>
                              <td className="p-5 text-slate-300">{o.shopName}</td>
                              <td className="p-5 text-slate-400 capitalize">{o.printSettings.colorMode} • {o.printSettings.paperSize}</td>
                              <td className="p-5 font-bold text-pink-400">₹{o.totalPrice}</td>
                              <td className="p-5 text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                              <td className="p-5">
                                {o.status === 'completed' ? (
                                  <button
                                    onClick={() => setReviewOrder(o)}
                                    className="px-3 py-1.5 rounded-lg bg-pink-600/10 hover:bg-pink-600 text-pink-400 hover:text-white border border-pink-500/20 transition-all font-semibold"
                                  >
                                    Review Shop
                                  </button>
                                ) : (
                                  <span className="text-red-400 font-semibold uppercase tracking-wider text-[10px]">Rejected</span>
                                )}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: My Account Details */}
          {activeTab === 'account' && (
            <div className="flex-1 flex flex-col gap-6">
              <div>
                <h1 className="text-2xl font-bold text-white">My Profile</h1>
                <p className="text-slate-400 text-xs mt-1">View your registered details and loyalty rewards.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Profile card details */}
                {isEditingProfile ? (
                  <form onSubmit={handleUpdateProfile} className="lg:col-span-2 glass-card rounded-2xl p-8 space-y-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-450 border-b border-slate-900 pb-3">Edit Profile Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2">Full Name</label>
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
                        onClick={() => setIsEditingProfile(false)}
                        className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition"
                      >
                        Exit Edit
                      </button>
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-500 hover:to-pink-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
                      >
                        {savingProfile ? "Saving..." : "Save Details"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="lg:col-span-2 glass-card rounded-2xl p-8 space-y-6">
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

                    <div className="pt-6 border-t border-slate-900 flex justify-end">
                      <button
                        onClick={startEditing}
                        className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition"
                      >
                        Edit Profile Details
                      </button>
                    </div>
                  </div>
                )}

                {/* Loyalty Print Rewards details page */}
                <div className="glass-card border-pink-500/25 bg-pink-500/5 rounded-2xl p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Star className="w-4 h-4 text-pink-400 fill-current" /> Loyalty Print Rewards
                    </h3>
                    <p className="text-slate-400 text-[10px] mt-1 leading-relaxed">Earn points for every print page and redeem them at checkout for special discount offers.</p>
                  </div>

                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-center">
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black block">Available Points</span>
                    <span className="text-3xl font-black text-pink-400 block mt-1.5">{user?.points || 0} pts</span>
                    <span className="text-[10px] text-slate-400 mt-2 block">1 point = ₹1.00 Discount Offer</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Review Modal Dialog */}
      {reviewOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-2xl p-6 space-y-6 relative">
            <button 
              onClick={() => setReviewOrder(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              ✕
            </button>

            <div>
              <h3 className="text-lg font-bold text-white">Rate your experience</h3>
              <p className="text-xs text-slate-400 mt-1">Shop: {reviewOrder.shopName}</p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Stars Rating</label>
                <div className="flex gap-2 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-8 h-8 ${star <= reviewRating ? 'fill-current' : 'text-slate-800'}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400">Your Feedback</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell us what you liked or how the shop could improve..."
                  rows="3"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white text-sm font-bold rounded-xl transition"
              >
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
