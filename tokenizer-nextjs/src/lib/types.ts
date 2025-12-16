export interface TokenData {
  id: number;
  position: number;
  text: string;
}

export interface TokenStats {
  tokenCount: number;
  characterCount: number;
  wordCount: number;
  charsPerToken: number;
}

export interface TokenizeResponse {
  success: boolean;
  stats: TokenStats;
  tokens: TokenData[];
  tokenIds: number[];
  error?: string;
}

export type EncodingType = 'cl100k_base' | 'p50k_base' | 'r50k_base';
