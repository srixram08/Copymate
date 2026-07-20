import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, MapPin, Sparkles, Compass, Navigation, FileText, ArrowRight, Star } from 'lucide-react';
import Logo from '../components/Logo.jsx';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FileText className="w-6 h-6 text-pink-400" />,
      title: "Smart Upload",
      desc: "Upload PDF, DOCX, PPT, or images. Get auto-calculated page counts instantly."
    },
    {
      icon: <Compass className="w-6 h-6 text-purple-400" />,
      title: "Print Customization",
      desc: "Select paper size, color/BW, single/double sided, number of copies, and page ranges."
    },
    {
      icon: <MapPin className="w-6 h-6 text-blue-400" />,
      title: "Nearby Print Shops",
      desc: "Find and compare local print hubs based on proximity, pricing, and customer ratings."
    },
    {
      icon: <Navigation className="w-6 h-6 text-pink-400" />,
      title: "Doorstep Delivery",
      desc: "Get your documents delivered to your home or office, or choose instant QR code pickup."
    }
  ];

  const roles = [
    {
      title: "For Customers",
      badge: "User Portal",
      desc: "Upload documents, customize prints, pay online, and get delivery.",
      actionText: "Order Now",
      bg: "from-blue-600/15 to-purple-600/15 border-blue-500/20",
      btnBg: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-blue-500/25",
      dest: "/customer"
    },
    {
      title: "For Shop Owners",
      badge: "Partner Portal",
      desc: "Receive orders, manage printing status, track revenues, and assign deliveries.",
      actionText: "Partner Portal",
      bg: "from-purple-600/15 to-pink-600/15 border-purple-500/20",
      btnBg: "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-500/25",
      dest: "/shop"
    },
    {
      title: "For Delivery Agents",
      badge: "Rider Portal",
      desc: "Accept delivery jobs, locate print shops and customers, confirm deliveries.",
      actionText: "Deliver & Earn",
      bg: "from-blue-600/15 to-pink-600/15 border-pink-500/20",
      btnBg: "bg-gradient-to-r from-blue-600 to-pink-600 hover:from-blue-500 hover:to-pink-500 shadow-pink-500/25",
      dest: "/delivery"
    },
    {
      title: "For Platform Admins",
      badge: "Master Panel",
      desc: "Manage shops, users, transactions, analytics dashboard, and system health.",
      actionText: "Admin Panel",
      bg: "from-slate-800/40 to-slate-900/40 border-slate-700/40",
      btnBg: "bg-slate-800 hover:bg-slate-700 shadow-slate-900/20",
      dest: "/admin"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-slate-950">
      
      {/* 3D Animated Floating Orbs in Background */}
      <div className="absolute top-[-10%] left-[-5%] w-[550px] h-[550px] rounded-full bg-blue-600/10 blur-[130px] animate-float-orb-1 pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-pink-600/10 blur-[140px] animate-float-orb-2 pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] w-[450px] h-[450px] rounded-full bg-purple-600/5 blur-[120px] animate-float-orb-3 pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-900 relative z-10">
        <Logo size="medium" />
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 rounded-xl border border-slate-800 text-sm font-semibold hover:bg-slate-900 hover:border-slate-700 transition"
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate('/register')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:to-pink-500 text-sm font-bold shadow-lg shadow-purple-600/25 transition"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-16 md:py-24 relative z-10 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-pink-500/20 bg-pink-500/5 text-xs text-pink-400 font-bold mb-6 select-none animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          The Ultimate remote document printing ecosystem
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-tight mb-6">
          Stop Waiting in Xerox Queues. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            Print Documents with Instant Delivery.
          </span>
        </h1>

        <p className="text-slate-400 max-w-xl text-sm md:text-base mb-10 leading-relaxed">
          Upload documents, select color models, paper formats, and pay online. Choose between quick shop pickups or en-route rider drops directly to your door.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <button 
            onClick={() => navigate('/register')}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:opacity-95 font-black text-white shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition group transform active:scale-95"
          >
            Upload & Print Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <a 
            href="#portals"
            className="px-8 py-4 rounded-xl border border-slate-800 text-slate-300 font-bold hover:bg-slate-900 hover:text-white transition flex items-center justify-center"
          >
            Explore Portals
          </a>
        </div>

        {/* Feature Grid with 3D Tilt Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full text-left mb-24 perspective-1000">
          {features.map((f, i) => (
            <div key={i} className="glass-card card-3d p-6 rounded-2xl flex flex-col gap-4 preserve-3d">
              <div className="p-3 w-fit bg-slate-900 border border-slate-800 rounded-xl">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-white translate-z-10">{f.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* Portal Entry Points with 3D Card tilt */}
        <section id="portals" className="w-full text-left perspective-1000">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center mb-12">
            Experience the Ecosystem
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((r, i) => (
              <div 
                key={i} 
                className={`p-6 rounded-2xl border bg-gradient-to-b card-3d flex flex-col justify-between min-h-[240px] preserve-3d ${r.bg}`}
              >
                <div>
                  <div className="inline-block px-2.5 py-1 text-[9px] uppercase font-bold tracking-wider rounded-md bg-white/5 border border-white/10 text-white mb-4">
                    {r.badge}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 translate-z-10">{r.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-6">{r.desc}</p>
                </div>
                <button
                  onClick={() => navigate('/login')}
                  className={`w-full py-3 rounded-xl text-xs font-black text-white transition-all shadow-md active:translate-y-0.5 hover:shadow-lg ${r.btnBg}`}
                >
                  Access {r.actionText}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 py-8 text-center text-xs text-slate-600 relative z-10 bg-slate-950/80">
        <p>© 2026 CopyMate Printing Platform. Your Documents, Our Delivery.</p>
      </footer>
    </div>
  );
}
