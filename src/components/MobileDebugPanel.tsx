import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, X, Wifi, Smartphone, Monitor } from 'lucide-react';
import { getMobileDeviceInfo } from '../utils/mobileViewport';
import { useConnectionQuality } from '../hooks/useNetworkStatus';
import { useAuthStore } from '../stores/useAuthStore';

export const MobileDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const networkInfo = useConnectionQuality();
  const { session, isInitialized } = useAuthStore();

  // Only show in development
  if (!import.meta.env.DEV) return null;

  const deviceInfo = getMobileDeviceInfo();

  const togglePanel = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Debug Toggle Button */}
      <button
        onClick={togglePanel}
        className="fixed top-4 right-4 z-[9999] w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
        style={{ fontSize: '12px' }}
      >
        <Bug className="w-4 h-4" />
      </button>

      {/* Debug Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 right-4 left-4 z-[9998] bg-black/90 text-white p-4 rounded-lg max-h-[70vh] overflow-y-auto text-xs"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm">📱 Mobile Debug Panel</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Device Info */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Smartphone className="w-3 h-3" />
                  <span className="font-semibold">Device</span>
                </div>
                <div className="pl-4 space-y-1">
                  <div>Platform: {deviceInfo.platform}</div>
                  <div>iOS: {deviceInfo.isIOS ? '✅' : '❌'}</div>
                  <div>Safari: {deviceInfo.isSafari ? '✅' : '❌'}</div>
                  <div>iOS Safari: {deviceInfo.isIOSSafari ? '✅' : '❌'}</div>
                </div>
              </div>

              {/* Viewport Info */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Monitor className="w-3 h-3" />
                  <span className="font-semibold">Viewport</span>
                </div>
                <div className="pl-4 space-y-1">
                  <div>Size: {deviceInfo.viewport.width}x{deviceInfo.viewport.height}</div>
                  <div>Available: {deviceInfo.viewport.availWidth}x{deviceInfo.viewport.availHeight}</div>
                  <div>CSS vh: {getComputedStyle(document.documentElement).getPropertyValue('--vh')}</div>
                </div>
              </div>

              {/* Safe Area */}
              <div>
                <div className="font-semibold mb-1">Safe Area</div>
                <div className="pl-4 space-y-1">
                  <div>Top: {deviceInfo.safeArea.top}</div>
                  <div>Bottom: {deviceInfo.safeArea.bottom}</div>
                  <div>Left: {deviceInfo.safeArea.left}</div>
                  <div>Right: {deviceInfo.safeArea.right}</div>
                </div>
              </div>

              {/* Network Info */}
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Wifi className="w-3 h-3" />
                  <span className="font-semibold">Network</span>
                </div>
                <div className="pl-4 space-y-1">
                  <div>Online: {networkInfo.isOnline ? '✅' : '❌'}</div>
                  <div>Quality: {networkInfo.quality}</div>
                  <div>Type: {networkInfo.effectiveType || 'Unknown'}</div>
                  {networkInfo.downlink && <div>Speed: {networkInfo.downlink} Mbps</div>}
                  {networkInfo.rtt && <div>RTT: {networkInfo.rtt}ms</div>}
                </div>
              </div>

              {/* Auth Info */}
              <div>
                <div className="font-semibold mb-1">🔐 Auth</div>
                <div className="pl-4 space-y-1">
                  <div>Initialized: {isInitialized ? '✅' : '❌'}</div>
                  <div>Session: {session ? '✅' : '❌'}</div>
                  {session && <div>User: {session.user?.email}</div>}
                </div>
              </div>

              {/* User Agent */}
              <div>
                <div className="font-semibold mb-1">User Agent</div>
                <div className="pl-4 text-xs break-all">
                  {navigator.userAgent}
                </div>
              </div>

              {/* Current URL */}
              <div>
                <div className="font-semibold mb-1">Current URL</div>
                <div className="pl-4 text-xs break-all">
                  {window.location.href}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};