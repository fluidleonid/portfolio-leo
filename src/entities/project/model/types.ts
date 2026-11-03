export interface CaseItem {
  id?: string | number;
  label: string;
  href?: string;
  active?: boolean;
  onClick?: () => void;
}

export interface Achievement {
  id?: string | number;
  label: string;
  active?: boolean;
}

export interface ProjectData {
  id?: string | number;
  anchorId?: string;
  order?: number;
  title: string;
  description: string;
  roleDescription?: string;
  images: string[];
  keyAchievements?: (string | Achievement)[];
  caseStudies: CaseItem[];
}
