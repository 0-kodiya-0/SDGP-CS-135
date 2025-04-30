import { NavItem } from "./types";

export const navigationItems: NavItem[] = [
    {
        label: 'Product',
        href: '/product',
        children: [
            {
                label: 'Features',
                href: '/features',
                description: 'Explore our product features'
            },
            {
                label: 'Solutions',
                href: '/solutions',
                description: 'Industry-specific solutions'
            },
            {
                label: 'Integrations',
                href: '/integrations',
                description: 'Third-party app integrations'
            }
        ]
    },
    {
        label: 'Pricing',
        href: '/pricing'
    },
    {
        label: 'About Us',
        href: '/about'
    },
    {
        label: 'Download',
        href: '/download'
    },
    {
        label: 'Support',
        href: '/support',
        children: [
            {
                label: 'Documentation',
                href: '/docs',
                description: 'Learn how to use our platform'
            },
            {
                label: 'Help Center',
                href: '/help',
                description: 'Get support when you need it'
            }
        ]
    }
];