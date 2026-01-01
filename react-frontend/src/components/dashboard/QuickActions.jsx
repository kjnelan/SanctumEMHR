function QuickActions({ onNewClient, onNewAppointment }) {
    return (
        <div className="card-main">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="space-y-3">
        <button onClick={onNewAppointment} className="btn-action btn-primary">
        + New Appointment
        </button>
        <button onClick={onNewClient} className="btn-action btn-success">
        + Add New Client
        </button>
        </div>
        </div>
    );
}

export default QuickActions;
