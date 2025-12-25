'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'motion/react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { APIKeyModal } from './APIKeyModal';
import { Highlight } from './ui/hero-highlight';
import { Button } from './ui/button';
import { LoaderGooeyBlobs } from './gooey-blobs';
import TiltedCard from './TiltedCard';

// Dynamic import for LiquidEther to prevent SSR issues
const LiquidEther = dynamic(() => import('./LiquidEther'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-gradient-to-br from-[#050508] via-[#0a0a15] to-[#050508]" />
  ),
});

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  const { user, isLoading } = useUser();
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false);

  const handleEnter = () => {
    // Only allow entry if user is logged in
    if (user) {
      onEnter();
    } else {
      // Redirect to login
      window.location.href = '/auth/login';
    }
  };

  const handleAIScan = () => {
    setShowAPIKeyModal(true);
  };

  const handleAPIKeySubmit = () => {
    setShowAPIKeyModal(false);
    onEnter();
  };

  return (
    <div className="relative w-full h-screen overflow-y-auto overflow-x-hidden" style={{ overflowY: 'auto' }}>
      {/* LiquidEther Background - FIXED so it stays when scrolling */}
      <div className="fixed inset-0 z-0 pointer-events-none">
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

      {/* Dark overlay for better text readability - also FIXED */}
      <div className="fixed inset-0 bg-black/30 z-0 pointer-events-none" />

      {/* User info - Top Right */}
      {user && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
          {user.picture && (
            <img 
              src={user.picture} 
              alt={user.name || 'User'} 
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-white/90 text-sm">
            {user.name || user.email}
          </span>
          <a 
            href="/auth/logout"
            className="text-white/60 hover:text-white/90 text-xs ml-2 transition-colors cursor-pointer pointer-events-auto"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = `/auth/logout?returnTo=${encodeURIComponent(window.location.origin)}`;
            }}
          >
            Logout
          </a>
        </div>
      )}

      {/* Merry Christmas Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0.0, 0.2, 1] }}
        className="absolute top-6 left-0 right-0 z-20 flex justify-center"
      >
        <span className="text-white/80 text-sm md:text-base font-bold tracking-widest uppercase">
          🎄 Merry Christmas 🎄
        </span>
      </motion.div>

      {/* First Section - Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: [20, -5, 0] }}
          transition={{ duration: 0.5, ease: [0.4, 0.0, 0.2, 1] }}
          className="text-5xl md:text-7xl font-bold text-white tracking-tight text-center mb-4"
        >
          SpacedApp
        </motion.h1>

        {/* Tagline with animation */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0.0, 0.2, 1] }}
          className="text-xl md:text-2xl text-white/70 font-light text-center mb-12"
        >
          Design Your Space in{" "}
          <Highlight className="text-white !bg-gradient-to-r !from-indigo-600 !to-purple-700">
            3D
          </Highlight>
        </motion.p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {user ? (
            <>
              {/* Enter Button - Only for logged in users */}
              <Button
                onClick={handleEnter}
                size="lg"
                className="px-8 py-6 text-lg font-semibold rounded-xl !bg-white !text-gray-900 hover:!bg-white/90 shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/30 transition-all duration-300 hover:scale-105 active:scale-95"
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
            </>
          ) : (
            /* Login Button - For non-logged in users */
            <Button
              asChild
              size="lg"
              className="px-8 py-6 text-lg font-semibold rounded-xl !bg-white !text-gray-900 hover:!bg-white/90 shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/30 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <a href="/auth/login">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Login to Enter
              </a>
            </Button>
          )}
        </div>

        {/* Features hint */}
        <div className="mt-16 flex flex-wrap justify-center gap-12 text-white/70 text-sm">
          <div className="flex items-center gap-3">
            <LoaderGooeyBlobs size={8} color="#f59e0b" duration={1.5} />
            <span>Drag & Drop Furniture</span>
          </div>
          <div className="flex items-center gap-3">
            <LoaderGooeyBlobs size={8} color="#3b82f6" duration={1.8} />
            <span>AI Room Analysis</span>
          </div>
          <div className="flex items-center gap-3">
            <LoaderGooeyBlobs size={8} color="#22c55e" duration={2.0} />
            <span>Export Your Designs</span>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
          className="mt-16"
        >
          <svg className="w-6 h-6 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </div>

      {/* Second Section - Contact */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold text-white tracking-tight text-center mb-4"
        >
          Meet the Dev
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-lg text-white/60 text-center mb-12 max-w-md"
        >
          The creator behind SpacedApp ✨
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <a href="https://x.com/astaso1" target="_blank" rel="noopener noreferrer">
            <TiltedCard
              imageSrc="/twitter-profile.png"
              altText="@astaso1 on Twitter"
              captionText="@astaso1"
              containerHeight="320px"
              containerWidth="320px"
              imageHeight="280px"
              imageWidth="280px"
              rotateAmplitude={12}
              scaleOnHover={1.15}
              showMobileWarning={false}
              showTooltip={true}
              displayOverlayContent={true}
              overlayContent={
                <div className="flex flex-col items-center justify-end h-full pb-6">
                  <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2">
                    <p className="text-white font-bold text-lg">@astaso1</p>
                    <p className="text-white/70 text-sm">Follow on X</p>
                  </div>
                </div>
              }
            />
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-8 text-white/40 text-sm"
        >
          Built with ❤️ using Next.js & Three.js
        </motion.p>
      </div>

      {/* API Key Modal */}
      {showAPIKeyModal && (
        <APIKeyModal 
          onClose={() => setShowAPIKeyModal(false)}
          onSubmit={handleAPIKeySubmit}
        />
      )}
    </div>
  );
}
