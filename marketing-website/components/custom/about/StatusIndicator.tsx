import { motion } from 'framer-motion';
import { TimelineItem } from './about.types';


interface StatusIndicatorProps {
  status: TimelineItem['status'];
  inView: boolean;
}

export function StatusIndicator({ status, inView }: StatusIndicatorProps) {
  const circle = {
    hidden: { scale: 0 },
    visible: { 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        delay: 0.3
      } 
    }
  };

  const check = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: { 
      pathLength: 1, 
      opacity: 1,
      transition: { 
        duration: 0.3, 
        delay: 0.5 
      } 
    }
  };

  if (status === "completed") {
    return (
      <motion.div 
        className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center z-10"
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={circle}
      >
        <motion.svg 
          width="15" 
          height="15" 
          viewBox="0 0 15 15" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path 
            d="M3 7.5L6 10.5L12 4.5" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            variants={check}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          />
        </motion.svg>
      </motion.div>
    );
  } else if (status === "current") {
    return (
      <motion.div 
        className="h-6 w-6 rounded-full bg-blue-500 border-2 border-white z-10"
        initial={{ scale: 0 }}
        animate={inView ? { scale: 1 } : { scale: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 20,
          delay: 0.3
        }}
      />
    );
  } else {
    return (
      <motion.div 
        className="h-6 w-6 rounded-full border-2 border-gray-300 bg-white z-10"
        initial={{ scale: 0 }}
        animate={inView ? { scale: 1 } : { scale: 0 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 20,
          delay: 0.3
        }}
      />
    );
  }
}