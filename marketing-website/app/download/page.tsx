"use client"

// app/download/page.tsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Download,
    CheckCircle,
    ArrowRight,
    Code,
    Terminal,
    HelpCircle
} from 'lucide-react';
import { 
    FaWindows, 
    FaApple, 
    FaLinux, 
    FaGlobe
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import ContentContainer from '@/layouts/ContentContainer';
import PageLayout from '@/layouts/PageLayout';

// Animated Download Header Component
const AnimatedDownloadHeader = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);
  
  // Text animation variants
  const headingVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };
  
  // Character animation for the title
  const titleText = "Download FusionSpace";
  const titleVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };
  
  // Download icon animation
  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.8
      }
    },
    hover: {
      scale: 1.1,
      y: [0, -5, 0],
      transition: {
        y: {
          repeat: Infinity,
          duration: 1,
          ease: "easeInOut"
        }
      }
    }
  };
  
  return (
    <div className="relative flex flex-col items-center justify-center py-16 overflow-hidden">
      {/* Background styling */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-950/20 dark:to-transparent"></div>
      
      {/* Main title with letter animation and matching gradient from About page */}
      <motion.h1
        className="text-4xl md:text-5xl lg:text-6xl font-sans font-extrabold text-center mb-6 flex flex-wrap justify-center relative bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500"
        variants={titleVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
      >
        {titleText.split('').map((char, index) => (
          <motion.span key={index} variants={letterVariants} className="inline-block">
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </motion.h1>
      
      {/* Animated download icon */}
      <motion.div
        className="mb-8 relative"
        variants={iconVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        whileHover="hover"
      >
        <div className="bg-blue-500 text-white p-4 rounded-full shadow-lg">
          <Download className="w-8 h-8" />
        </div>
      </motion.div>
      
      {/* Subtitle */}
      <motion.p
        className="font-sans text-xl text-muted-foreground max-w-2xl mx-auto text-center relative"
        variants={headingVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
      >
        Get started with FusionSpace on your platform of choice and transform your workspace.
      </motion.p>
    </div>
  );
};

// Types for version data
interface VersionInfo {
    version: string;
    releaseDate: string;
    isLatest?: boolean;
    changelog: string[];
    downloadLinks: {
        windows: string;
        mac: string;
        linux: string;
        web: string;
    };
    minRequirements: {
        windows: string;
        mac: string;
        linux: string;
    };
}

interface PlatformInfo {
    name: string;
    icon: React.ReactNode;
    description: string;
    primaryButton: {
        text: string;
        link: string;
    };
    secondaryButton?: {
        text: string;
        link: string;
    };
    features: string[];
}

export default function DownloadPage() {
    const [selectedVersion, setSelectedVersion] = React.useState<string>('1.5.0');
    const [selectedPlatform, setSelectedPlatform] = React.useState<string>('all');

    // Version information
    const versions: VersionInfo[] = [
        {
            version: '1.5.0',
            releaseDate: 'February 15, 2025',
            isLatest: true,
            changelog: [
                'Introduced AI summarization for documents',
                'Enhanced real-time collaboration features',
                'Added new themes and UI customization options',
                'Fixed issues with third-party app integration'
            ],
            downloadLinks: {
                windows: '#windows-1.5.0',
                mac: '#mac-1.5.0',
                linux: '#linux-1.5.0',
                web: 'https://app.fusionspace.dev'
            },
            minRequirements: {
                windows: 'Windows 10 or later, 4GB RAM, 500MB disk space',
                mac: 'macOS 11.0 or later, 4GB RAM, 500MB disk space',
                linux: 'Ubuntu 20.04, Debian 10, or equivalent, 4GB RAM, 500MB disk space'
            }
        },
        {
            version: '1.4.2',
            releaseDate: 'January 10, 2025',
            changelog: [
                'Security patches and bug fixes',
                'Improved performance for large files',
                'Updated third-party app integrations'
            ],
            downloadLinks: {
                windows: '#windows-1.4.2',
                mac: '#mac-1.4.2',
                linux: '#linux-1.4.2',
                web: 'https://app.fusionspace.dev'
            },
            minRequirements: {
                windows: 'Windows 10 or later, 4GB RAM, 500MB disk space',
                mac: 'macOS 11.0 or later, 4GB RAM, 500MB disk space',
                linux: 'Ubuntu 20.04, Debian 10, or equivalent, 4GB RAM, 500MB disk space'
            }
        },
        {
            version: '1.4.0',
            releaseDate: 'December 5, 2024',
            changelog: [
                'Added advanced file management features',
                'Introduced custom environment templates',
                'Improved cross-platform compatibility',
                'Enhanced user interface for better navigation'
            ],
            downloadLinks: {
                windows: '#windows-1.4.0',
                mac: '#mac-1.4.0',
                linux: '#linux-1.4.0',
                web: 'https://app.fusionspace.dev'
            },
            minRequirements: {
                windows: 'Windows 10 or later, 4GB RAM, 500MB disk space',
                mac: 'macOS 11.0 or later, 4GB RAM, 500MB disk space',
                linux: 'Ubuntu 20.04, Debian 10, or equivalent, 4GB RAM, 500MB disk space'
            }
        }
    ];

    // Platform information with updated, more realistic icons
    const platforms: PlatformInfo[] = [
        {
            name: 'Windows',
            icon: <FaWindows className="h-10 w-10 text-[#0078D7]" />, // Windows blue color
            description: 'Native desktop experience for Windows 10 and 11 with full feature support.',
            primaryButton: {
                text: 'Download for Windows',
                link: versions.find(v => v.isLatest)?.downloadLinks.windows || '#',
            },
            secondaryButton: {
                text: 'Get from Microsoft Store',
                link: 'https://microsoft.com/store',
            },
            features: [
                'Optimized for Windows 10 and 11',
                'System-level integration',
                'Automatic updates',
                'Windows Hello authentication support'
            ]
        },
        {
            name: 'macOS',
            icon: <FaApple className="h-10 w-10 text-[#999999]" />, // Apple silver/gray color
            description: 'Designed for macOS with Apple Silicon and Intel processor support.',
            primaryButton: {
                text: 'Download for Mac',
                link: versions.find(v => v.isLatest)?.downloadLinks.mac || '#',
            },
            secondaryButton: {
                text: 'Get from App Store',
                link: 'https://apps.apple.com',
            },
            features: [
                'Universal binary for Apple Silicon and Intel',
                'macOS design guidelines compliant',
                'TouchID integration',
                'Optimized for macOS Ventura and later'
            ]
        },
        {
            name: 'Linux',
            icon: <FaLinux className="h-10 w-10 text-[#FCC624]" />, // Linux yellow/black color
            description: 'Available for major Linux distributions with comprehensive feature support.',
            primaryButton: {
                text: 'Download for Linux',
                link: versions.find(v => v.isLatest)?.downloadLinks.linux || '#',
            },
            secondaryButton: {
                text: 'Get installation scripts',
                link: '#linux-installation',
            },
            features: [
                'AppImage, DEB and RPM packages',
                'Wayland and X11 support',
                'CLI tools integration',
                'Sandboxed application environment'
            ]
        },
        {
            name: 'Web App',
            icon: <FaGlobe className="h-10 w-10 text-[#4285F4]" />, // Web blue color
            description: 'Use FusionSpace directly in your browser with no installation required.',
            primaryButton: {
                text: 'Launch Web App',
                link: 'https://app.fusionspace.dev',
            },
            features: [
                'No installation required',
                'Access from any device with a modern browser',
                'Automatic updates',
                'Progressive Web App capabilities'
            ]
        }
    ];

    // Get the current selected version info
    const currentVersion = versions.find(v => v.version === selectedVersion) || versions[0];

    // Filter platforms based on selection
    const filteredPlatforms = selectedPlatform === 'all'
        ? platforms
        : platforms.filter(p => p.name.toLowerCase() === selectedPlatform);

    return (
        <PageLayout fullHeight className="py-16 font-sans">
            <ContentContainer>
                {/* Animated Header section */}
                <AnimatedDownloadHeader />

                {/* Platform selector */}
                <div className="mt-8 text-center mb-16">
                    <div className="inline-flex items-center p-1 bg-secondary rounded-lg">
                        <button
                            onClick={() => setSelectedPlatform('all')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedPlatform === 'all'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-foreground/70 hover:text-foreground'
                                }`}
                        >
                            All Platforms
                        </button>

                        {platforms.map(platform => (
                            <button
                                key={platform.name}
                                onClick={() => setSelectedPlatform(platform.name.toLowerCase())}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${selectedPlatform === platform.name.toLowerCase()
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-foreground/70 hover:text-foreground'
                                    }`}
                            >
                                {platform.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Platform cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    {filteredPlatforms.map((platform) => (
                        <div
                            key={platform.name}
                            className="rounded-lg border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="p-6">
                                <div className="flex items-center gap-4 mb-4">
                                    {platform.icon}
                                    <h3 className="text-xl font-bold font-sans">{platform.name}</h3>
                                </div>

                                <p className="text-muted-foreground mb-4 font-sans">{platform.description}</p>

                                <div className="mb-6">
                                    <h4 className="font-medium mb-3 font-sans">Features:</h4>
                                    <ul className="space-y-2">
                                        {platform.features.map((feature, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-sm font-sans">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <Link
                                        href={platform.primaryButton.link}
                                        className="bg-blue-accent hover:bg-blue-accent-hover text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 font-sans"
                                    >
                                        <Download className="h-4 w-4" />
                                        {platform.primaryButton.text}
                                    </Link>

                                    {platform.secondaryButton && (
                                        <Link
                                            href={platform.secondaryButton.link}
                                            className="bg-secondary hover:bg-secondary/80 text-foreground px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 font-sans"
                                        >
                                            <ArrowRight className="h-4 w-4" />
                                            {platform.secondaryButton.text}
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Version selector */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-6 text-center font-sans">Available Versions</h2>

                    <div className="max-w-4xl mx-auto">
                        <div className="flex flex-wrap gap-2 mb-8 justify-center">
                            {versions.map((version) => (
                                <button
                                    key={version.version}
                                    onClick={() => setSelectedVersion(version.version)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors font-sans ${selectedVersion === version.version
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                                        }`}
                                >
                                    {version.version}
                                    {version.isLatest && (
                                        <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                                            Latest
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="bg-card border border-border rounded-lg p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold font-sans">Version {currentVersion.version}</h3>
                                    <p className="text-muted-foreground font-sans">Released on {currentVersion.releaseDate}</p>
                                </div>

                                <Link
                                    href="/support/changelog"
                                    className="text-blue-accent hover:text-blue-accent-hover text-sm font-medium flex items-center gap-1 font-sans"
                                >
                                    View full changelog
                                    <ArrowRight className="h-3 w-3" />
                                </Link>
                            </div>

                            <div className="mb-6">
                                <h4 className="font-medium mb-3 font-sans">{`What's New:`}</h4>
                                <ul className="space-y-2">
                                    {currentVersion.changelog.map((item, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span className="text-sm font-sans">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mb-6">
                                <h4 className="font-medium mb-3 font-sans">System Requirements:</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-secondary/30 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FaWindows className="h-4 w-4 text-[#0078D7]" />
                                            <span className="font-medium font-sans">Windows</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground font-sans">{currentVersion.minRequirements.windows}</p>
                                    </div>

                                    <div className="bg-secondary/30 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FaApple className="h-4 w-4 text-[#999999]" />
                                            <span className="font-medium font-sans">macOS</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground font-sans">{currentVersion.minRequirements.mac}</p>
                                    </div>

                                    <div className="bg-secondary/30 p-4 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FaLinux className="h-4 w-4 text-[#FCC624]" />
                                            <span className="font-medium font-sans">Linux</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground font-sans">{currentVersion.minRequirements.linux}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href={currentVersion.downloadLinks.windows}
                                    className="bg-secondary hover:bg-secondary/80 text-foreground px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 font-sans"
                                >
                                    <FaWindows className="h-4 w-4 text-[#0078D7]" />
                                    Windows (.exe)
                                </Link>

                                <Link
                                    href={currentVersion.downloadLinks.mac}
                                    className="bg-secondary hover:bg-secondary/80 text-foreground px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 font-sans"
                                >
                                    <FaApple className="h-4 w-4 text-[#999999]" />
                                    macOS (.dmg)
                                </Link>

                                <Link
                                    href={currentVersion.downloadLinks.linux}
                                    className="bg-secondary hover:bg-secondary/80 text-foreground px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 font-sans"
                                >
                                    <FaLinux className="h-4 w-4 text-[#FCC624]" />
                                    Linux (.AppImage)
                                </Link>

                                <Link
                                    href={currentVersion.downloadLinks.web}
                                    className="bg-secondary hover:bg-secondary/80 text-foreground px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 font-sans"
                                >
                                    <FaGlobe className="h-4 w-4 text-[#4285F4]" />
                                    Web App
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Advanced installation section */}
                <div className="mb-16" id="linux-installation">
                    <h2 className="text-2xl font-bold mb-6 text-center font-sans">Advanced Installation Options</h2>

                    <div className="max-w-4xl mx-auto bg-card border border-border rounded-lg p-6">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold mb-2 font-sans">Using Package Managers</h3>
                            <p className="text-muted-foreground mb-4 font-sans">
                                FusionSpace can be installed using popular package managers for easier updates and dependencies management.
                            </p>

                            <div className="space-y-4">
                                <div className="bg-black rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Terminal className="h-4 w-4 text-white" />
                                        <span className="font-medium text-white font-sans">Homebrew (macOS)</span>
                                    </div>
                                    <code className="text-green-400 text-sm font-mono block">
                                        brew install fusionspace
                                    </code>
                                </div>

                                <div className="bg-black rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Terminal className="h-4 w-4 text-white" />
                                        <span className="font-medium text-white font-sans">APT (Ubuntu/Debian)</span>
                                    </div>
                                    <code className="text-green-400 text-sm font-mono block">
                                        sudo apt update<br />
                                        sudo apt install fusionspace
                                    </code>
                                </div>

                                <div className="bg-black rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Terminal className="h-4 w-4 text-white" />
                                        <span className="font-medium text-white font-sans">Snap (Cross-platform)</span>
                                    </div>
                                    <code className="text-green-400 text-sm font-mono block">
                                        sudo snap install fusionspace
                                    </code>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold mb-2 font-sans">Manual Installation</h3>
                            <p className="text-muted-foreground mb-4 font-sans">
                                For environments where automatic installation is not possible, you can download and install the application manually.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Link
                                    href="#download-archive"
                                    className="bg-secondary hover:bg-secondary/80 text-foreground p-4 rounded-md font-medium transition-colors flex items-center gap-3 font-sans"
                                >
                                    <Code className="h-5 w-5" />
                                    <div>
                                        <div className="font-medium font-sans">Download Source Archive</div>
                                        <div className="text-sm text-muted-foreground font-sans">For custom builds (.tar.gz)</div>
                                    </div>
                                </Link>

                                <Link
                                    href="/support/installation-guide"
                                    className="bg-secondary hover:bg-secondary/80 text-foreground p-4 rounded-md font-medium transition-colors flex items-center gap-3 font-sans"
                                >
                                    <HelpCircle className="h-5 w-5" />
                                    <div>
                                        <div className="font-medium font-sans">Installation Guide</div>
                                        <div className="text-sm text-muted-foreground font-sans">Detailed instructions for all platforms</div>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Support links */}
                <div>
                    <h2 className="text-2xl font-bold mb-6 text-center font-sans">Need Help?</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <Link
                            href="/support"
                            className="bg-card hover:bg-card-hover border border-border rounded-lg p-6 transition-colors text-center"
                        >
                            <HelpCircle className="h-8 w-8 mx-auto mb-3" />
                            <h3 className="font-bold mb-1 font-sans">Support Documentation</h3>
                            <p className="text-sm text-muted-foreground font-sans">
                                Find guides, tutorials, and troubleshooting information.
                            </p>
                        </Link>

                        <Link
                            href="/support/system-requirements"
                            className="bg-card hover:bg-card-hover border border-border rounded-lg p-6 transition-colors text-center"
                        >
                            <CheckCircle className="h-8 w-8 mx-auto mb-3" />
                            <h3 className="font-bold mb-1 font-sans">System Requirements</h3>
                            <p className="text-sm text-muted-foreground font-sans">
                                Make sure your system meets the requirements.
                            </p>
                        </Link>

                        <Link
                            href="/contact"
                            className="bg-card hover:bg-card-hover border border-border rounded-lg p-6 transition-colors text-center"
                        >
                            <div className="h-8 w-8 flex items-center justify-center mx-auto mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                            </div>
                            <h3 className="font-bold mb-1 font-sans">Contact Support</h3>
                            <p className="text-sm text-muted-foreground font-sans">
                                Get help from our support team for specific issues.
                            </p>
                        </Link>
                    </div>
                </div>
            </ContentContainer>
        </PageLayout>
    );
}