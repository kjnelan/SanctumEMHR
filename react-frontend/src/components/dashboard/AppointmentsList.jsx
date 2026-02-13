function AppointmentsList({ todaysAppointments, onAppointmentClick }) {
    return (
        <div className="sanctum-glass-main p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800">
                    Today&apos;s Appointments ({todaysAppointments.length})
                </h3>
            </div>

            {todaysAppointments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>No appointments scheduled for today</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {todaysAppointments.map((appt, idx) => (
                        <div
                            key={idx}
                            onClick={() => onAppointmentClick && onAppointmentClick(appt)}
                            className="sanctum-glass-card rounded-2xl p-5 border-2 border-transparent cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50/50 rounded-xl flex items-center justify-center shadow-sm">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-gray-800">
                                        {appt.time} • {appt.client}
                                    </p>
                                    <p className="text-sm mt-1 text-gray-600">
                                        {appt.type} • {appt.duration}
                                        {appt.room && ` • ${appt.room}`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default AppointmentsList;
