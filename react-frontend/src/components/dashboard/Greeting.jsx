function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
}

function Greeting() {
    return (
        <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">{getGreeting()}!</h2>
        <p className="text-gray-600">Here&apos;s what&apos;s happening today.</p>
        </div>
    );
}

export default Greeting;
