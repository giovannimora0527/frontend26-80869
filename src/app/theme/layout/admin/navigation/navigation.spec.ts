import { getNavigationItems, NavigationItems } from './navigation';

describe('getNavigationItems', () => {
  let previousToken: string | null;

  function storeMenus(codes: string[], inactiveCodes: string[] = []): void {
    const menus = codes.map((code, index) => ({
      activo: !inactiveCodes.includes(code),
      code,
      fechaCreacion: '2026-01-01T00:00:00',
      fechaModificacion: null,
      icon: 'token-icon',
      menuId: index + 1,
      title: 'token-title',
      url: '/token-url'
    }));
    const payload = {
      sub: '1',
      username: 'test',
      email: 'test@example.com',
      rol: 'Administrador',
      menus: JSON.stringify(menus),
      iat: 1793066869,
      exp: 1793070469
    };
    const encoded = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    sessionStorage.setItem('token', `eyJhbGciOiJIUzI1NiJ9.${encoded}.c2lnbmF0dXJl`);
  }

  beforeEach(() => {
    previousToken = sessionStorage.getItem('token');
    sessionStorage.removeItem('token');
  });

  afterEach(() => {
    if (previousToken === null) {
      sessionStorage.removeItem('token');
    } else {
      sessionStorage.setItem('token', previousToken);
    }
  });

  it('shows no menus without a token', () => {
    expect(getNavigationItems()).toEqual([]);
  });

  it('filters by code, preserves catalog order and local menu metadata', () => {
    storeMenus(['usuarios', 'cita', 'unknown']);
    const result = getNavigationItems();
    expect(result.length).toBe(1);
    expect(result[0].children?.map((item) => item.id)).toEqual(['cita', 'usuarios']);
    expect(result[0].children?.[0]).toEqual(NavigationItems[0].children?.[0]);
    expect(result[0].children?.[1].url).toBe('/inicio/usuarios');
  });

  it('includes all nine system menus when authorized', () => {
    const codes = ['cita', 'clientes', 'especializaciones', 'formulas', 'historias', 'mascotas', 'medicamentos', 'medicos', 'usuarios'];
    storeMenus(codes);
    expect(getNavigationItems()[0].children?.map((item) => item.id)).toEqual(codes);
  });

  it('excludes inactive menus and removes empty groups', () => {
    storeMenus(['cita', 'clientes'], ['cita']);
    expect(getNavigationItems()[0].children?.map((item) => item.id)).toEqual(['clientes']);
    storeMenus(['cita'], ['cita']);
    expect(getNavigationItems()).toEqual([]);
    storeMenus([]);
    expect(getNavigationItems()).toEqual([]);
  });

  it('does not mutate the catalog or reuse previous permissions', () => {
    const original = JSON.stringify(NavigationItems);
    storeMenus(['cita']);
    const first = getNavigationItems();
    first[0].children[0].title = 'changed';
    storeMenus(['clientes']);
    expect(getNavigationItems()[0].children?.map((item) => item.id)).toEqual(['clientes']);
    expect(JSON.stringify(NavigationItems)).toBe(original);
  });

  it('reports invalid tokens and fails closed', () => {
    const log = spyOn(console, 'error');
    sessionStorage.setItem('token', 'invalid');
    expect(getNavigationItems()).toEqual([]);
    expect(log).toHaveBeenCalledWith('No fue posible obtener los menus del token JWT', jasmine.any(Error));
  });

  it('filters nested collapses and removes empty ones without mutating them', () => {
    const catalog = NavigationItems[0].children;
    NavigationItems[0].children = [
      { id: 'nested', title: 'Nested', type: 'collapse', children: [catalog[0]] },
      { id: 'empty', title: 'Empty', type: 'collapse', children: [catalog[1]] }
    ];
    try {
      storeMenus(['cita']);
      const result = getNavigationItems()[0].children;
      expect(result.length).toBe(1);
      expect(result[0].children?.map((item) => item.id)).toEqual(['cita']);
    } finally {
      NavigationItems[0].children = catalog;
    }
  });
});
