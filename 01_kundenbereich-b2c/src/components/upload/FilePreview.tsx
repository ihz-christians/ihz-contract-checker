import React from 'react';
import { FileAudio, FileText, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UploadFile } from '@/types/upload';

interface FilePreviewProps {
  file: UploadFile;
  onRemove: (id: string) => void;
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  const getFileIcon = () => {
    if (file.type.startsWith('audio/')) {
      return <FileAudio className="h-6 w-6 text-success" />;
    }
    return <FileText className="h-6 w-6 text-warning" />;
  };

  const getStatusColor = () => {
    switch (file.status) {
      case 'success':
        return 'text-success';
      case 'error':
        return 'text-destructive';
      case 'uploading':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = () => {
    switch (file.status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">{getFileIcon()}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                  {file.metadata?.duration && ` • ${formatDuration(file.metadata.duration)}`}
                  {file.metadata?.language && ` • ${file.metadata.language.toUpperCase()}`}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Badge
                  variant={
                    file.status === 'success'
                      ? 'success'
                      : file.status === 'error'
                        ? 'destructive'
                        : file.status === 'uploading'
                          ? 'accent'
                          : 'outline'
                  }
                >
                  {file.status === 'pending' && 'Bereit'}
                  {file.status === 'uploading' && 'Upload...'}
                  {file.status === 'success' && 'Erfolgreich'}
                  {file.status === 'error' && 'Fehler'}
                </Badge>
                {getStatusIcon()}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onRemove(file.id)}
                  disabled={file.status === 'uploading'}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {file.status === 'uploading' && (
              <div className="mt-3">
                <Progress value={file.progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{file.progress}% hochgeladen</p>
              </div>
            )}

            {file.metadata && file.metadata.quality && (
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {file.metadata.quality === 'high' && 'Hohe Qualität'}
                  {file.metadata.quality === 'medium' && 'Mittlere Qualität'}
                  {file.metadata.quality === 'low' && 'Niedrige Qualität'}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
