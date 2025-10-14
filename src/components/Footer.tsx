import React from 'react';

import { getFullVersion, APP_INFO } from '../config/version';

interface FooterProps {
  className?: string;
  showVersion?: boolean;
  showBuildInfo?: boolean;
}

const Footer: React.FC<FooterProps> = ({
  className = '',
  showVersion = true,
  showBuildInfo = false,
}) => {
  return (
    <footer className={`text-center text-xs text-emerald-700/80 ${className}`}>
      {showVersion && (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-emerald-800">{APP_INFO.name}</p>
          <p className="font-medium">{getFullVersion()}</p>
        </div>
      )}

      {showBuildInfo && (
        <div className="mt-2 space-y-1 text-emerald-600">
          <p>Build: {APP_INFO.buildTimestamp}</p>
          <p>Repo: {APP_INFO.repository}</p>
        </div>
      )}

      <p className="mt-3 text-emerald-600/80">© 2024 {APP_INFO.author}. Con cariño para tus plantas.</p>
    </footer>
  );
};

export default Footer;
