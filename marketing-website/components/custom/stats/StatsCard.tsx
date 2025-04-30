export interface StatItemProps {
    value: string;
    label: string;
}

const StatsCard: React.FC<StatItemProps> = ({ value, label }) => (
    <div className="flex flex-col items-center justify-center px-4">
        <div className="mb-1 text-3xl font-extrabold tracking-tight text-blue-accent md:text-4xl">
            {value}
        </div>
        <div className="text-small font-medium text-muted-foreground text-center">
            {label}
        </div>
    </div>
);

export default StatsCard;