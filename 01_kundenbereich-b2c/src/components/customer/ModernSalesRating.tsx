import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Star,
  Mic,
  MicOff,
  Play,
  Pause,
  MessageCircle,
  User,
  ThumbsUp,
  Brain,
  Clock,
} from 'lucide-react';

interface RatingCategory {
  id: string;
  label: string;
  icon: typeof User;
  description: string;
}

interface ModernSalesRatingProps {
  caseId: string;
  onRatingSubmit: (ratings: { [key: string]: number }, feedback: string, audioUrl?: string) => void;
}

export function ModernSalesRating({ caseId, onRatingSubmit }: ModernSalesRatingProps) {
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});
  const [hoveredStar, setHoveredStar] = useState<{ category: string; star: number } | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const categories: RatingCategory[] = [
    {
      id: 'professionalism',
      label: 'Professionalität',
      icon: User,
      description: 'Auftreten und fachliche Kompetenz',
    },
    {
      id: 'friendliness',
      label: 'Freundlichkeit',
      icon: ThumbsUp,
      description: 'Höflichkeit und Empathie',
    },
    {
      id: 'transparency',
      label: 'Transparenz',
      icon: Brain,
      description: 'Klarheit und Ehrlichkeit',
    },
    {
      id: 'timeliness',
      label: 'Pünktlichkeit',
      icon: Clock,
      description: 'Termintreue und Zuverlässigkeit',
    },
  ];

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'de-DE';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setFeedback((prev) => prev + ' ' + finalTranscript);
        }
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
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      if (recognitionRef.current) {
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
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }

    if (recognitionRef.current && isTranscribing) {
      recognitionRef.current.stop();
    }
  };

  const togglePlayback = () => {
    if (!audioUrl) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => setIsPlaying(false);
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleStarClick = (categoryId: string, star: number) => {
    setRatings((prev) => ({ ...prev, [categoryId]: star }));
  };

  const handleSubmit = () => {
    if (Object.keys(ratings).length === 0) return;
    onRatingSubmit(ratings, feedback, audioUrl || undefined);

    // Reset form
    setRatings({});
    setFeedback('');
    setAudioUrl(null);
    setIsRecording(false);
    setIsPlaying(false);
    setIsTranscribing(false);
  };

  const getRatingLabel = (rating: number) => {
    const labels = ['Sehr schlecht', 'Schlecht', 'Befriedigend', 'Gut', 'Sehr gut'];
    return labels[rating - 1] || '';
  };

  const getOverallRating = () => {
    const values = Object.values(ratings);
    if (values.length === 0) return 0;
    return values.reduce((sum, rating) => sum + rating, 0) / values.length;
  };

  const overallRating = getOverallRating();
  const isFormValid = Object.keys(ratings).length > 0;

  return (
    <Card className="card-professional">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Star className="h-5 w-5 text-primary" />
          </div>
          Verkäufer bewerten
        </CardTitle>

        {overallRating > 0 && (
          <div className="flex items-center gap-3 mt-4">
            <span className="text-sm text-muted-foreground">Gesamtbewertung:</span>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(overallRating)
                        ? 'fill-warning text-warning'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <Badge variant="secondary">{overallRating.toFixed(1)} / 5.0</Badge>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Rating Categories */}
        <div className="space-y-6">
          {categories.map((category) => {
            const IconComponent = category.icon;
            const categoryRating = ratings[category.id] || 0;

            return (
              <div key={category.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{category.label}</h4>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleStarClick(category.id, star)}
                        onMouseEnter={() => setHoveredStar({ category: category.id, star })}
                        onMouseLeave={() => setHoveredStar(null)}
                        className="transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
                      >
                        <Star
                          className={`h-6 w-6 transition-colors star-professional ${
                            star <=
                            (hoveredStar?.category === category.id
                              ? hoveredStar.star
                              : categoryRating)
                              ? 'fill-warning text-warning'
                              : 'text-muted-foreground/30 hover:text-warning/50'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {categoryRating > 0 && (
                    <Badge variant="outline" className="ml-2">
                      {getRatingLabel(categoryRating)}
                    </Badge>
                  )}
                </div>

                {categoryRating > 0 && <Progress value={categoryRating * 20} className="h-1" />}
              </div>
            );
          })}
        </div>

        {/* Feedback Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="font-medium">Zusätzliches Feedback</span>
            <Badge variant="secondary">Optional</Badge>
          </div>

          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Teilen Sie Ihre Erfahrungen mit dem Verkäufer..."
            className="min-h-[100px]"
          />

          {/* Voice Recording */}
          <div className="flex items-center gap-3">
            <Button
              variant={isRecording ? 'destructive' : 'outline'}
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
              className="flex items-center gap-2"
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {isRecording ? 'Aufnahme stoppen' : 'Spracheingabe'}
            </Button>

            {audioUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={togglePlayback}
                className="flex items-center gap-2"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Pause' : 'Abspielen'}
              </Button>
            )}

            {isTranscribing && (
              <Badge variant="secondary" className="animate-pulse">
                Transkribiert...
              </Badge>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid}
          className="w-full interactive-element"
          size="lg"
        >
          Bewertung abschicken
        </Button>
      </CardContent>
    </Card>
  );
}
