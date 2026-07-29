export interface ServiceItem {
  id: string;
  title: string;
  subtitle: string;
  shortDesc: string;
  fullDesc: string;
  iconName: string;
  features: string[];
  techStack: string[];
  benefits: string[];
  sla: string;
  popular?: boolean;
}

export interface SectorItem {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  challenges: string[];
  solutions: string[];
}

export interface ArticleItem {
  id: string;
  title: string;
  category: 'cyber' | 'cloud' | 'it-management' | 'backup' | 'network' | 'hardware' | 'ai-security';
  categoryLabel: string;
  summary: string;
  content: string;
  readTime: string;
  date: string;
  author: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  company: string;
  industry: string;
  content: string;
  rating: number;
  avatar: string;
}

export interface ITCalculatorState {
  workstations: number;
  servers: number;
  cloudUsers: number;
  securityTier: 'basic' | 'pro' | 'enterprise';
  backupNeeded: boolean;
  supportHours: 'business' | 'extended' | '24_7';
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: {
    label: string;
    points: number;
    explanation?: string;
  }[];
}
