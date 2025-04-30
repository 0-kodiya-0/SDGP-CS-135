import React from 'react';

export interface GridCellProps {
  children: React.ReactNode;
  className?: string;
  hasMarker?: boolean;
  markerPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const GridCell: React.FC<GridCellProps> = ({
  children,
  className = '',
  hasMarker = false,
  markerPosition = 'top-left'
}) => {
  return (
    <div className={`relative ${className}`}>
      {hasMarker && (
        <div
          className={`absolute w-3 h-3 border-2 border-blue-accent rounded-sm z-10
                        ${markerPosition === 'top-left' && 'top-0 left-0 -translate-x-1/2 -translate-y-1/2'}
                        ${markerPosition === 'top-right' && 'top-0 right-0 translate-x-1/2 -translate-y-1/2'}
                        ${markerPosition === 'bottom-left' && 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2'}
                        ${markerPosition === 'bottom-right' && 'bottom-0 right-0 translate-x-1/2 translate-y-1/2'}
                    `}
        />
      )}
      {children}
    </div>
  );
};

export default GridCell;