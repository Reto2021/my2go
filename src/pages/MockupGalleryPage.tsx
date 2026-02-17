import mockupHome from "@/assets/mockup-home.jpg";
import mockupRewards from "@/assets/mockup-rewards.jpg";
import mockupQR from "@/assets/mockup-qr.jpg";
import mockupRadio from "@/assets/mockup-radio.jpg";

const mockups = [
  { src: mockupHome, label: "Home Screen", file: "mockup-home.jpg" },
  { src: mockupRewards, label: "Rewards", file: "mockup-rewards.jpg" },
  { src: mockupQR, label: "QR Code", file: "mockup-qr.jpg" },
  { src: mockupRadio, label: "Radio Player", file: "mockup-radio.jpg" },
];

export default function MockupGalleryPage() {
  const handleDownload = (src: string, filename: string) => {
    const a = document.createElement("a");
    a.href = src;
    a.download = filename;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-2">App Mockups</h1>
        <p className="text-muted-foreground mb-8">Klicke auf «Herunterladen» um die Bilder zu speichern.</p>

        <div className="grid grid-cols-2 gap-6">
          {mockups.map(({ src, label, file }) => (
            <div key={file} className="bg-card rounded-xl overflow-hidden border border-border shadow-sm">
              <img src={src} alt={label} className="w-full object-cover" />
              <div className="p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{label}</span>
                <button
                  onClick={() => handleDownload(src, file)}
                  className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Herunterladen
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
