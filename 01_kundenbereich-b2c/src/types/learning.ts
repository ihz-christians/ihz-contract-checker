export type LearningModuleCategory =
  | 'communication_skills'
  | 'compliance_basics'
  | 'objection_handling'
  | 'product_knowledge'
  | 'legal_requirements'
  | 'customer_psychology'
  | 'sales_techniques';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export type LearningModuleType = 'video' | 'interactive' | 'quiz' | 'simulation' | 'document';

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  category: LearningModuleCategory;
  type: LearningModuleType;
  duration: number; // in minutes
  level: SkillLevel;
  tags: string[];
  url: string;
  thumbnail?: string;
  prerequisites?: string[];
  learningObjectives: string[];
  completionRate: number;
  averageScore?: number;
}

export interface PersonalLearningPath {
  userId: string;
  currentLevel: SkillLevel;
  completedModules: string[];
  inProgressModules: string[];
  recommendedModules: string[];
  skillGaps: LearningModuleCategory[];
  totalLearningTime: number;
  lastUpdated: string;
}

export interface LearningProgress {
  moduleId: string;
  userId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  progress: number; // 0-100
  score?: number;
  completedAt?: string;
  timeSpent: number;
  attempts: number;
}

export interface SkillAssessment {
  userId: string;
  category: LearningModuleCategory;
  currentLevel: SkillLevel;
  targetLevel: SkillLevel;
  gapAnalysis: string[];
  lastAssessed: string;
  improvementAreas: string[];
}
