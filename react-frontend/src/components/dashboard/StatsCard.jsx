function StatsCard({ value, label, trend, gradientFrom, gradientTo, icon }) {
    const trendColor =
    trend.direction === 'up'
    ? label === 'Unbilled Appointments' ? 'text-red-600' : 'text-green-600'
    : label === 'Unbilled Appointments' ? 'text-green-600' : 'text-red-600';

    const sign = label === 'Active Clients' ? '-' : '+';

    return (
        <div className="card-main transform hover:scale-105 transition-all hover:shadow-3xl">
        <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-2xl flex items-center justify-center shadow-lg`}>
        {icon}
        </div>
        </div>
        <div className="text-4xl font-bold text-gray-800 mb-1">{value}</div>
        <div className="text-sm font-semibold text-gray-600 mb-2">{label}</div>
        <div className={`text-xs font-semibold flex items-center gap-1 ${trendColor}`}>
        {trend.direction === 'up' ? '↑' : '↓'} {sign}{trend.change} {trend.label}
        </div>
        </div>
    );
}

export default StatsCard;
