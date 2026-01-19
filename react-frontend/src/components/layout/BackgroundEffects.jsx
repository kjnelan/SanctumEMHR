function BackgroundEffects() {
    return (
        <>
        <div className="absolute inset-0 bg-gradient-mental"></div>

        {/* Decorative flowing shapes using CSS */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Top right decorative blob */}
          <div
            className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, rgba(107, 154, 196, 0.4) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />

          {/* Top center wave */}
          <div
            className="absolute -top-20 left-1/4 w-[500px] h-[400px] rounded-full opacity-15"
            style={{
              background: 'radial-gradient(ellipse, rgba(168, 197, 165, 0.5) 0%, transparent 70%)',
              filter: 'blur(80px)',
              transform: 'rotate(-20deg)',
            }}
          />

          {/* Bottom left decorative blob */}
          <div
            className="absolute -bottom-40 -left-40 w-[700px] h-[700px] rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, rgba(168, 197, 165, 0.4) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />

          {/* Bottom right accent */}
          <div
            className="absolute -bottom-20 right-1/4 w-[450px] h-[350px] rounded-full opacity-15"
            style={{
              background: 'radial-gradient(ellipse, rgba(232, 220, 196, 0.5) 0%, transparent 70%)',
              filter: 'blur(70px)',
              transform: 'rotate(25deg)',
            }}
          />

          {/* Center subtle glow */}
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full opacity-10"
            style={{
              background: 'radial-gradient(ellipse, rgba(107, 154, 196, 0.3) 0%, transparent 60%)',
              filter: 'blur(100px)',
            }}
          />
        </div>

        {/* Floating particles */}
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
