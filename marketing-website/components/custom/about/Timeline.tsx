import { motion } from 'framer-motion';
import { StatusIndicator } from './StatusIndicator';
import type  {TimelineItem} from './about.types'
interface TimelineItemProps {
  item: TimelineItem;
  index: number;
  inView: boolean;
}

export function TimelineItem({ item, index, inView }: TimelineItemProps) {
  const xOffset = item.position === "left" ? -20 : item.position === "right" ? 20 : 0;
  
  const itemAnimation = {
    hidden: { opacity: 0, x: xOffset },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.6,
        delay: index * 0.2 + 0.3,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div 
      className="relative mb-24 last:mb-0"
      variants={itemAnimation}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      <div className="flex items-center justify-center absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <StatusIndicator status={item.status} inView={inView} />
      </div>
      
      {item.position === "center" ? (
        // Centered item (Project Completion)
        <div className="flex flex-col items-center text-center">
          <div className="mt-8 w-full">
            <h3 className="text-xl font-semibold mb-1">{item.phase}</h3>
            <p className="text-sm text-gray-500">{item.date}</p>
          </div>
        </div>
      ) : (
        // Left or right positioned items
        <div className={`flex ${item.position === "left" ? "flex-row-reverse" : "flex-row"} items-start`}>
          {/* Content side */}
          <div className={`w-1/2 ${item.position === "left" ? "pr-16 text-right" : "pl-16"}`}>
            <h3 className="text-xl font-semibold mb-2">{item.phase}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{item.content}</p>
          </div>
          
          {/* Date side */}
          <div className={`w-1/2 ${item.position === "left" ? "pl-16" : "pr-16 text-right"}`}>
            <p className="text-sm text-gray-500">{item.date}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}