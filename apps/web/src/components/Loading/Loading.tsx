import React from 'react';
import './Loading.css';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ 
  size = 'medium', 
  message = 'Loading...', 
  fullScreen = false,
  className = ''
}) => {
  const containerClass = fullScreen ? 'loading-fullscreen' : 'loading-container';
  const sizeClass = `loading-${size}`;
  
  return (
    <div className={`${containerClass} ${sizeClass} ${className}`}>
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
      {message && <div className="loading-message">{message}</div>}
    </div>
  );
};

export default Loading;
