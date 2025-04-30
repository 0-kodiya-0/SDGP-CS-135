import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { SectionTitle } from './SectionTitle';
import { timelineData } from './about.data';
import { TimelineItem } from './Timeline';


export function Timeline() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(timelineRef, { once: true, margin: "-100px 0px" });
  
  return (
    <section className="mb-20">
      <SectionTitle title="Project Timeline" />
      
      <div
        className="relative max-w-5xl mx-auto"
        ref={timelineRef}
      >
        {/* Center line with animated drawing effect */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-transparent transform -translate-x-1/2">
          <motion.div 
            className="h-full w-full bg-gray-200"
            initial={{ height: 0 }}
            animate={isInView ? { height: "100%" } : { height: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </div>
        
        {/* Timeline items */}
        {timelineData.map((item, index) => (
          <TimelineItem 
            key={index} 
            item={item} 
            index={index} 
            inView={isInView} 
          />
        ))}
      </div>
    </section>
  );
}