import { ShieldCheck, Cloud, HelpCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="h-8 bg-white border-t flex items-center justify-between px-4">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          <span className="text-xs text-gray-600">System Status: Online</span>
        </div>
        <div className="flex items-center space-x-1">
          <Cloud className="w-4 h-4 text-blue-500" />
          <span className="text-xs text-gray-600">Connected</span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button className="p-1 hover:bg-gray-100 rounded">
          <HelpCircle className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </footer>
  );
}