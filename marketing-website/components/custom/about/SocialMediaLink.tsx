import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface SocialMediaLinkProps {
  href: string;
  icon: ReactNode;
}

export function SocialMediaLink({ href, icon }: SocialMediaLinkProps) {
  return (
    <motion.a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="text-current hover:text-blue-500 transition-colors"
      whileHover={{ scale: 1.2 }}
    >
      {icon}
    </motion.a>
  );
}