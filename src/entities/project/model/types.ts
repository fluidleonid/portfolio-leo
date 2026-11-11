export interface CaseItem {
  id?: string | number;
  label: string;
  sublabel?: string;
  href?: string;
  active?: boolean;
  onClick?: () => void;
}

export interface Achievement {
  id?: string | number;
  label: string;
  active?: boolean;
}

export interface ProjectImageItem {
  url: string;
  alt?: string;
}

export interface ProjectData {
  id?: string | number;
  anchorId?: string;
  order?: number;
  title: string;
  description: string;
  projectType?: ("B2B" | "B2C" | string)[];
  images: (string | ProjectImageItem)[];
  keyAchievements?: (string | Achievement)[];
  caseStudies: CaseItem[];
}
