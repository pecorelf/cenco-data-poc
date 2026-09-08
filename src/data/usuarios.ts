import type { Bandera, Categoria } from "./comercial";

export interface Usuario {
  id: string;
  nombre: string;
  cargo: string;
  banderas: Bandera[] | "todas";
  categorias: Categoria[] | "todas";
  puedePublicar: boolean;
  nota: string;
}

// El alcance no se define en el portal: se hereda de Unity Catalog.
// Cambiar de usuario cambia lo que la capa semántica devuelve, no lo que la vista oculta.
export const USUARIOS: Usuario[] = [
  {
    id: "gg",
    nombre: "Paulina Grez",
    cargo: "Gerenta de Marcas Propias",
    banderas: "todas",
    categorias: "todas",
    puedePublicar: true,
    nota: "Owner de margen y de participación. Puede certificar y publicar indicadores.",
  },
  {
    id: "comercial_ji",
    nombre: "Rodrigo Meza",
    cargo: "Subgerente de Planificación Comercial",
    banderas: "todas",
    categorias: "todas",
    puedePublicar: true,
    nota: "Owner de venta neta y cumplimiento de plan.",
  },
  {
    id: "cat_lacteos",
    nombre: "Fernanda Ávila",
    cargo: "Jefa de Categoría · Lácteos y Congelados",
    banderas: ["Jumbo", "Santa Isabel"],
    categorias: ["Lácteos", "Congelados"],
    puedePublicar: false,
    nota: "Alcance acotado a sus dos categorías y dos banderas. No puede publicar indicadores.",
  },
  {
    id: "analista",
    nombre: "Sebastián Ortiz",
    cargo: "Analista BI · Marcas Propias Regional",
    banderas: "todas",
    categorias: "todas",
    puedePublicar: false,
    nota: "Puede crear informes y cálculos propios, pero no publicarlos como oficiales.",
  },
];
