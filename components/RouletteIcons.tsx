import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// Minimalist Roulette Wheel - Professional thin line design
export const RouletteWheelIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" opacity="0.4" />
    <circle cx="12" cy="12" r="7" stroke="currentColor" opacity="0.6" />
    <circle cx="12" cy="12" r="1.5" stroke="currentColor" />
    <line x1="12" y1="2" x2="12" y2="5" stroke="currentColor" opacity="0.5" />
    <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" opacity="0.5" />
    <line x1="2" y1="12" x2="5" y2="12" stroke="currentColor" opacity="0.5" />
    <line x1="19" y1="12" x2="22" y2="12" stroke="currentColor" opacity="0.5" />
  </svg>
);

// Minimalist Casino Chip - Geometric elegance
export const CasinoChipIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    strokeWidth="1"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" opacity="0.4" />
    <circle cx="12" cy="12" r="6" stroke="currentColor" opacity="0.6" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" />
    <line x1="3" y1="12" x2="5" y2="12" stroke="currentColor" opacity="0.5" />
    <line x1="19" y1="12" x2="21" y2="12" stroke="currentColor" opacity="0.5" />
    <line x1="12" y1="3" x2="12" y2="5" stroke="currentColor" opacity="0.5" />
    <line x1="12" y1="19" x2="12" y2="21" stroke="currentColor" opacity="0.5" />
  </svg>
);

// Minimalist Data Analytics - Clean bar chart
export const AnalyticsIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    strokeWidth="1"
    strokeLinecap="round"
  >
    <line x1="4" y1="20" x2="4" y2="14" stroke="currentColor" opacity="0.5" />
    <line x1="8" y1="20" x2="8" y2="10" stroke="currentColor" opacity="0.7" />
    <line x1="12" y1="20" x2="12" y2="6" stroke="currentColor" />
    <line x1="16" y1="20" x2="16" y2="8" stroke="currentColor" opacity="0.7" />
    <line x1="20" y1="20" x2="20" y2="12" stroke="currentColor" opacity="0.5" />
    <line x1="2" y1="21" x2="22" y2="21" stroke="currentColor" opacity="0.3" />
  </svg>
);

// Minimalist Target - Precision aiming
export const TargetIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    strokeWidth="1"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" opacity="0.3" />
    <circle cx="12" cy="12" r="6" stroke="currentColor" opacity="0.5" />
    <circle cx="12" cy="12" r="2" stroke="currentColor" />
    <line x1="22" y1="12" x2="18" y2="12" stroke="currentColor" opacity="0.4" />
    <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" opacity="0.4" />
  </svg>
);

// Minimalist Pattern Grid - Statistical patterns
export const PatternIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    strokeWidth="1"
  >
    <rect x="3" y="3" width="7" height="7" stroke="currentColor" opacity="0.4" />
    <rect x="14" y="3" width="7" height="7" stroke="currentColor" opacity="0.6" />
    <rect x="3" y="14" width="7" height="7" stroke="currentColor" opacity="0.6" />
    <rect x="14" y="14" width="7" height="7" stroke="currentColor" />
  </svg>
);

// Minimalist Trend Arrow - Upward momentum
export const TrendIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 17 9 11 13 15 21 7" stroke="currentColor" />
    <polyline points="16 7 21 7 21 12" stroke="currentColor" opacity="0.6" />
  </svg>
);

// Minimalist Shield - Protection/discipline
export const ShieldIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2L4 6v6c0 5.5 3.5 10 8 12 4.5-2 8-6.5 8-12V6l-8-4z" stroke="currentColor" opacity="0.4" />
    <path d="M12 8v4m0 4h.01" stroke="currentColor" />
  </svg>
);
