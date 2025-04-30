import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from '@/lib/animationConstants';
import { Target, Rocket, Star } from 'lucide-react';
import { VisionPoint } from './about.types';
import { SectionTitle } from './SectionTitle';


export const visionPoints: VisionPoint[] = [
  {
    icon: <Target className="h-8 w-8 text-blue-500" />,
    title: "Our Mission",
    description: "To create an intelligent workspace that streamlines academic workflows and enhances student productivity."
  },
  {
    icon: <Rocket className="h-8 w-8 text-blue-500" />,
    title: "Our Goals",
    description: "Building a platform that adapts to individual needs while fostering collaboration and innovation in education."
  },
  {
    icon: <Star className="h-8 w-8 text-blue-500" />,
    title: "Our Values",
    description: "Committed to excellence, user privacy, and continuous improvement in educational technology."
  }
];

export function VisionSection() {
  return (
    <section className="mb-20">
      <SectionTitle title="Our Vision" />
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {visionPoints.map((point, index) => (
          <motion.div
            key={index}
            className="bg-card border border-border rounded-lg p-8 hover:shadow-lg transition-all duration-300"
            variants={itemVariants}
            whileHover={{ scale: 1.03 }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 bg-secondary/50 rounded-full p-4">
                {point.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{point.title}</h3>
              <p className="text-muted-foreground">{point.description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
      
      <motion.div 
        className="mt-12 bg-primary/5 rounded-lg p-8 text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        viewport={{ once: true }}
      >
        <p className="text-lg max-w-3xl mx-auto">
          FusionSpace aims to revolutionize how students interact with digital tools, 
          creating a seamless experience that transforms educational workflows while 
          maintaining security and efficiency.
        </p>
      </motion.div>
    </section>
  );
}