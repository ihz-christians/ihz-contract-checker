import { useState, useCallback } from 'react';
import { UploadFile } from '@/types/upload';
import { toast } from '@/hooks/use-toast';

export function useFileUpload() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = useCallback((file: File): boolean => {
    const allowedTypes = [
      'audio/mp3',
      'audio/wav',
      'audio/mpeg',
      'audio/mp4',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Ungültiger Dateityp',
        description: 'Nur Audio-Dateien (.mp3, .wav) und Dokumente (.pdf, .docx) sind erlaubt',
        variant: 'destructive',
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: 'Datei zu groß',
        description: 'Dateien dürfen maximal 50MB groß sein',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  }, []);

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const validFiles = newFiles.filter(validateFile);

      const uploadFiles: UploadFile[] = validFiles.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending',
        progress: 0,
        metadata: file.type.startsWith('audio/')
          ? {
              duration: Math.floor(Math.random() * 600) + 60, // Mock duration
              language: 'de',
              quality: 'high',
              format: file.type.split('/')[1],
            }
          : undefined,
      }));

      setFiles((prev) => [...prev, ...uploadFiles]);
    },
    [validateFile]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id));
  }, []);

  const uploadFiles = useCallback(async () => {
    setIsUploading(true);

    // Mock upload simulation
    for (const file of files) {
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: 'uploading' } : f)));

      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, progress } : f)));
      }

      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: 'success', progress: 100 } : f))
      );
    }

    setIsUploading(false);
    toast({
      title: 'Upload erfolgreich',
      description: 'Alle Dateien wurden erfolgreich hochgeladen',
    });
  }, [files]);

  return {
    files,
    isUploading,
    addFiles,
    removeFile,
    uploadFiles,
  };
}
