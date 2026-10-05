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
        id: 'usuario',
        title: 'Gestión de Usuarios',
        type: 'item',
        url: '/inicio/usuarios',
        icon: 'feather icon-user',
        classes: 'nav-item'
      },
      /* ---------- Nuevos menus aqui -------------  */
      {
        id: 'clientes-mascotas',
        title: 'Clientes y Mascotas',
        type: 'collapse',
        icon: 'feather icon-users',
        children: [
          {
            id: 'clientes',
            title: 'Gestión de Clientes',
            type: 'item',
            url: '/inicio/clientes',
            icon: 'feather icon-user' },
            {
              id: 'mascotas',
              title: 'Gestión de Mascotas',
              type: 'item',
              url: '/inicio/mascotas',
              icon: 'feather icon-home'
            },
            {
              id: 'razas',
              title: 'Gestión de Razas',
              type: 'item',
              url: '/inicio/razas',
              icon: 'feather icon-tag'
            }
        ]
      },
      {
        id: 'medicos-especializaciones',
        title: 'Médicos y Especializaciones',
        type: 'collapse',
        icon: 'feather icon-users',
        children: [
          {
            id: 'medicos',
            title: 'Gestión de Médicos',
            type: 'item',
            url: '/inicio/medicos',
            icon: 'feather icon-user'
          },
          {
            id: 'especializaciones',
            title: 'Gestión de Especializaciones',
            type: 'item',
            url: '/inicio/especializaciones',
            icon: 'feather icon-tag'
          }
        ]
      },
      {
        id: 'citas-historias',
        title: 'Citas y Historias Médicas',
        type: 'collapse',
        icon: 'feather icon-calendar',
        children: [
          {
            id: 'citas',
            title: 'Gestión de Citas',
            type: 'item',
            url: '/inicio/citas',
            icon: 'feather icon-calendar'
          },
          {
            id: 'historias-medicas',
            title: 'Gestión de Historias Médicas',
            type: 'item',
            url: '/inicio/historias-medicas',
            icon: 'feather icon-file-text'
          },
          {
            id: 'anotaciones-historia',
            title: 'Gestión de Anotaciones de Historia',
            type: 'item',
            url: '/inicio/anotaciones_historia',
            icon: 'feather icon-edit'
          }
        ]
      },
      {
        id: 'medicamentos-formulas',
        title: 'Farmacia',
        type: 'collapse',
        icon: 'feather icon-package',
        children: [
          {
            id: 'medicamentos',
            title: 'Gestión de Medicamentos',
            type: 'item',
            url: '/inicio/medicamento',
            icon: 'feather icon-package'
          },
          {
            id: 'formulas-medicas',
            title: 'Gestión de Fórmulas Médicas',
            type: 'item',
            url: '/inicio/formula-medica',
            icon: 'feather icon-file-text'
          }
        ]
      },
      {
        id: 'session',
        title: 'Gestión de Sesión',
        type: 'item',
        url: '/inicio/session',
        icon: 'feather icon-lock'
      }
    ]
  },  
];
