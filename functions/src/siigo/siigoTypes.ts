/**
 * Formas (parciales) de las respuestas de la API de Siigo que nos interesan.
 * Solo modelamos los campos que consumimos; el documento crudo completo se
 * guarda en `raw` dentro de cada registro de la caché.
 */

export interface SiigoAuthResponse {
  access_token: string;
  expires_in?: number;
  token_type?: string;
}

export interface SiigoPagination {
  page?: number;
  page_size?: number;
  total_results?: number;
}

export interface SiigoListResponse<T> {
  pagination?: SiigoPagination;
  results?: T[];
}

export interface SiigoMetadata {
  created?: string;
  last_updated?: string;
}

/** Registro genérico de Siigo: siempre trae `id` y normalmente `metadata`. */
export interface SiigoRecord {
  id?: string | number;
  metadata?: SiigoMetadata;
  [key: string]: unknown;
}
