import { motion } from 'framer-motion';
import { Feature } from './about.types';
import { itemVariants } from '@/lib/animationConstants';



interface FeatureCardProps {
  feature: Feature;
}

export function AboutFeatureCard({ feature }: FeatureCardProps) {
  return (
    <motion.div 
      className="p-6 flex flex-col items-center text-center relative group bg-card border border-border rounded-lg hover:shadow-md transition-all duration-300"
      variants={itemVariants}
      whileHover={{ 
        y: -5,
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
    >
      <div className="mb-4 text-blue-500 transition-transform duration-300 group-hover:scale-110">
        {feature.icon}
      </div>
      <h3 className="font-medium text-lg mb-2">{feature.title}</h3>
      <p className="text-muted-foreground text-sm">{feature.description}</p>
    </motion.div>
  );
}