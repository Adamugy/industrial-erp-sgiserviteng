
export enum ProjectStatus {
  PLANNING = 'Planeamento',
  IN_PROGRESS = 'Em Execução',
  PAUSED = 'Suspenso',
  COMPLETED = 'Concluído',
  CANCELLED = 'Cancelado'
}

export interface Project {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  endDate: string;
  budget: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  code: string;
  stock: number;
  minStock: number;
  unit: string;
  category: string;
}
