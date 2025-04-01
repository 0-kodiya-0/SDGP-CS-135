import { useState, useRef, useEffect } from 'react';
import { Menu, FileText, Settings, History, Trash2 } from 'lucide-react';

interface MenuButtonProps {
    onMenuToggle?: (isOpen: boolean) => void;
}

export function MenuButton({ onMenuToggle }: MenuButtonProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const toggleMenu = () => {
        const newState = !isMenuOpen;
        setIsMenuOpen(newState);
        if (onMenuToggle) {
            onMenuToggle(newState);
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
                if (onMenuToggle && isMenuOpen) {
                    onMenuToggle(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen, onMenuToggle]);

    return (
        <div className="w-16 flex items-center justify-center flex-shrink-0" ref={menuRef}>
            <button
                className="p-1.5 hover:bg-gray-100 rounded transition-colors duration-150"
                onClick={toggleMenu}
                aria-label="Toggle menu"
                aria-expanded={isMenuOpen}
            >
                <Menu className="w-5 h-5 text-gray-700" />
            </button>

            {isMenuOpen && (
                <div className="absolute left-4 top-12 w-48 bg-white border border-gray-200 rounded shadow-md z-20 py-1 overflow-hidden">
                    <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <FileText className="w-4 h-4 mr-3 text-gray-500" />
                        Open File
                    </a>
                    <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Settings className="w-4 h-4 mr-3 text-gray-500" />
                        Settings
                    </a>
                    <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <History className="w-4 h-4 mr-3 text-gray-500" />
                        History
                    </a>
                    <a href="#" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Trash2 className="w-4 h-4 mr-3 text-gray-500" />
                        Bin
                    </a>
                </div>
            )}
        </div>
    );
}