import { HTMLAttributes } from 'react';

interface LoadingSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export function LoadingSkeleton({ 
  width = '100%', 
  height = '20px', 
  rounded = 'md',
  className = '',
  ...props 
}: LoadingSkeletonProps) {
  const roundedClasses = {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full'
  };

  return (
    <div
      className={`shimmer-bg ${roundedClasses[rounded]} ${className}`}
      style={{
        width,
        height,
        background: 'linear-gradient(90deg, #FFF3E0 0%, #FFE0B2 50%, #FFF3E0 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite linear',
        ...props.style
      }}
      {...props}
    />
  );
}

// Add to global styles
export const shimmerCSS = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
`;
