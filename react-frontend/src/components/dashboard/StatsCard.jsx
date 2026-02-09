function StatsCard({ value, label, trend, gradientFrom, gradientTo, icon }) {
    const trendColor =
    trend.direction === 'up'
    ? label === 'Unbilled Appointments' ? 'text-red-600' : 'text-green-600'
    : label === 'Unbilled Appointments' ? 'text-green-600' : 'text-red-600';

    const sign = trend.direction === 'up' ? '+' : '-';

    return (
        <div className="sanctum-glass-main p-6 transform hover:scale-105 transition-all hover:shadow-3xl">
            {/* Icon + Title row */}
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                    {icon}
                </div>
                <span className="text-sm font-semibold text-gray-600">{label}</span>
            </div>
            {/* Value + Trend row */}
            <div className="flex items-baseline gap-3">
                <div className="text-3xl font-bold text-gray-800">{value}</div>
                <div className={`text-xs font-semibold flex items-center gap-1 ${trendColor}`}>
                    {trend.direction === 'up' ? '↑' : '↓'} {sign}{Math.abs(trend.change)} {trend.label}
                </div>
            </div>
        </div>
    );
}

export default StatsCard;
