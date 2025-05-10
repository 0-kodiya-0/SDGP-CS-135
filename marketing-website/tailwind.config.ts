import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import tailwindcssTypography from "@tailwindcss/typography";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
    	extend: {
    		colors: {
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			'blue-accent': 'var(--blue-accent)',
    			'blue-accent-hover': 'var(--blue-accent-hover)',
    			'card-hover': 'var(--card-hover)',
    			'card-background': 'var(--card-background)',
    			'border-color': 'var(--border-color)',
    			'dot-color': 'var(--dot-color)',
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			}
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		keyframes: {
    			'accordion-down': {
    				from: {
    					height: '0'
    				},
    				to: {
    					height: 'var(--radix-accordion-content-height)'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--radix-accordion-content-height)'
    				},
    				to: {
    					height: '0'
    				}
    			},
    			blink: {
    				'0%, 100%': {
    					opacity: '1'
    				},
    				'50%': {
    					opacity: '0'
    				}
    			},
    			marquee: {
    				from: {
    					transform: 'translateX(0)'
    				},
    				to: {
    					transform: 'translateX(calc(-100% - var(--gap)))'
    				}
    			},
    			'marquee-vertical': {
    				from: {
    					transform: 'translateY(0)'
    				},
    				to: {
    					transform: 'translateY(calc(-100% - var(--gap)))'
    				}
    			},
                'bounce-once': {
                    '0%, 100%': {
                        transform: 'translateY(0)'
                    },
                    '50%': {
                        transform: 'translateY(-25%)'
                    }
                },
                'slide-in-from-top': {
                    from: {
                        transform: 'translateY(-100%)',
                        opacity: '0'
                    },
                    to: {
                        transform: 'translateY(0)',
                        opacity: '1'
                    }
                },
                'slide-in-from-bottom': {
                    from: {
                        transform: 'translateY(100%)',
                        opacity: '0'
                    },
                    to: {
                        transform: 'translateY(0)',
                        opacity: '1'
                    }
                },
                'slide-in-from-left': {
                    from: {
                        transform: 'translateX(-100%)',
                        opacity: '0'
                    },
                    to: {
                        transform: 'translateX(0)',
                        opacity: '1'
                    }
                },
                'slide-in-from-right': {
                    from: {
                        transform: 'translateX(100%)',
                        opacity: '0'
                    },
                    to: {
                        transform: 'translateX(0)',
                        opacity: '1'
                    }
                },
                'fade-in': {
                    from: {
                        opacity: '0'
                    },
                    to: {
                        opacity: '1'
                    }
                },
                'scale-in': {
                    from: {
                        transform: 'scale(0.8)',
                        opacity: '0'
                    },
                    to: {
                        transform: 'scale(1)',
                        opacity: '1'
                    }
                },
                'gradient-x': {
                    '0%, 100%': {
                        'background-size': '200% 200%',
                        'background-position': 'left center'
                    },
                    '50%': {
                        'background-size': '200% 200%',
                        'background-position': 'right center'
                    }
                }
    		},
    		typography: {
    			DEFAULT: {
    				css: {
    					color: 'hsl(var(--foreground))',
    					maxWidth: '65ch'
    				}
    			}
    		},
    		fontFamily: {
    			sans: [
    				'var(--font-inter)',
    				'system-ui',
    				'sans-serif'
    			]
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out',
    			marquee: 'marquee var(--duration) infinite linear',
    			'marquee-vertical': 'marquee-vertical var(--duration) linear infinite',
                'bounce-once': 'bounce-once 0.5s ease-in-out',
                'slide-in-from-top': 'slide-in-from-top 0.5s ease-out',
                'slide-in-from-bottom': 'slide-in-from-bottom 0.5s ease-out',
                'slide-in-from-left': 'slide-in-from-left 0.5s ease-out',
                'slide-in-from-right': 'slide-in-from-right 0.5s ease-out',
                'fade-in': 'fade-in 0.5s ease-out',
                'scale-in': 'scale-in 0.5s ease-out',
                'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'gradient-x': 'gradient-x 8s ease infinite'
    		}
    	}
    },
	plugins: [tailwindcssAnimate, tailwindcssTypography],
} satisfies Config;
