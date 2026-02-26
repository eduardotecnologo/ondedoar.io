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
  endereco: string;
  cidade?: string | null;
  estado?: string | null;
  whatsapp?: string | null;
  latitude: number | null;
  longitude: number | null;
  categorias?: CategoriaRelacionada[];
};
