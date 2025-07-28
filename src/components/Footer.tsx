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
  showBuildInfo = false 
}) => {
  return (
    <footer className={`text-center py-4 text-sm text-muted-foreground ${className}`}>
      {showVersion && (
        <div className="space-y-1">
          <p className="font-medium text-foreground">
            {APP_INFO.name}
          </p>
          <p className="text-xs opacity-75">
            {getFullVersion()}
          </p>
        </div>
      )}
      
      {showBuildInfo && (
        <div className="mt-2 text-xs opacity-50">
          <p>Build: {APP_INFO.buildTimestamp}</p>
          <p>Repo: {APP_INFO.repository}</p>
        </div>
      )}
      
      <div className="mt-2 text-xs opacity-60">
        <p>© 2024 {APP_INFO.author}. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;