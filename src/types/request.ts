import type { AuthConfig, BodyConfig, HttpMethod, KeyValueRow } from "./http";

export interface SavedRequest {
  readonly id: string;
  readonly collectionId: string;
  readonly name: string;
  readonly method: HttpMethod;
  readonly url: string;
  readonly params: readonly KeyValueRow[];
  readonly headers: readonly KeyValueRow[];
  readonly auth: AuthConfig;
  readonly body: BodyConfig;
  readonly sortOrder: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}
