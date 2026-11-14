export type FlavorId = 'chocochip' | 'doblechoco' | 'redvelvet' | 'nutella' | 'oreo' | 'manichoco';

export interface Flavor {
  id: FlavorId;
  name: string;
  /** Nombre corto para espacios reducidos (resumen del pedido, chips). */
  short: string;
  tag: string;
  description: string;
  /** Color de fondo suave de la tarjeta. */
  tint: string;
  /** Color representativo de la masa (selector del hero). */
  swatch: string;
  image: string;
  alt: string;
}

export const FLAVORS: readonly Flavor[] = [
  {
    id: 'chocochip',
    name: 'Chocolate Chip Clásica',
    short: 'Chocolate Chip',
    tag: 'La clásica',
    description: 'La original neoyorkina: chips de chocolate semi-amargo y centro suave.',
    tint: '#F4DFBD',
    swatch: '#C98D4C',
    image: '/galletas/chocochip.webp',
    alt: 'Galleta Chocolate Chip Clásica estilo New York de Crunky Cookies en Girardot',
  },
  {
    id: 'doblechoco',
    name: 'Doble Chocolate',
    short: 'Doble Chocolate',
    tag: 'Puro cacao',
    description: 'Masa de cacao intenso con trozos de chocolate negro derretido.',
    tint: '#E4CFC0',
    swatch: '#4A2614',
    image: '/galletas/doblechoco.webp',
    alt: 'Galleta Doble Chocolate con trozos de chocolate negro de Crunky Cookies',
  },
  {
    id: 'redvelvet',
    name: 'Red Velvet',
    short: 'Red Velvet',
    tag: 'Terciopelo',
    description: 'Suave terciopelo rojo con chips de chocolate blanco artesanal.',
    tint: '#F5D3D0',
    swatch: '#A3243A',
    image: '/galletas/redvelvet.webp',
    alt: 'Galleta Red Velvet con chips de chocolate blanco de Crunky Cookies',
  },
  {
    id: 'nutella',
    name: 'Nutella Rellena',
    short: 'Nutella Rellena',
    tag: 'Rellena',
    description: 'Centro fluido de Nutella escondido en una galleta crujiente.',
    tint: '#EED8B6',
    swatch: '#B67C3E',
    image: '/galletas/nutella.webp',
    alt: 'Galleta rellena de Nutella de Crunky Cookies en Girardot',
  },
  {
    id: 'oreo',
    name: 'Cookies & Cream',
    short: 'Cookies & Cream',
    tag: 'Cremosa',
    description: 'Trozos generosos de Oreo en masa de vainilla cremosa.',
    tint: '#E8E3D9',
    swatch: '#E3C593',
    image: '/galletas/oreo.webp',
    alt: 'Galleta Cookies and Cream con trozos de Oreo de Crunky Cookies',
  },
  {
    id: 'manichoco',
    name: 'Maní y Chocolate',
    short: 'Maní y Chocolate',
    tag: 'El combo perfecto',
    description: 'Mantequilla de maní con chips de chocolate. El combo perfecto.',
    tint: '#F5E4B8',
    swatch: '#CF9B52',
    image: '/galletas/manichoco.webp',
    alt: 'Galleta de mantequilla de maní con chocolate de Crunky Cookies',
  },
];
