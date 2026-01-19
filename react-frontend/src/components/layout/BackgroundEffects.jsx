function BackgroundEffects() {
    return (
        <>
        <div className="absolute inset-0 bg-gradient-mental"></div>

        {/* Large decorative organic shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
          {/* Top right large blob */}
          <div
            className="absolute"
            style={{
              top: '-20%',
              right: '-10%',
              width: '50%',
              height: '60%',
              background: 'rgba(107, 154, 196, 0.15)',
              borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
              filter: 'blur(40px)',
            }}
          />

          {/* Bottom left large blob */}
          <div
            className="absolute"
            style={{
              bottom: '-15%',
              left: '-8%',
              width: '45%',
              height: '55%',
              background: 'rgba(168, 197, 165, 0.15)',
              borderRadius: '70% 30% 30% 70% / 60% 60% 40% 40%',
              filter: 'blur(40px)',
            }}
          />

          {/* Center right accent */}
          <div
            className="absolute"
            style={{
              top: '30%',
              right: '10%',
              width: '35%',
              height: '40%',
              background: 'rgba(232, 220, 196, 0.12)',
              borderRadius: '60% 40% 30% 70% / 40% 50% 50% 60%',
              filter: 'blur(50px)',
            }}
          />

          {/* Top left accent */}
          <div
            className="absolute"
            style={{
              top: '10%',
              left: '15%',
              width: '30%',
              height: '35%',
              background: 'rgba(168, 197, 165, 0.1)',
              borderRadius: '40% 60% 70% 30% / 50% 60% 40% 50%',
              filter: 'blur(45px)',
            }}
          />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 2 }}>
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
