// types/ponto.ts
export type CategoriaRelacionada = {
  categoriaId: string;
  categoria: {
    id: string;
    nome: string;
  };
};

export type Ponto = {
  id: string;
  nome: string;
  detalhes?: string | null;
  statusDoacao?: "DOANDO" | "RECEBENDO" | null;
  endereco: string;
  numero: string;
  cidade?: string | null;
  estado?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  voluntarioEspecialidades?: string | null;
  voluntarioContatoAgendamento?: string | null;
  voluntarioDisponivel?: boolean | null;
  fraldasPublico?: string | null;
  latitude: number | null;
  longitude: number | null;
  categorias?: CategoriaRelacionada[];
};
