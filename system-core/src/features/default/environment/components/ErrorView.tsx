import { AlertTriangle } from "lucide-react";
import { ErrorViewProps } from "../types/props.ts";

export const ErrorView = ({ getSliderStyle, onClick, error }: ErrorViewProps) => (
    <div className="fixed inset-0 z-50" onClick={onClick}>
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
        <div className="absolute left-4 right-4 bg-white shadow-sm rounded-lg" style={getSliderStyle()}>
            <div className="p-4 flex flex-col items-center gap-2">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <div className="text-red-500 text-center font-medium">Error occurred</div>
                <div className="text-gray-500 text-sm text-center">{error}</div>
            </div>
        </div>
    </div>
);