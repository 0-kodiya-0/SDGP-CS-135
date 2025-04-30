import { ReactNode } from 'react';

export interface TimelineItem {
  phase: string;
  date: string;
  content: string;
  status: 'completed' | 'current' | 'upcoming';
  position: 'left' | 'right' | 'center';
}

export interface TeamMember {
  name: string;
  role: string;
  id: string;
  specialty: string;
  linkedin: string;
  github: string;
  email: string;
  image: string;
}

export interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
}

export interface VisionPoint {
  icon: ReactNode;
  title: string;
  description: string;
}