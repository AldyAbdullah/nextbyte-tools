export type ToolCategory = 'All' | 'Utility' | 'Developer' | 'Media' | 'Security' | 'Text';

export type ToolStatus = 'available' | 'coming-soon';

export interface ToolItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: ToolCategory;
  status: ToolStatus;
  iconName: string;
  featured?: boolean;
  badge?: string;
  tags: string[];
}
