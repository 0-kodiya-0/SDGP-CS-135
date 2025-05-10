import { Loader2 } from "lucide-react";
import { LoadingViewProps } from "../types/types.props.ts";

export const LoadingView = ({ getSliderStyle }: LoadingViewProps) => (
    <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
        <div className="absolute left-4 right-4 bg-white shadow-sm rounded-lg p-4" style={getSliderStyle()}>
            <div className="flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        </div>
    </div>
);