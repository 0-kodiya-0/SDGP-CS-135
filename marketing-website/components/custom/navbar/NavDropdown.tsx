"use client"

import Link from "next/link";
import React, { useRef, useEffect } from "react";
import { NavItem } from "./types";
import { ChevronDown } from "lucide-react";

const NavDropdown = ({ item }: { item: NavItem }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Clear timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleMouseEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        // Add a delay before closing the dropdown
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 300); // 300ms delay
    };

    return (
        item.children && item.children.length > 0 ? (
            <div 
                className="relative group" 
                ref={dropdownRef}
                onMouseEnter={handleMouseEnter} 
                onMouseLeave={handleMouseLeave}
            >
                <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-foreground hover:text-blue-accent transition-colors relative">
                    {item.label}
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    
                    {/* Animated underline effect */}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-accent group-hover:w-full transition-all duration-300"></span>
                </button>

                {item.children && (
                    <div 
                        className={`absolute left-0 z-10 w-64 p-4 mt-1 space-y-2 bg-background border border-border-color rounded-lg shadow-lg transition-all duration-300 transform origin-top-left ${
                            isOpen 
                                ? 'opacity-100 scale-100 translate-y-0' 
                                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                        }`}
                    >
                        {/* Add a hidden "bridge" element to improve hover area between button and dropdown */}
                        <div className="absolute -top-2 left-0 w-full h-2 bg-transparent" />
                        
                        {item.children.map((child, index) => (
                            <Link
                                key={index}
                                href={child.href}
                                className="block p-2 text-sm hover:bg-card-hover rounded-md transition-all duration-200 hover:translate-x-1"
                            >
                                <div className="font-medium">{child.label}</div>
                                {child.description && (
                                    <div className="text-xs text-muted-foreground">{child.description}</div>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        ) : (
            <Link
                href={item.href}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-foreground hover:text-blue-accent transition-colors relative group">
                {item.label}
                
                {/* Animated underline effect */}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-accent group-hover:w-full transition-all duration-300"></span>
            </Link>
        )
    );
};

export default NavDropdown;