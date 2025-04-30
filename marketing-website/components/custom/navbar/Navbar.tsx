"use client"

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import MyIcon from "@/public/icons/Fusion Transparent.png";
import NavDropdown from "./NavDropdown";
import { navigationItems } from "./routes.conf";
import ThemeToggle from "./ThemeToggle";
import Link from "next/link";
import ContentContainer from "@/layouts/ContentContainer";
import PageLayout from "@/layouts/PageLayout";
import UnderConstructionBanner from "../stats/UnderConstructionBanner";
import { Menu, X, ChevronDown } from "lucide-react";

const Navbar = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close mobile menu when clicking outside
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mobileMenuOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMobileMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [mobileMenuOpen]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    // Toggle mobile submenu
    const toggleSubmenu = (href: string) => {
        setExpandedItems(prev => 
            prev.includes(href) 
                ? prev.filter(item => item !== href) 
                : [...prev, href]
        );
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex flex-col">
            {/* Banner outside of nav element */}
            <UnderConstructionBanner showDismissButton />

            {/* Main navigation */}
            <nav className={`h-16 bg-background/80 backdrop-blur-sm border-b border-border/40 transition-all duration-300 ${scrolled ? 'shadow-md' : ''}`}>
                <PageLayout>
                    <ContentContainer className="h-full">
                        <div className="flex h-full items-center justify-between">
                            {/* Left section - Logo */}
                            <div className="flex items-center">
                                <Link
                                    href="/"
                                    className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:text-blue-accent transition-colors"
                                    aria-label="FusionSpace Home"
                                >
                                    <div className="relative h-10 w-10 transform hover:scale-110 transition-transform duration-300">
                                        <Image
                                            src={MyIcon.src}
                                            alt="FusionSpace Logo"
                                            fill
                                            sizes="40px"
                                            priority
                                            className="object-contain"
                                        />
                                    </div>
                                </Link>
                            </div>

                            {/* Center section - Navigation (Desktop) */}
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                                <div className="flex items-center space-x-2">
                                    {navigationItems.map((item) => (
                                        <NavDropdown key={item.href} item={item} />
                                    ))}
                                </div>
                            </div>

                            {/* Right section */}
                            <div className="flex items-center space-x-4">
                                <ThemeToggle />
                                <Link
                                    href="/signin"
                                    className="hidden sm:inline-block text-sm font-medium text-foreground hover:text-blue-accent transition-colors hover:scale-105 transform duration-300"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/signup"
                                    className="hidden sm:inline-block rounded-md bg-blue-accent px-4 py-2 text-sm font-medium text-white hover:bg-blue-accent-hover transition-all shadow-sm hover:shadow-md hover:scale-105 transform duration-300"
                                >
                                    Sign up
                                </Link>
                                
                                {/* Mobile menu button */}
                                <button 
                                    className="md:hidden rounded-md p-2 text-foreground hover:bg-secondary transition-colors"
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                                >
                                    {mobileMenuOpen ? (
                                        <X className="h-6 w-6" />
                                    ) : (
                                        <Menu className="h-6 w-6" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </ContentContainer>
                </PageLayout>
            </nav>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div 
                    ref={menuRef}
                    className="md:hidden fixed inset-0 top-16 z-40 bg-background/95 backdrop-blur-sm animate-in slide-in-from-top duration-300"
                >
                    <div className="p-4 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
                        <nav className="space-y-6 py-6">
                            {navigationItems.map((item) => (
                                <div key={item.href} className="space-y-3">
                                    {item.children && item.children.length > 0 ? (
                                        <>
                                            <button 
                                                onClick={() => toggleSubmenu(item.href)}
                                                className="flex items-center justify-between w-full text-lg font-medium text-foreground hover:text-blue-accent transition-colors"
                                            >
                                                <span>{item.label}</span>
                                                <ChevronDown 
                                                    className={`w-5 h-5 transition-transform duration-300 ${
                                                        expandedItems.includes(item.href) ? 'rotate-180' : ''
                                                    }`} 
                                                />
                                            </button>
                                            
                                            <div 
                                                className={`pl-4 space-y-2 border-l-2 border-border overflow-hidden transition-all duration-300 ${
                                                    expandedItems.includes(item.href) 
                                                        ? 'max-h-96 opacity-100' 
                                                        : 'max-h-0 opacity-0'
                                                }`}
                                            >
                                                {item.children.map((child, index) => (
                                                    <Link
                                                        key={index}
                                                        href={child.href}
                                                        className="block py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                                        onClick={() => setMobileMenuOpen(false)}
                                                    >
                                                        {child.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <Link 
                                            href={item.href}
                                            className="block text-lg font-medium text-foreground hover:text-blue-accent transition-colors"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            {item.label}
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </nav>
                        
                        <div className="flex flex-col space-y-3 pt-6 border-t border-border">
                            <Link
                                href="/signin"
                                className="w-full py-3 text-center text-sm font-medium text-foreground hover:text-blue-accent transition-colors border border-border rounded-md"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Sign in
                            </Link>
                            <Link
                                href="/signup"
                                className="w-full py-3 text-center rounded-md bg-blue-accent text-sm font-medium text-white hover:bg-blue-accent-hover transition-colors shadow-sm"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Sign up
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}

export default Navbar;