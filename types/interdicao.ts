export type Interdicao = {
  id: string;
  rua: string;
  numero?: string | null;
  cidade: string;
  estado: string;
  referencia?: string | null;
  motivo?: string | null;
  ativa: boolean;
  latitude?: number | null;
  longitude?: number | null;
  criadoEm: string;
  criadoPorEmail?: string | null;
  podeEncerrar?: boolean;
};
