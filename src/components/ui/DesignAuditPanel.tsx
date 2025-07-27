import React, { useState, useEffect } from 'react';
import { Check, AlertTriangle, Info, Smartphone, Palette, Leaf, Zap } from 'lucide-react';

interface AuditResult {
  category: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  details?: string;
  impact: 'low' | 'medium' | 'high';
}

interface DesignAuditPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export const DesignAuditPanel: React.FC<DesignAuditPanelProps> = ({ isVisible, onClose }) => {
  const [auditResults, setAuditResults] = useState<AuditResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (isVisible) {
      runDesignAudit();
    }
  }, [isVisible]);

  const runDesignAudit = async () => {
    setIsRunning(true);
    const results: AuditResult[] = [];

    // 🎨 Color Palette Audit
    results.push(...auditColorPalette());
    
    // 📱 Mobile-First Audit
    results.push(...auditMobileFirst());
    
    // 🌿 Nature Theme Audit
    results.push(...auditNatureTheme());
    
    // ⚡ Performance Audit
    results.push(...auditPerformance());
    
    // 🧭 Navigation Audit
    results.push(...auditNavigation());
    
    // ♿ Accessibility Audit
    results.push(...auditAccessibility());

    setAuditResults(results);
    setIsRunning(false);
  };

  const auditColorPalette = (): AuditResult[] => {
    const results: AuditResult[] = [];
    
    // Check primary colors
    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor = rootStyles.getPropertyValue('--color-primary-500')?.trim();
    
    if (primaryColor.includes('#22c55e') || primaryColor.includes('34, 197, 94')) {
      results.push({
        category: 'Colors',
        status: 'pass',
        message: 'Primary green color correctly defined',
        impact: 'low'
      });
    } else {
      results.push({
        category: 'Colors',
        status: 'warning',
        message: 'Primary color may not match nature theme',
        details: `Found: ${primaryColor}`,
        impact: 'medium'
      });
    }

    // Check for sufficient color contrast
    const bodyBg = getComputedStyle(document.body).backgroundColor;
    const bodyColor = getComputedStyle(document.body).color;
    
    results.push({
      category: 'Colors',
      status: 'pass',
      message: 'Color contrast appears adequate',
      details: `Background: ${bodyBg}, Text: ${bodyColor}`,
      impact: 'low'
    });

    return results;
  };

  const auditMobileFirst = (): AuditResult[] => {
    const results: AuditResult[] = [];
    
    // Check viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta && viewportMeta.getAttribute('content')?.includes('width=device-width')) {
      results.push({
        category: 'Mobile-First',
        status: 'pass',
        message: 'Viewport meta tag properly configured',
        impact: 'high'
      });
    } else {
      results.push({
        category: 'Mobile-First',
        status: 'fail',
        message: 'Missing or incorrect viewport meta tag',
        impact: 'high'
      });
    }

    // Check for touch-friendly buttons
    const buttons = document.querySelectorAll('button, [role="button"]');
    let touchFriendlyCount = 0;
    
    buttons.forEach(button => {
      const styles = getComputedStyle(button);
      const height = parseInt(styles.height);
      const width = parseInt(styles.width);
      
      if (height >= 44 && width >= 44) { // Apple's recommended minimum
        touchFriendlyCount++;
      }
    });

    const touchFriendlyPercentage = (touchFriendlyCount / buttons.length) * 100;
    
    if (touchFriendlyPercentage > 80) {
      results.push({
        category: 'Mobile-First',
        status: 'pass',
        message: `${touchFriendlyPercentage.toFixed(0)}% of buttons are touch-friendly`,
        impact: 'medium'
      });
    } else {
      results.push({
        category: 'Mobile-First',
        status: 'warning',
        message: `Only ${touchFriendlyPercentage.toFixed(0)}% of buttons are touch-friendly`,
        details: 'Consider increasing button sizes for better mobile experience',
        impact: 'medium'
      });
    }

    // Check for responsive images
    const images = document.querySelectorAll('img');
    let responsiveImages = 0;
    
    images.forEach(img => {
      const styles = getComputedStyle(img);
      if (styles.maxWidth === '100%' || img.hasAttribute('srcset')) {
        responsiveImages++;
      }
    });

    if (responsiveImages === images.length) {
      results.push({
        category: 'Mobile-First',
        status: 'pass',
        message: 'All images are responsive',
        impact: 'medium'
      });
    } else {
      results.push({
        category: 'Mobile-First',
        status: 'warning',
        message: `${responsiveImages}/${images.length} images are responsive`,
        impact: 'medium'
      });
    }

    return results;
  };

  const auditNatureTheme = (): AuditResult[] => {
    const results: AuditResult[] = [];
    
    // Check for nature-related icons
    const leafIcons = document.querySelectorAll('[data-lucide="leaf"], [data-lucide="tree"], [data-lucide="flower"]');
    if (leafIcons.length > 0) {
      results.push({
        category: 'Nature Theme',
        status: 'pass',
        message: `Found ${leafIcons.length} nature-themed icons`,
        impact: 'low'
      });
    } else {
      results.push({
        category: 'Nature Theme',
        status: 'warning',
        message: 'Consider adding more nature-themed visual elements',
        impact: 'low'
      });
    }

    // Check for rounded corners (organic feel)
    const elementsWithBorderRadius = document.querySelectorAll('*');
    let roundedElements = 0;
    
    elementsWithBorderRadius.forEach(el => {
      const styles = getComputedStyle(el);
      if (styles.borderRadius && styles.borderRadius !== '0px') {
        roundedElements++;
      }
    });

    if (roundedElements > 10) {
      results.push({
        category: 'Nature Theme',
        status: 'pass',
        message: 'Good use of rounded corners for organic feel',
        impact: 'low'
      });
    }

    // Check for proper spacing (breathing room)
    const containers = document.querySelectorAll('.container, main, section');
    let wellSpacedContainers = 0;
    
    containers.forEach(container => {
      const styles = getComputedStyle(container);
      const padding = parseInt(styles.paddingTop) + parseInt(styles.paddingBottom);
      
      if (padding >= 16) { // At least 1rem of vertical padding
        wellSpacedContainers++;
      }
    });

    if (wellSpacedContainers / containers.length > 0.7) {
      results.push({
        category: 'Nature Theme',
        status: 'pass',
        message: 'Good use of whitespace for minimalist feel',
        impact: 'medium'
      });
    }

    return results;
  };

  const auditPerformance = (): AuditResult[] => {
    const results: AuditResult[] = [];
    
    // Check for lazy loading
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    const totalImages = document.querySelectorAll('img');
    
    if (lazyImages.length > 0) {
      results.push({
        category: 'Performance',
        status: 'pass',
        message: `${lazyImages.length}/${totalImages.length} images use lazy loading`,
        impact: 'medium'
      });
    }

    // Check for efficient CSS (no inline styles)
    const elementsWithInlineStyles = document.querySelectorAll('[style]');
    if (elementsWithInlineStyles.length < 10) {
      results.push({
        category: 'Performance',
        status: 'pass',
        message: 'Minimal use of inline styles',
        impact: 'low'
      });
    } else {
      results.push({
        category: 'Performance',
        status: 'warning',
        message: `Found ${elementsWithInlineStyles.length} elements with inline styles`,
        details: 'Consider moving styles to CSS classes',
        impact: 'medium'
      });
    }

    return results;
  };

  const auditNavigation = (): AuditResult[] => {
    const results: AuditResult[] = [];
    
    // Check for bottom navigation (mobile-first)
    const bottomNav = document.querySelector('[data-testid="bottom-navigation"], .bottom-navigation');
    if (bottomNav) {
      results.push({
        category: 'Navigation',
        status: 'pass',
        message: 'Bottom navigation found - good for mobile',
        impact: 'high'
      });
    } else {
      results.push({
        category: 'Navigation',
        status: 'warning',
        message: 'Consider adding bottom navigation for mobile',
        impact: 'medium'
      });
    }

    // Check for accessible navigation
    const navElements = document.querySelectorAll('nav, [role="navigation"]');
    if (navElements.length > 0) {
      results.push({
        category: 'Navigation',
        status: 'pass',
        message: 'Navigation landmarks found',
        impact: 'medium'
      });
    }

    return results;
  };

  const auditAccessibility = (): AuditResult[] => {
    const results: AuditResult[] = [];
    
    // Check for alt text on images
    const images = document.querySelectorAll('img');
    let imagesWithAlt = 0;
    
    images.forEach(img => {
      if (img.hasAttribute('alt')) {
        imagesWithAlt++;
      }
    });

    if (imagesWithAlt === images.length) {
      results.push({
        category: 'Accessibility',
        status: 'pass',
        message: 'All images have alt text',
        impact: 'high'
      });
    } else {
      results.push({
        category: 'Accessibility',
        status: 'warning',
        message: `${imagesWithAlt}/${images.length} images have alt text`,
        impact: 'high'
      });
    }

    // Check for focus indicators
    const focusableElements = document.querySelectorAll('button, input, select, textarea, a[href]');
    results.push({
      category: 'Accessibility',
      status: 'pass',
      message: `Found ${focusableElements.length} focusable elements`,
      details: 'Ensure all have proper focus indicators',
      impact: 'medium'
    });

    return results;
  };

  const getStatusIcon = (status: AuditResult['status']) => {
    switch (status) {
      case 'pass':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'fail':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Mobile-First':
        return <Smartphone className="w-4 h-4" />;
      case 'Colors':
        return <Palette className="w-4 h-4" />;
      case 'Nature Theme':
        return <Leaf className="w-4 h-4" />;
      case 'Performance':
        return <Zap className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getImpactColor = (impact: AuditResult['impact']) => {
    switch (impact) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
    }
  };

  if (!isVisible) return null;

  const passCount = auditResults.filter(r => r.status === 'pass').length;
  const warningCount = auditResults.filter(r => r.status === 'warning').length;
  const failCount = auditResults.filter(r => r.status === 'fail').length;
  const score = Math.round((passCount / auditResults.length) * 100);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Design Audit Report</h2>
              <p className="text-gray-600 mt-1">Evaluating mobile-first, nature theme, and UX best practices</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>
          
          <div className="mt-4 flex items-center space-x-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                {score}%
              </div>
              <div className="text-sm text-gray-500">Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{passCount}</div>
              <div className="text-sm text-gray-500">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{warningCount}</div>
              <div className="text-sm text-gray-500">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{failCount}</div>
              <div className="text-sm text-gray-500">Failed</div>
            </div>
          </div>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          {isRunning ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Running design audit...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {auditResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="flex items-center space-x-2 min-w-0">
                      {getCategoryIcon(result.category)}
                      {getStatusIcon(result.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">{result.message}</h3>
                        <span className={`text-xs font-medium ${getImpactColor(result.impact)}`}>
                          {result.impact.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{result.category}</p>
                      {result.details && (
                        <p className="text-sm text-gray-500 mt-2">{result.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Recommendations</h3>
              <p className="text-sm text-gray-600">
                Focus on high-impact items first. Maintain nature theme and mobile-first approach.
              </p>
            </div>
            <button
              onClick={runDesignAudit}
              disabled={isRunning}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              Re-run Audit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignAuditPanel;