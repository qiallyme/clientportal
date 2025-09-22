import React from 'react';

interface QiSuiteLogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'full' | 'icon' | 'text';
  className?: string;
}

const QiSuiteLogo: React.FC<QiSuiteLogoProps> = ({ 
  size = 'medium', 
  variant = 'full',
  className = '' 
}) => {
  const sizeClasses = {
    small: 'h-8',
    medium: 'h-12',
    large: 'h-16'
  };

  const textSizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-4xl'
  };

  const iconSize = {
    small: 24,
    medium: 32,
    large: 48
  };

  const icon = (
    <svg 
      width={iconSize[size]} 
      height={iconSize[size]} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="text-blue-600"
    >
      {/* Qi symbol - simplified version */}
      <circle cx="16" cy="16" r="14" fill="currentColor" opacity="0.1" />
      <circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="16" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="2" fill="currentColor" />
      
      {/* Accent elements */}
      <path d="M8 8 L12 12 M20 8 L24 12 M8 24 L12 20 M20 24 L24 20" 
            stroke="currentColor" 
            strokeWidth="1" 
            opacity="0.6" />
    </svg>
  );

  const text = (
    <span className={`font-bold text-gray-900 ${textSizeClasses[size]}`}>
      QiSuite
    </span>
  );

  if (variant === 'icon') {
    return <div className={`${className}`}>{icon}</div>;
  }

  if (variant === 'text') {
    return <div className={`${className}`}>{text}</div>;
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {icon}
      {text}
    </div>
  );
};

export default QiSuiteLogo;
