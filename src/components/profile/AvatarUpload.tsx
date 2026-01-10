import { useState, useRef } from 'react';
import { Camera, Loader2, X, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl: string | null;
  displayName: string;
  onAvatarUpdated: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function AvatarUpload({ 
  userId, 
  currentAvatarUrl, 
  displayName, 
  onAvatarUpdated 
}: AvatarUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Bitte wähle ein JPEG, PNG oder WebP Bild');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Das Bild darf maximal 5MB gross sein');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    
    try {
      // Create unique filename
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

      // Delete old avatar if exists
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      toast.success('Avatar erfolgreich aktualisiert!');
      onAvatarUpdated();
      handleClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Fehler beim Hochladen des Avatars');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!currentAvatarUrl) return;

    setIsUploading(true);
    
    try {
      // Delete from storage
      const oldPath = currentAvatarUrl.split('/avatars/')[1];
      if (oldPath) {
        await supabase.storage.from('avatars').remove([oldPath]);
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Avatar entfernt');
      onAvatarUpdated();
      handleClose();
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Fehler beim Entfernen des Avatars');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setPreviewUrl(null);
    setSelectedFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const initial = (displayName || 'U').charAt(0).toUpperCase();

  return (
    <>
      {/* Avatar Display */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
            {currentAvatarUrl ? (
              <img 
                src={currentAvatarUrl} 
                alt="Avatar" 
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-foreground">
                {initial}
              </span>
            )}
          </div>
          <button 
            onClick={() => setIsOpen(true)}
            className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Profilbild ändern</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Preview */}
            <div className="flex justify-center">
              <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="h-32 w-32 rounded-full object-cover"
                  />
                ) : currentAvatarUrl ? (
                  <img 
                    src={currentAvatarUrl} 
                    alt="Avatar" 
                    className="h-32 w-32 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-5xl font-bold text-foreground">
                    {initial}
                  </span>
                )}
              </div>
            </div>

            {/* File Input */}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {!selectedFile ? (
                <>
                  <Button
                    onClick={() => inputRef.current?.click()}
                    className="w-full"
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Bild auswählen
                  </Button>
                  
                  {currentAvatarUrl && (
                    <Button
                      variant="outline"
                      onClick={handleRemoveAvatar}
                      disabled={isUploading}
                      className="w-full text-destructive hover:text-destructive"
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-2" />
                          Profilbild entfernen
                        </>
                      )}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {isUploading ? 'Hochladen...' : 'Speichern'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPreviewUrl(null);
                      setSelectedFile(null);
                      if (inputRef.current) {
                        inputRef.current.value = '';
                      }
                    }}
                    disabled={isUploading}
                    className="w-full"
                  >
                    Abbrechen
                  </Button>
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Unterstützte Formate: JPEG, PNG, WebP (max. 5MB)
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
