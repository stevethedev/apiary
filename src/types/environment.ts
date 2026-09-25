export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
  sortOrder: number;
}

export interface Environment {
  id: string;
  name: string;
  isActive: boolean;
  variables: EnvironmentVariable[];
  createdAt: string;
  updatedAt: string;
}
