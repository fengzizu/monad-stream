import React from 'react';

export const Logo = ({ className = "w-10 h-10" }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#836EF9" />
          <stop offset="100%" stopColor="#4FF0FD" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Abstract "M" shape composed of flowing streams */}
      <path
        d="M20 80 L20 30 L50 60 L80 30 L80 80"
        stroke="url(#neonGradient)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
        className="animate-pulse"
      />
      
      {/* Streaming lines effect */}
      <path
        d="M35 80 L35 55"
        stroke="url(#neonGradient)"
        strokeWidth="4"
        strokeOpacity="0.5"
        strokeLinecap="round"
      />
      <path
        d="M65 80 L65 55"
        stroke="url(#neonGradient)"
        strokeWidth="4"
        strokeOpacity="0.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

