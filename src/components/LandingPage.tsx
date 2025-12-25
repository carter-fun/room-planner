'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useUser } from '@auth0/nextjs-auth0/client';
import { APIKeyModal } from './APIKeyModal';
import { TextGenerateEffect } from './ui/text-generate-effect';
import { Button } from './ui/button';

// Dynamic import for LiquidEther to prevent SSR issues
const LiquidEther = dynamic(() => import('./LiquidEther'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-gradient-to-br from-[#050508] via-[#0a0a15] to-[#050508]" />
  ),
});

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  const { user, isLoading } = useUser();
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false);

  const handleEnter = () => {
    onEnter();
  };

  const handleAIScan = () => {
    setShowAPIKeyModal(true);
  };

  const handleAPIKeySubmit = () => {
    setShowAPIKeyModal(false);
    onEnter();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* LiquidEther Background */}
      <div className="absolute inset-0">
        <LiquidEther
          colors={['#5a3d8a', '#3d6098', '#7b4db8']}
          mouseForce={20}
          cursorSize={100}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.5}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        {/* Logo/Icon */}
        <div className="mb-6 animate-float">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center shadow-2xl shadow-orange-500/30 backdrop-blur-sm">
            <svg 
              className="w-14 h-14 text-white" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={1.5}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" 
              />
            </svg>
          </div>
        </div>

        {/* Title with Text Generate Effect */}
        <TextGenerateEffect
          words="Room Planner"
          className="text-center mb-3"
          textClassName="text-5xl md:text-7xl font-bold text-white tracking-tight"
          duration={0.8}
        />

        {/* Tagline with Text Generate Effect */}
        <TextGenerateEffect
          words="Design Your Space in 3D"
          className="text-center mb-12"
          textClassName="text-xl md:text-2xl text-white/70 font-light"
          duration={0.5}
          filter={false}
        />

        {/* User info or Login prompt */}
        {isLoading ? (
          <div className="mb-8 text-white/60">Loading...</div>
        ) : user ? (
          <div className="mb-8 flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
            {user.picture && (
              <img 
                src={user.picture} 
                alt={user.name || 'User'} 
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-white/90 text-sm">
              Welcome, {user.name || user.email}
            </span>
            <a 
              href="/auth/logout"
              className="text-white/60 hover:text-white/90 text-xs ml-2 transition-colors"
            >
              Logout
            </a>
          </div>
        ) : (
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
              <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-white/60 text-sm">
                Login to save and sync designs
              </span>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:border-white/50"
            >
              <a href="/auth/login">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Login with Auth0
              </a>
            </Button>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Enter Button */}
          <Button
            onClick={handleEnter}
            size="lg"
            className="px-8 py-6 text-lg font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/40 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            Enter
            <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Button>

          {/* AI Scan Button */}
          <Button
            onClick={handleAIScan}
            variant="outline"
            size="lg"
            className="px-8 py-6 text-lg font-semibold rounded-xl bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:border-white/50 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            AI Scan Setup
          </Button>
        </div>

        {/* Features hint */}
        <div className="mt-16 flex flex-wrap justify-center gap-8 text-white/50 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Drag & Drop Furniture</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>AI Room Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Export Your Designs</span>
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      {showAPIKeyModal && (
        <APIKeyModal 
          onClose={() => setShowAPIKeyModal(false)}
          onSubmit={handleAPIKeySubmit}
        />
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
