import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Star, Mic, MicOff, Play, Pause, RotateCcw, Send, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SalesRatingSystemProps {
  caseId: string;
  onRatingSubmit: (rating: number, feedback: string, audioUrl?: string) => void;
}

export function SalesRatingSystem({ caseId, onRatingSubmit }: SalesRatingSystemProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [useVoice, setUseVoice] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'de-DE';

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setFeedback(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsTranscribing(false);
      };
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Start transcription if voice mode is enabled
      if (useVoice && recognitionRef.current) {
        recognitionRef.current.start();
        setIsTranscribing(true);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    if (recognitionRef.current && isTranscribing) {
      recognitionRef.current.stop();
    }
  };

  const playAudio = () => {
    if (audioUrl) {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }

      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.play();
      setIsPlaying(true);

      audioElementRef.current.onended = () => {
        setIsPlaying(false);
      };
    }
  };

  const pauseAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setIsPlaying(false);
    setFeedback('');
  };

  const handleSubmit = () => {
    if (rating > 0) {
      onRatingSubmit(rating, feedback, audioUrl || undefined);
      // Reset form
      setRating(0);
      setFeedback('');
      resetRecording();
      setUseVoice(false);
    }
  };

  const getRatingLabel = (stars: number) => {
    const labels = {
      1: 'Sehr unzufrieden',
      2: 'Unzufrieden',
      3: 'Neutral',
      4: 'Zufrieden',
      5: 'Sehr zufrieden',
    };
    return labels[stars as keyof typeof labels];
  };

  return (
    <Card className="w-full bg-gradient-to-br from-gold-light/20 to-premium/5 border-gold/20">
      <CardHeader className="bg-gradient-to-r from-gold/10 to-transparent pb-3">
        <CardTitle className="flex items-center gap-2 text-gold-dark text-lg">
          <Star className="h-5 w-5 text-gold fill-gold flex-shrink-0" />
          <span>Bewerten Sie Ihr Beratungsgespräch</span>
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          Ihre Bewertung hilft uns, die Qualität der Beratung zu verbessern
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Star Rating */}
        <div className="space-y-3">
          <h4 className="font-medium text-base">Wie zufrieden waren Sie mit der Beratung?</h4>
          <div className="flex items-center justify-center gap-2 px-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={cn(
                  'p-1 rounded-xl transition-all duration-200 hover:scale-110',
                  'focus:outline-none focus:ring-2 focus:ring-gold/30',
                  'transform hover:shadow-md hover:shadow-gold/25 touch-manipulation'
                )}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={cn(
                    'h-8 w-8 transition-all duration-200',
                    hoveredRating >= star || rating >= star
                      ? 'fill-gold text-gold'
                      : 'text-muted-foreground/40 hover:text-gold/60'
                  )}
                />
              </button>
            ))}
          </div>
          {(rating > 0 || hoveredRating > 0) && (
            <div className="text-center p-2 bg-gold/10 rounded-lg border border-gold/20">
              <p className="text-sm font-medium text-gold-dark">
                ⭐ {getRatingLabel(hoveredRating || rating)}
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Voice/Text Toggle */}
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-premium/10 to-gold/10 rounded-lg border border-premium/20">
          <h4 className="font-medium text-sm">Feedback hinzufügen:</h4>
          <div className="flex items-center gap-2">
            <Button
              variant={!useVoice ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUseVoice(false)}
              className="border-premium/20 text-xs"
            >
              Text
            </Button>
            <Button
              variant={useVoice ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUseVoice(true)}
              className={cn(
                'border-premium/20 text-xs',
                useVoice && 'bg-premium text-premium-foreground hover:bg-premium/90'
              )}
            >
              <Mic className="h-3 w-3 mr-1" />
              Sprache
            </Button>
          </div>
        </div>

        {/* Voice Recording Interface */}
        {useVoice && (
          <div className="space-y-4 p-4 bg-gradient-to-br from-premium/5 to-gold/5 rounded-lg border border-premium/20 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    variant="default"
                    size="sm"
                    className="gap-2 bg-premium hover:bg-premium/90 text-premium-foreground shadow-lg"
                  >
                    <Mic className="h-4 w-4" />
                    Aufnahme starten
                  </Button>
                ) : (
                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                    size="sm"
                    className={cn(
                      'gap-2 shadow-lg',
                      isRecording && 'animate-pulse bg-destructive/90'
                    )}
                  >
                    <MicOff className="h-4 w-4" />
                    Aufnahme stoppen
                  </Button>
                )}

                {isTranscribing && (
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-premium/10 text-premium border-premium/20"
                  >
                    <div className="w-2 h-2 bg-premium rounded-full animate-pulse" />
                    Transkribierung...
                  </Badge>
                )}
              </div>

              {audioUrl && (
                <div className="flex items-center gap-2">
                  {!isPlaying ? (
                    <Button onClick={playAudio} variant="outline" size="sm" className="gap-2">
                      <Play className="h-4 w-4" />
                      Abspielen
                    </Button>
                  ) : (
                    <Button onClick={pauseAudio} variant="outline" size="sm" className="gap-2">
                      <Pause className="h-4 w-4" />
                      Pause
                    </Button>
                  )}
                  <Button onClick={resetRecording} variant="outline" size="sm" className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Neu
                  </Button>
                </div>
              )}
            </div>

            {isRecording && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex gap-1">
                  <div
                    className="w-1 h-6 bg-destructive rounded animate-pulse"
                    style={{ animationDelay: '0ms' }}
                  />
                  <div
                    className="w-1 h-4 bg-destructive rounded animate-pulse"
                    style={{ animationDelay: '150ms' }}
                  />
                  <div
                    className="w-1 h-8 bg-destructive rounded animate-pulse"
                    style={{ animationDelay: '300ms' }}
                  />
                  <div
                    className="w-1 h-3 bg-destructive rounded animate-pulse"
                    style={{ animationDelay: '450ms' }}
                  />
                </div>
                Aufnahme läuft...
              </div>
            )}
          </div>
        )}

        {/* Text Feedback */}
        <div className="space-y-2">
          <Textarea
            placeholder={
              useVoice
                ? 'Ihre Spracheingabe wird hier automatisch transkribiert...'
                : 'Beschreiben Sie Ihre Erfahrungen mit der Beratung...'
            }
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[80px] resize-none text-sm"
            disabled={useVoice && isTranscribing}
          />
          <p className="text-xs text-muted-foreground">
            {useVoice
              ? '💡 Sprechen Sie deutlich für eine bessere Transkription'
              : `${feedback.length}/500 Zeichen`}
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSubmit}
            disabled={rating === 0}
            className={cn(
              'gap-2 shadow-lg transition-all duration-300',
              rating > 0
                ? 'bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-gold-foreground hover:shadow-gold/25 hover:scale-105'
                : 'opacity-50'
            )}
          >
            <Send className="h-4 w-4" />
            Bewertung absenden
          </Button>
        </div>

        {/* Audio Preview */}
        {audioUrl && (
          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-gold/10 to-premium/10 rounded-lg border border-gold/20">
            <Volume2 className="h-4 w-4 text-gold" />
            <span className="text-sm text-muted-foreground">Sprachaufnahme verfügbar</span>
            {isPlaying && (
              <Badge
                variant="secondary"
                className="gap-1 bg-success/10 text-success border-success/20"
              >
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                Wiedergabe...
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
