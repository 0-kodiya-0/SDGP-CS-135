import { useState } from 'react';

/**
 * Custom hook for managing popup state
 * 
 * @returns Object with popup state and methods
 */
export const usePopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  /**
   * Open the popup
   * @param element The element that triggered the popup
   */
  const open = (element: HTMLElement) => {
    setAnchorEl(element);
    setIsOpen(true);
  };

  /**
   * Close the popup
   */
  const close = () => {
    setIsOpen(false);
    // Keep the anchor element for a moment to avoid layout shifts
    setTimeout(() => {
      setAnchorEl(null);
    }, 200);
  };

  /**
   * Toggle the popup state
   * @param element The element that triggered the popup
   */
  const toggle = (element: HTMLElement) => {
    if (isOpen && anchorEl === element) {
      close();
    } else {
      open(element);
    }
  };

  return {
    isOpen,
    anchorEl,
    open,
    close,
    toggle
  };
};

export default usePopup;