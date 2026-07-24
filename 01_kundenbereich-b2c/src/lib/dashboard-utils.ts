import { type VariantProps } from 'class-variance-authority';
import { badgeVariants } from '@/components/ui/badge';

export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

// Standardized badge mapping functions
export const getRiskBadgeVariant = (riskLevel: string): BadgeVariant => {
  switch (riskLevel?.toLowerCase()) {
    case 'low':
    case 'niedrig':
      return 'secondary';
    case 'medium':
    case 'mittel':
      return 'default';
    case 'high':
    case 'hoch':
    case 'critical':
    case 'kritisch':
      return 'destructive';
    default:
      return 'outline';
  }
};

export const getStatusBadgeVariant = (status: string): BadgeVariant => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'resolved':
    case 'compliant':
    case 'success':
    case 'active':
      return 'secondary';
    case 'pending':
    case 'investigating':
    case 'attention':
    case 'warning':
      return 'default';
    case 'critical':
    case 'failed':
    case 'error':
    case 'violation':
      return 'destructive';
    default:
      return 'outline';
  }
};

export const getTrendBadgeVariant = (trend: string): BadgeVariant => {
  switch (trend?.toLowerCase()) {
    case 'up':
    case 'improving':
    case 'positive':
      return 'secondary';
    case 'down':
    case 'declining':
    case 'negative':
      return 'destructive';
    case 'stable':
    case 'neutral':
      return 'default';
    default:
      return 'outline';
  }
};

export const getPriorityBadgeVariant = (priority: string): BadgeVariant => {
  switch (priority?.toLowerCase()) {
    case 'low':
    case 'easy':
      return 'secondary';
    case 'medium':
    case 'normal':
      return 'default';
    case 'high':
    case 'urgent':
    case 'critical':
    case 'hard':
      return 'destructive';
    default:
      return 'outline';
  }
};

// Re-export for convenience
export { getRiskBadgeVariant as getRiskVariant };

// Color helper functions for non-badge elements
export const getRiskColorClasses = (riskLevel: string) => {
  switch (riskLevel?.toLowerCase()) {
    case 'low':
    case 'niedrig':
      return {
        text: 'text-success',
        bg: 'bg-success/10',
        border: 'border-success',
      };
    case 'medium':
    case 'mittel':
      return {
        text: 'text-warning',
        bg: 'bg-warning/10',
        border: 'border-warning',
      };
    case 'high':
    case 'hoch':
    case 'critical':
    case 'kritisch':
      return {
        text: 'text-destructive',
        bg: 'bg-destructive/10',
        border: 'border-destructive',
      };
    default:
      return {
        text: 'text-muted-foreground',
        bg: 'bg-muted/10',
        border: 'border-muted',
      };
  }
};

// Progress value helper
export const getProgressVariant = (value: number) => {
  if (value >= 80) return 'destructive';
  if (value >= 60) return 'warning';
  return 'default';
};

// Format time helper
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Format date helper
export const formatDate = (date: string | Date, locale = 'de-DE'): string => {
  return new Date(date).toLocaleDateString(locale);
};

// Format number helper
export const formatNumber = (num: number): string => {
  return num.toLocaleString('de-DE');
};
