function AppointmentsList({ todaysAppointments, onAppointmentClick }) {
    return (
        <div className="lg:col-span-2">
        <div className="card-main">
        <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-800">
        Today&apos;s Appointments ({todaysAppointments.length})
        </h3>
        </div>

        <div className="space-y-3">
        {todaysAppointments.map((appt, idx) => (
            <div
            key={idx}
            onClick={() => onAppointmentClick && onAppointmentClick(appt)}
            className={`${
                appt.isNext
                ? 'backdrop-blur-2xl bg-gradient-to-r from-blue-500/40 to-purple-500/40 border-white/60'
                : 'backdrop-blur-xl bg-white/60'
            } rounded-2xl p-5 border-2 ${
                appt.isNext ? 'border-blue-400' : 'border-transparent'
            } cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02]`}
            >
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
            {appt.isNext && (
                <div className="w-12 h-12 bg-white/90 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                </div>
            )}
            <div>
            {appt.isNext && (
                <p className="text-xs font-bold text-white/90 mb-1">
                NEXT UP • {appt.minutesUntil} minutes
                </p>
            )}
            <p className={`text-lg font-bold ${appt.isNext ? 'text-white' : 'text-gray-800'}`}>
            {appt.time} • {appt.client}
            </p>
            <p className={`text-sm mt-1 ${appt.isNext ? 'text-white/80' : 'text-gray-600'}`}>
            {appt.type} • {appt.duration}
            {appt.room && ` • ${appt.room}`}
            {appt.participants && ` • ${appt.participants}`}
            </p>
            </div>
            </div>
            {appt.isNext && (
                <button className="px-4 py-2 bg-white/90 hover:bg-white text-blue-600 font-semibold rounded-xl transition-all shadow-md hover:shadow-lg text-sm">
                View Details
                </button>
            )}
            </div>
            </div>
        ))}
        </div>
        </div>
        </div>
    );
}

export default AppointmentsList;
