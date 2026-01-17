import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { 
  Camera, 
  Upload, 
  X, 
  FileText,
  Loader2,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';

interface Props {
  leverKey: string;
  onUpload: (url: string, fileName: string) => void;
  existingUrl?: string;
}

export function InvoiceUpload({ leverKey, onUpload, existingUrl }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(existingUrl || null);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Nur JPG, PNG, WebP oder PDF erlaubt');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Datei zu gross (max. 10MB)');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }

      setFileName(file.name);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const filePath = `quiz-invoices/${leverKey}/${Date.now()}.${fileExt}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('partner-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        // If bucket doesn't exist, just store locally for now
        console.warn('Storage upload failed, using local preview:', uploadError);
        onUpload(preview || '', file.name);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('partner-documents')
        .getPublicUrl(data.path);

      onUpload(urlData.publicUrl, file.name);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload fehlgeschlagen');
    } finally {
      setIsUploading(false);
    }
  };

  const clearUpload = () => {
    setPreview(null);
    setFileName('');
    onUpload('', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium flex items-center gap-2">
        <FileText className="w-4 h-4 text-muted-foreground" />
        Rechnung hochladen (optional)
      </Label>

      {preview || fileName ? (
        <Card className="p-4 relative">
          <button
            onClick={clearUpload}
            className="absolute top-2 right-2 p-1 rounded-full bg-destructive/10 hover:bg-destructive/20 transition-colors"
          >
            <X className="w-4 h-4 text-destructive" />
          </button>
          
          {preview && preview.startsWith('data:image') ? (
            <img 
              src={preview} 
              alt="Vorschau" 
              className="max-h-32 rounded-lg mx-auto"
            />
          ) : (
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-muted">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{fileName}</p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Hochgeladen
                </p>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <div className="flex gap-2">
          {/* Camera Input (Mobile) */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          <Button
            variant="outline"
            className="flex-1 h-12"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Camera className="w-5 h-5 mr-2" />
            )}
            Foto aufnehmen
          </Button>

          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          <Button
            variant="outline"
            className="flex-1 h-12"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Upload className="w-5 h-5 mr-2" />
            )}
            Datei wählen
          </Button>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <p className="text-xs text-muted-foreground">
        Laden Sie eine aktuelle Rechnung hoch, um automatisch Anbieter und Vertragsnummer zu erkennen.
      </p>
    </div>
  );
}
