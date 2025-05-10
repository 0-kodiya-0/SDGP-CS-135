export interface FeatureCardProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
    animationDelay?: number;
}

export interface FeatureSummaryProps {
    className?: string;
    features?: FeatureCardProps[];
}