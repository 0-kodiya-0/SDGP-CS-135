import { motion } from "framer-motion";
import { FeatureCardProps } from "./feature.types";

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, animationDelay = 0 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: animationDelay }}
            className="h-full p-6 bg-card-background rounded-lg hover:bg-card-hover transition-colors flex flex-col"
        >
            <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 p-2 bg-blue-accent rounded-lg text-white">
                    {icon}
                </div>
                <h3 className="text-xl font-semibold line-clamp-2">{title}</h3>
            </div>
            <p className="text-muted-foreground">{description}</p>
        </motion.div>
    );
};

export default FeatureCard;