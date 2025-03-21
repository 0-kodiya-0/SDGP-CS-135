import React from 'react';
import { usePopup } from '../context/PopupContext';

const PopupDisplay: React.FC = () => {
  const { popups, hidePopup } = usePopup();

  if (popups.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      {popups.map(({ id, component: Component, props }) => (
        <div key={id} className="relative bg-white rounded-lg p-5 shadow-lg max-w-[90%] max-h-[90%] overflow-auto">
          <button
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl border-none bg-transparent cursor-pointer"
            onClick={() => hidePopup(id)}
            aria-label="Close"
          >
            ✕
          </button>
          {/* We need a type assertion to handle the generic component props */}
          <Component
            {...(props as Record<string, unknown>)}
            onClose={() => hidePopup(id)}
          />
        </div>
      ))}
    </div>
  );
};

export default PopupDisplay;