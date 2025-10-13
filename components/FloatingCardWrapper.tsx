import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { X, Minus, Maximize2, Minimize2 } from 'lucide-react';
import { CardPosition } from '../contexts/CardManagerContext';

interface FloatingCardWrapperProps {
  id: string;
  title: string;
  titleColor?: string;
  position: CardPosition;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onPositionChange: (position: CardPosition) => void;
  onBringToFront: () => void;
  children: ReactNode;
}

export const FloatingCardWrapper: React.FC<FloatingCardWrapperProps> = ({
  id,
  title,
  titleColor = 'from-blue-600 to-blue-700',
  position,
  isMinimized,
  isMaximized,
  zIndex,
  onClose,
  onMinimize,
  onMaximize,
  onPositionChange,
  onBringToFront,
  children,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only start dragging if clicking on the title bar (not buttons)
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    setIsDragging(true);
    onBringToFront();
    
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - 200; // minimum visible width
      const maxY = window.innerHeight - 50; // minimum visible height
      
      onPositionChange({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onPositionChange]);

  const style: React.CSSProperties = isMaximized
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex,
      }
    : {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex,
      };

  return (
    <div
      ref={cardRef}
      style={style}
      className={`bg-gray-900 border-2 border-yellow-400/50 rounded-xl shadow-2xl transition-all ${
        isDragging ? 'cursor-grabbing' : ''
      } ${isMaximized ? '' : 'min-w-[400px]'}`}
      onClick={onBringToFront}
    >
      {/* Title Bar */}
      <div
        className={`bg-gradient-to-r ${titleColor} px-4 py-3 rounded-t-xl flex items-center justify-between cursor-grab active:cursor-grabbing border-b-2 border-yellow-400/30`}
        onMouseDown={handleMouseDown}
      >
        <h3 className="text-white font-bold text-sm">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onMinimize}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            title="Minimize"
          >
            <Minus className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={onMaximize}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? (
              <Minimize2 className="w-4 h-4 text-white" />
            ) : (
              <Maximize2 className="w-4 h-4 text-white" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-red-500/80 rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className={`${isMaximized ? 'h-full overflow-auto' : 'max-h-[600px] overflow-auto'} p-4`}>
          {children}
        </div>
      )}
    </div>
  );
};