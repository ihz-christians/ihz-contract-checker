import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Pause, Volume2, AlertTriangle, User, Headphones } from 'lucide-react';
import { useState } from 'react';
import { Finding, TranscriptSegment } from '@/types/case';

interface ConversationTimelineProps {
  segments: TranscriptSegment[];
  findings: Finding[];
  onPlaySegment?: (startTime: number) => void;
  onExplainFinding?: (findingId: string) => void;
  currentTime?: number;
}

const getRiskColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'critical':
      return 'bg-red-500/20 border-red-500/50';
    case 'high':
      return 'bg-orange-500/20 border-orange-500/50';
    case 'medium':
      return 'bg-yellow-500/20 border-yellow-500/50';
    case 'low':
      return 'bg-blue-500/20 border-blue-500/50';
    default:
      return 'bg-muted/50 border-muted';
  }
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function ConversationTimeline({
  segments,
  findings,
  onPlaySegment,
  onExplainFinding,
  currentTime = 0,
}: ConversationTimelineProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = (startTime: number) => {
    setIsPlaying(!isPlaying);
    onPlaySegment?.(startTime);
  };

  // Create a heat map of risk levels throughout the conversation
  const riskHeatMap = segments.map((segment) => {
    const segmentFindings = findings.filter(
      (f) => f.span.start >= segment.startTime && f.span.end <= segment.endTime
    );

    if (segmentFindings.length === 0) return 'safe';

    const maxSeverity = Math.max(...segmentFindings.map((f) => f.severity));
    if (maxSeverity >= 8) return 'critical';
    if (maxSeverity >= 6) return 'high';
    if (maxSeverity >= 4) return 'medium';
    return 'low';
  });

  return (
    <Card className="border-muted/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Gesprächsverlauf & Risiko-Heatmap
        </CardTitle>

        {/* Risk Heat Map */}
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Risiko-Verlauf:</div>
          <div className="flex h-2 rounded-full overflow-hidden bg-muted">
            {riskHeatMap.map((risk, index) => (
              <div
                key={index}
                className={`flex-1 ${getRiskColor(risk).split(' ')[0]}`}
                title={`Segment ${index + 1}: ${risk} Risiko`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0:00</span>
            <span>{formatTime(segments[segments.length - 1]?.endTime || 0)}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {segments.map((segment, index) => {
              const segmentFindings = findings.filter(
                (f) => f.span.start >= segment.startTime && f.span.end <= segment.endTime
              );

              const isCurrentSegment =
                currentTime >= segment.startTime && currentTime <= segment.endTime;

              return (
                <div
                  key={segment.id}
                  className={`border rounded-lg p-3 transition-all ${
                    isCurrentSegment
                      ? 'border-primary bg-primary/5'
                      : segmentFindings.length > 0
                        ? getRiskColor(riskHeatMap[index])
                        : 'border-muted bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {segment.speaker === 'customer' ? (
                          <User className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Headphones className="h-4 w-4 text-green-500" />
                        )}
                        <span className="font-medium text-sm">
                          {segment.speaker === 'customer' ? 'Kunde' : 'Verkäufer'}
                        </span>
                      </div>

                      <span className="text-xs text-muted-foreground">
                        {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                      </span>

                      {segmentFindings.length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {segmentFindings.length} Problem{segmentFindings.length > 1 ? 'e' : ''}
                        </Badge>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePlayPause(segment.startTime)}
                      className="h-6 w-6 p-0"
                    >
                      {isPlaying && isCurrentSegment ? (
                        <Pause className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </Button>
                  </div>

                  <p className="text-sm mb-3 leading-relaxed">{segment.text}</p>

                  {segmentFindings.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-muted">
                      {segmentFindings.map((finding) => (
                        <div
                          key={finding.id}
                          className="flex items-center justify-between p-2 bg-destructive/10 rounded text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3 text-destructive" />
                            <span className="font-medium">{finding.type}</span>
                            <Badge variant="outline">{finding.riskLevel}</Badge>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onExplainFinding?.(finding.id)}
                            className="h-6 text-xs"
                          >
                            Erklären
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                    <span>Konfidenz: {Math.round(segment.confidence * 100)}%</span>
                    {segmentFindings.length === 0 && (
                      <span className="text-success">✓ Unbedenklich</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
