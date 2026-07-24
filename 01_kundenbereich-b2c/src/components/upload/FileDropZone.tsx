import React, { useCallback, useState } from 'react';
import { Upload, FileAudio, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileDropZoneProps {
  onFilesAdded: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  className?: string;
}

export function FileDropZone({
  onFilesAdded,
  accept = '.mp3,.wav,.pdf,.docx',
  maxFiles = 10,
  className,
}: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > maxFiles) {
        // Handle max files error
        return;
      }

      onFilesAdded(files);
    },
    [onFilesAdded, maxFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      onFilesAdded(files);
    },
    [onFilesAdded]
  );

  return (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 shadow-sm hover:shadow-md',
        isDragOver
          ? 'border-accent bg-accent/10'
          : 'border-border hover:border-accent/50 hover:bg-accent/5',
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        multiple
        accept={accept}
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />

      <div className="space-y-4">
        <div className="flex justify-center space-x-4">
          <div className="p-3 bg-accent/10 rounded-full">
            <Upload className="h-8 w-8 text-accent" />
          </div>
          <div className="p-3 bg-success/10 rounded-full">
            <FileAudio className="h-8 w-8 text-success" />
          </div>
          <div className="p-3 bg-warning/10 rounded-full">
            <FileText className="h-8 w-8 text-warning" />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-foreground">Dateien hochladen</h3>
          <p className="text-muted-foreground mt-2">
            Ziehen Sie Audio-Dateien und Vertragsdokumente hierher oder klicken Sie zum Auswählen
          </p>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>Unterstützte Formate:</p>
          <p>
            <strong>Audio:</strong> MP3, WAV, M4A (max. 50MB)
          </p>
          <p>
            <strong>Dokumente:</strong> PDF, DOCX (max. 50MB)
          </p>
        </div>
      </div>
    </div>
  );
}
