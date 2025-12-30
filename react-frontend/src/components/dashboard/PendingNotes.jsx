function PendingNotes() {
    const items = [
        { age: '3 days ago', color: 'border-red-400' },
        { age: '2 days ago', color: 'border-amber-400' },
        { age: 'Yesterday', color: 'border-yellow-400' }
    ];

    return (
        <div className="card-main">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Pending Documentation</h3>
        <div className="space-y-3">
        {items.map((item, idx) => (
            <div
            key={idx}
            className={`backdrop-blur-xl bg-white/60 ${item.color} border-l-4 rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all hover:bg-white/70`}
            >
            <p className="text-sm font-semibold text-gray-800">{item.age}</p>
            <p className="text-xs text-gray-600 mt-1">Complete session note</p>
            </div>
        ))}
        </div>
        </div>
    );
}

export default PendingNotes;
