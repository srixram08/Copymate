import React from 'react';

export default function Logo({ size = 'medium', showText = true, darkText = false }) {
  const dimensions = {
    small: { logo: 'w-8 h-8', text: 'text-lg', tag: 'text-[7px]' },
    medium: { logo: 'w-12 h-12', text: 'text-2xl', tag: 'text-[9px]' },
    large: { logo: 'w-20 h-20', text: 'text-4xl', tag: 'text-[12px]' }
  };

  const current = dimensions[size] || dimensions.medium;

  return (
    <div className="flex items-center gap-3.5 select-none select-none group">
      {/* 3D animated Logo Icon */}
      <div className={`relative ${current.logo} shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full filter drop-shadow-[0_0_8px_rgba(124,58,237,0.3)] group-hover:drop-shadow-[0_0_15px_rgba(219,39,119,0.5)] transition-all duration-300"
        >
          <defs>
            <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" /> {/* Blue */}
              <stop offset="50%" stopColor="#7C3AED" /> {/* Purple */}
              <stop offset="100%" stopColor="#DB2777" /> {/* Pink */}
            </linearGradient>
          </defs>

          {/* Arrow Tail / Feathers (Top-Left) */}
          <path 
            d="M 5 25 L 20 40 M 8 22 L 12 34 M 14 16 L 22 32 M 5 25 L 14 16 M 20 40 L 22 32" 
            stroke="url(#logo-gradient)" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />

          {/* Heart Body */}
          {/* Tilted heart shape outline */}
          <path 
            d="M 50 40 
               C 35 22, 18 25, 23 48 
               C 27 62, 45 74, 56 81 
               C 67 71, 80 57, 81 44 
               C 82 25, 65 22, 50 40 Z" 
            stroke="url(#logo-gradient)" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="logo-heart-path"
          />

          {/* Arrow Tip / Point (Bottom-Right) */}
          <path 
            d="M 68 62 L 85 79 M 72 81 L 87 81 L 87 66" 
            stroke="url(#logo-gradient)" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />

          {/* Minus sign inside Heart */}
          <line 
            x1="42" 
            y1="49" 
            x2="55" 
            y2="49" 
            stroke="url(#logo-gradient)" 
            strokeWidth="4" 
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <span 
            className={`font-black tracking-tight leading-none uppercase ${current.text} ${
              darkText ? 'text-slate-800' : 'text-white'
            }`}
          >
            copy<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 font-extrabold lowercase">mate</span>
          </span>
          <span 
            className={`font-black tracking-[0.25em] uppercase mt-1 leading-none ${current.tag} ${
              darkText ? 'text-slate-500' : 'text-slate-400'
            }`}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            your documents, our delivery
          </span>
        </div>
      )}
    </div>
  );
}
