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
      /* ---------- Clientes y mascotas ---------- */
      {
        id: 'clientes-mascotas',
        title: 'Clientes y Mascotas',
        type: 'collapse',
        icon: 'feather icon-users',
        children: [
          {
            id: 'cliente',
            title: 'Gestión de Clientes',
            type: 'item',
            url: '/inicio/clientes',
            icon: 'feather icon-user',
            classes: 'nav-item'
          },
          {
            id: 'mascotas',
            title: 'Gestión de Mascotas',
            type: 'item',
            url: '/inicio/mascotas',
            icon: 'feather icon-home',
            classes: 'nav-item'
          },
          {
            id: 'raza',
            title: 'Gestión de Razas',
            type: 'item',
            url: '/inicio/razas',
            icon: 'feather icon-tag',
            classes: 'nav-item'
          }
        ]
      },
      /* ---------- Personal médico ---------- */
      {
        id: 'personal-medico',
        title: 'Personal Médico',
        type: 'collapse',
        icon: 'feather icon-briefcase',
        children: [
          {
            id: 'medico',
            title: 'Gestión de Médicos',
            type: 'item',
            url: '/inicio/medicos',
            icon: 'feather icon-user',
            classes: 'nav-item'
          },
          {
            id: 'especializacion',
            title: 'Gestión de Especializaciones',
            type: 'item',
            url: '/inicio/especializaciones',
            icon: 'feather icon-award',
            classes: 'nav-item'
          }
        ]
      },
      /* ---------- Atención clínica ---------- */
      {
        id: 'atencion-clinica',
        title: 'Atención Clínica',
        type: 'collapse',
        icon: 'feather icon-activity',
        children: [
          {
            id: 'cita',
            title: 'Gestión de Citas',
            type: 'item',
            url: '/inicio/citas',
            icon: 'feather icon-calendar',
            classes: 'nav-item'
          },
          {
            id: 'historia-medica',
            title: 'Historias Médicas',
            type: 'item',
            url: '/inicio/historias-medicas',
            icon: 'feather icon-folder',
            classes: 'nav-item'
          },
          {
            id: 'anotacion-historia',
            title: 'Anotaciones de Historia',
            type: 'item',
            url: '/inicio/anotaciones-historia',
            icon: 'feather icon-file-text',
            classes: 'nav-item'
          }
        ]
      },
      /* ---------- Farmacia ---------- */
      {
        id: 'farmacia',
        title: 'Farmacia',
        type: 'collapse',
        icon: 'feather icon-package',
        children: [
          {
            id: 'medicamento',
            title: 'Gestión de Medicamentos',
            type: 'item',
            url: '/inicio/medicamentos',
            icon: 'feather icon-droplet',
            classes: 'nav-item'
          },
          {
            id: 'formula-medica',
            title: 'Fórmulas Médicas',
            type: 'item',
            url: '/inicio/formulas-medicas',
            icon: 'feather icon-clipboard',
            classes: 'nav-item'
          }
        ]
      }
      /* ---------- Nuevos menus aqui -------------  */
    ]
  },  
];
