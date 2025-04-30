import { Search } from 'lucide-react';

export function NavbarSearch() {
  return (
    <div className="relative max-w-md">
      <input
        type="text"
        placeholder="Search"
        className="w-64 pl-8 pr-4 py-1.5 text-sm bg-gray-50 border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-200"
      />
      <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" />
    </div>
  );
}