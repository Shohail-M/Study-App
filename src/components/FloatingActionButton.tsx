import React from 'react';

interface FloatingActionButtonProps {
  readonly onClick?: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 sm:bottom-10 right-6 sm:right-10 w-14 sm:w-16 h-14 sm:h-16 bg-primary-container text-on-primary-container rounded-full shadow-[0_12px_40px_rgba(79,140,255,0.4)] flex items-center justify-center transition-transform hover:scale-110 active:scale-90 z-50 animate-pulse-glow"
    >
      <span className="material-symbols-outlined text-2xl sm:text-3xl">add</span>
    </button>
  );
};

export default FloatingActionButton;
