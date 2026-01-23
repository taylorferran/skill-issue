export type ModuleStatus = 'completed' | 'active' | 'locked';

export type Module ={
  id: string;
  title: string;
  description: string;
  status: ModuleStatus;
  progress?: number;
}


