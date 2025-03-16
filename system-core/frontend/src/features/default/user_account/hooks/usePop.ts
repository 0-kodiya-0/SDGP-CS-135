import { useState, useRef } from 'react';

export function usePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLElement | null>(null);

  const open = (element: HTMLElement) => {
    anchorRef.current = element;
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  const toggle = (element: HTMLElement) => {
    if (isOpen && anchorRef.current === element) {
      close();
    } else {
      open(element);
    }
  };

  return {
    isOpen,
    anchorRef,
    anchorEl: anchorRef.current,
    open,
    close,
    toggle
  };
}