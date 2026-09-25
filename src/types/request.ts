import type { AuthConfig, BodyConfig, HttpMethod, KeyValueRow } from "./http";

export interface SavedRequest {
  id: string;
  collectionId: string;
  name: string;
  method: HttpMethod;
  url: string;
  params: KeyValueRow[];
  headers: KeyValueRow[];
  auth: AuthConfig;
  body: BodyConfig;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
