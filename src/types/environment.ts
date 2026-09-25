export interface EnvironmentVariable {
  readonly id: string;
  readonly key: string;
  readonly value: string;
  readonly isSecret: boolean;
  readonly sortOrder: number;
}

export interface Environment {
  readonly id: string;
  readonly name: string;
  readonly isActive: boolean;
  readonly variables: readonly EnvironmentVariable[];
  readonly createdAt: string;
  readonly updatedAt: string;
}
