import ContentContainer from "@/layouts/ContentContainer";
import PageLayout from "@/layouts/PageLayout";
import GridCell from "../shared/GridCell";
import { FeatureSummaryProps } from "./feature.types";
import FeatureCard from "./FeatureCard";
import features from "./feature.data";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const FeatureSummary: React.FC<FeatureSummaryProps> = ({ className = '' }) => {
    return (
        <PageLayout className={className}>
            <ContentContainer>
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Features Grid */}
                    <div className="relative mb-16">
                        {/* Grid Background Pattern */}
                        <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pointer-events-none">
                            {[...Array(9)].map((_, i) => (
                                <div key={i} className="border border-blue-500/5" />
                            ))}
                        </div>

                        {/* Content Grid */}
                        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {features.map((feature, index) => (
                                <GridCell
                                    key={index}
                                    hasMarker={true}
                                    markerPosition={index % 2 === 0 ? 'top-left' : 'bottom-right'}
                                    className="h-full"
                                >
                                    <div className="p-2">
                                        <FeatureCard {...feature} animationDelay={index * 0.1} />
                                    </div>
                                </GridCell>
                            ))}
                        </div>
                    </div>

                    {/* Centered Button */}
                    <div className="flex justify-center">
                        <Link
                            href="/product"
                            className="inline-flex items-center gap-2 px-6 py-3 text-lg font-medium text-white bg-blue-accent hover:bg-blue-accent-hover rounded-lg transition-colors group"
                        >
                            View All Features
                            <ArrowRight
                                size={20}
                                className="transform transition-transform group-hover:translate-x-1"
                            />
                        </Link>
                    </div>
                </div>
            </ContentContainer>
        </PageLayout>
    );
};

export default FeatureSummary;