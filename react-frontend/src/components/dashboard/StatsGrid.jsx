import StatsCard from './StatsCard';

function StatsGrid({ stats, onNewClient, onNewAppointment }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {/* Quick Actions Card - First position */}
            <div className="sanctum-glass-main p-6 transform hover:scale-105 transition-all hover:shadow-3xl">
                {/* Icon + Title row */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-700 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-600">Quick Actions</span>
                </div>
                {/* Action buttons */}
                <div className="space-y-2">
                    <button
                        onClick={onNewAppointment}
                        className="btn-action p-6 bg-blue-500 hover:bg-blue-600"
                    >
                        + New Appointment
                    </button>
                    <button
                        onClick={onNewClient}
                        className="btn-action p-6 bg-green-500 hover:bg-green-600"
                    >
                        + Add New Client
                    </button>
                </div>
            </div>

            <StatsCard
                value={stats.todayAppointments.value}
                label="Today's Appointments"
                trend={stats.todayAppointments.trend}
                gradientFrom="from-blue-400"
                gradientTo="to-blue-600"
                icon={
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                }
            />

            <StatsCard
                value={stats.unbilledAppointments.value}
                label="Unbilled Appointments"
                trend={stats.unbilledAppointments.trend}
                gradientFrom="from-amber-400"
                gradientTo="to-orange-600"
                icon={
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                }
            />

            <StatsCard
                value={stats.sessionsYTD.value}
                label="Sessions This Year"
                trend={stats.sessionsYTD.trend}
                gradientFrom="from-green-400"
                gradientTo="to-emerald-600"
                icon={
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                }
            />

            <StatsCard
                value={stats.activeClients.value}
                label="Active Clients"
                trend={stats.activeClients.trend}
                gradientFrom="from-purple-400"
                gradientTo="to-purple-600"
                icon={
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                }
            />
        </div>
    );
}

export default StatsGrid;
