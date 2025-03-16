import { useState } from 'react';

interface SummaryBarProps {
  className?: string;
}

export function SummaryBar({ className }: SummaryBarProps) {
  const [loading, setLoading] = useState(false);

  return (
    <div className={`bg-white border-r border-gray-200 py-4 flex-shrink-0 ${className}`}>
      {loading ? (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-700" />
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
        </div>
      )}
    </div>
  );
}