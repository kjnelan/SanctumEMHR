function BackgroundEffects() {
    return (
        <>
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-mental"></div>

        {/* Floating particles for subtle animation */}
        <div className="absolute inset-0 overflow-hidden">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
        <div className="particle particle-5"></div>
        </div>
        </>
    );
}

export default BackgroundEffects;
