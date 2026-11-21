import { getJwtMenus, getJwtPayload, JwtMenu, JwtPayload } from './jwt.util';

describe('JWT utilities', () => {
  const menu: JwtMenu = {
    activo: true,
    code: 'cita',
    fechaCreacion: '2026-01-01T00:00:00',
    fechaModificacion: null,
    icon: 'bi bi-calendar',
    menuId: 1,
    title: 'Gesti\u00f3n de citas',
    url: '/inicio/citas'
  };
  let payload: JwtPayload;
  let previousToken: string | null;

  function storePayload(value: unknown): void {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    const encoded = btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    sessionStorage.setItem('token', `eyJhbGciOiJIUzI1NiJ9.${encoded}.c2lnbmF0dXJl`);
  }

  beforeEach(() => {
    previousToken = sessionStorage.getItem('token');
    sessionStorage.removeItem('token');
    payload = {
      sub: '1',
      username: 'test',
      email: 'test@example.com',
      rol: 'Administrador',
      menus: JSON.stringify([menu]),
      iat: 1793066869,
      exp: 1793070469
    };
  });

  afterEach(() => {
    if (previousToken === null) {
      sessionStorage.removeItem('token');
    } else {
      sessionStorage.setItem('token', previousToken);
    }
  });

  it('returns null and no menus when there is no token', () => {
    expect(getJwtPayload()).toBeNull();
    expect(getJwtMenus()).toEqual([]);
  });

  it('decodes the exact payload shape, preserving the serialized menus and UTF-8', () => {
    payload.username = 'Jos\u00e9 \u{1F43E}';
    storePayload(payload);
    expect(getJwtPayload()).toEqual(payload);
    expect(getJwtMenus()).toEqual([menu]);
  });

  it('reads the current session token on every call', () => {
    storePayload(payload);
    expect(getJwtPayload()?.username).toBe('test');
    storePayload({ ...payload, username: 'other' });
    expect(getJwtPayload()?.username).toBe('other');
  });

  it('accepts an empty menu list', () => {
    storePayload({ ...payload, menus: '[]' });
    expect(getJwtMenus()).toEqual([]);
  });

  it('rejects malformed or empty tokens', () => {
    for (const token of ['', 'invalid', 'a.b', 'a..c', 'a.%%%.c', 'a.b.c.d']) {
      sessionStorage.setItem('token', token);
      expect(() => getJwtPayload()).toThrow();
    }
  });

  it('rejects non-JSON and invalid UTF-8 payloads', () => {
    for (const encoded of [btoa('not json'), '_w']) {
      sessionStorage.setItem('token', `a.${encoded}.c`);
      expect(() => getJwtPayload()).toThrow();
    }
  });

  it('rejects missing claims and wrong claim types', () => {
    for (const value of [null, [], {}, { ...payload, exp: '123' }, { ...payload, menus: [] }]) {
      storePayload(value);
      expect(() => getJwtPayload()).toThrowError('El contenido del token JWT es invalido');
    }
  });

  it('rejects invalid serialized menus instead of returning permissions', () => {
    for (const menus of ['invalid json', '{}', 'null', '[null]', JSON.stringify([{ ...menu, activo: 'true' }])]) {
      storePayload({ ...payload, menus });
      expect(() => getJwtMenus()).toThrow();
    }
  });
});
