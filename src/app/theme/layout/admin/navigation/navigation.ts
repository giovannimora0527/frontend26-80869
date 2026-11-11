import { getJwtMenus } from 'src/app/utils/jwt.util';

export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;

  children?: NavigationItem[];
}
export const NavigationItems: NavigationItem[] = [
  {
    id: 'navigation',
    title: 'Inicio',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'cita',
        title: 'Gestión de Citas',
        type: 'item',
        url: '/inicio/citas',
        icon: 'bi bi-calendar',
        classes: 'nav-item'
      },
      {
        id: 'clientes',
        title: 'Gestión de Clientes',
        type: 'item',
        url: '/inicio/clientes',
        icon: 'bi bi-person-check',
        classes: 'nav-item'
      },
      {
        id: 'especializaciones',
        title: 'Gestión de Especializaciones',
        type: 'item',
        url: '/inicio/especializaciones',
        icon: 'fa-solid fa-user-graduate',
        classes: 'nav-item'
      },
      {
        id: 'servicios',
        title: 'Gestión de Servicios',
        type: 'item',
        url: '/inicio/servicios',
        icon: 'fa-solid fa-hand-holding-medical',
        classes: 'nav-item'
      },
      {
        id: 'facturacion',
        title: 'Facturación',
        type: 'item',
        url: '/inicio/facturacion',
        icon: 'fa-solid fa-file-invoice-dollar',
        classes: 'nav-item'
      },
      {
        id: 'despacho',
        title: 'Despacho de Medicamentos',
        type: 'item',
        url: '/inicio/despacho',
        icon: 'fa-solid fa-truck-medical',
        classes: 'nav-item'
      },
      {
        id: 'formulas',
        title: 'Gestión de Formulas',
        type: 'item',
        url: '/inicio/formulas',
        icon: 'fa-solid fa-clipboard-list',
        classes: 'nav-item'
      },
      {
        id: 'historias',
        title: 'Gestión de Historias',
        type: 'item',
        url: '/inicio/historias',
        icon: 'fa-solid fa-book-medical',
        classes: 'nav-item'
      },
      {
        id: 'mascotas',
        title: 'Gestión de Mascotas',
        type: 'item',
        url: '/inicio/mascotas',
        icon: 'fa-solid fa-paw',
        classes: 'nav-item'
      },
      {
        id: 'inventario',
        title: 'Gestión de Inventario',
        type: 'item',
        url: '/inicio/inventario',
        icon: 'fa-solid fa-boxes-stacked',
        classes: 'nav-item'
      },

      {
        id: 'medicos',
        title: 'Gestión de Medicos',
        type: 'item',
        url: '/inicio/medicos',
        icon: 'fa-solid fa-user-doctor',
        classes: 'nav-item'
      },
      {
        id: 'usuarios',
        title: 'Gestión de Usuarios',
        type: 'item',
        url: '/inicio/usuarios',
        icon: 'feather icon-users',
        classes: 'nav-item'
      },
      {
        id: 'roles',
        title: 'Gestión de Roles',
        type: 'item',
        url: '/inicio/roles',
        icon: 'feather icon-shield',
        classes: 'nav-item'
      },
      {
        id: 'reportes',
        title: 'Reportes',
        type: 'item',
        url: '/inicio/reportes',
        icon: 'fa-solid fa-chart-line',
        classes: 'nav-item'
      },
      /* ---------- Nuevos menus aqui -------------  */
    ]
  },
];

export function getNavigationItems(): NavigationItem[] {
  let allowedCodes: Set<string>;
  try {
    allowedCodes = new Set(getJwtMenus().filter((menu) => menu.activo).map((menu) => menu.code));
  } catch (error) {
    console.error('No fue posible obtener los menus del token JWT', error);
    return [];
  }

  const filterItems = (items: NavigationItem[]): NavigationItem[] =>
    items.flatMap((item) => {
      if (item.type === 'item') {
        return allowedCodes.has(item.id) ? [{ ...item }] : [];
      }

      const children = filterItems(item.children ?? []);
      return children.length > 0 ? [{ ...item, children }] : [];
    });

  return filterItems(NavigationItems);
}
