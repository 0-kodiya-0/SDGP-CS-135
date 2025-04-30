export type NavItem = {
    label: string;
    href: string;
    children?: Array<{
      label: string;
      href: string;
      description?: string;
    }>;
  };