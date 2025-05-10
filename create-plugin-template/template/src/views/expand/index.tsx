import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Function to initialize the expand view
export function initialize(container: HTMLElement) {
  const root = createRoot(container);

  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  return {
    // Cleanup function called when view is unmounted
    destroy: () => {
      root.unmount();
    }
  };
}