export interface LoginRq {
  username: string;
  password: string;
}

export interface AuthRS {
  usuarioId: number;
  login: boolean;
  username: string;
  emailEnmascarado?: string;
}

export interface ValidarOtpRq {
  usuarioId: number;
  codigo: string;
}

export interface MenuRS {
  menuId: number;
  code: string;
  title: string;
  url: string;
  icon: string;
}

export interface UsuarioSesion {
  id: number;
  username: string;
  email: string;
  rol: number;
  perfil?: string;
}

export interface LoginRS {
  token: string;
  expiraEnSegundos: number;
  usuario: UsuarioSesion;
  menuList: MenuRS[];
}
