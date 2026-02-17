const screens = [
  { path: "/", label: "Home Screen" },
  { path: "/rewards", label: "Gutscheine" },
  { path: "/partner", label: "Partner" },
  { path: "/auth", label: "Login / Onboarding" },
];

const PREVIEW_BASE = window.location.origin;

export default function MockupGalleryPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 pb-24">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">App Screens</h1>
        <p className="text-white/50 mb-10 text-sm">Live-Vorschau der echten App-Screens im iPhone-Rahmen</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
          {screens.map(({ path, label }) => (
            <div key={path} className="flex flex-col items-center gap-3">
              {/* iPhone frame */}
              <div
                className="relative"
                style={{
                  width: 200,
                  height: 432,
                  background: '#1a1a1a',
                  borderRadius: 36,
                  padding: 8,
                  boxShadow: '0 0 0 2px #3a3a3a, 0 24px 60px rgba(0,0,0,0.7), inset 0 0 0 1px #444',
                }}
              >
                {/* Notch */}
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 60,
                    height: 18,
                    background: '#1a1a1a',
                    borderRadius: 12,
                    zIndex: 10,
                  }}
                />
                {/* Screen */}
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 28,
                    overflow: 'hidden',
                    background: '#000',
                    position: 'relative',
                  }}
                >
                  <iframe
                    src={`${PREVIEW_BASE}${path}`}
                    style={{
                      width: 390,
                      height: 844,
                      border: 'none',
                      transform: 'scale(0.47)',
                      transformOrigin: 'top left',
                      pointerEvents: 'none',
                    }}
                    title={label}
                    loading="lazy"
                  />
                </div>
                {/* Side buttons */}
                <div style={{ position: 'absolute', right: -3, top: 80, width: 3, height: 30, background: '#3a3a3a', borderRadius: 2 }} />
                <div style={{ position: 'absolute', left: -3, top: 70, width: 3, height: 22, background: '#3a3a3a', borderRadius: 2 }} />
                <div style={{ position: 'absolute', left: -3, top: 100, width: 3, height: 40, background: '#3a3a3a', borderRadius: 2 }} />
                <div style={{ position: 'absolute', left: -3, top: 148, width: 3, height: 40, background: '#3a3a3a', borderRadius: 2 }} />
              </div>
              <span className="text-white/70 text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
