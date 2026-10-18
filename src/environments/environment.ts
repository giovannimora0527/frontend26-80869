import packageInfo from '../../package.json';

export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/clinica/v1',
  apiUrlAuth: 'http://localhost:8080/clinica/v1',  // ← Agrega esta línea
  appVersion: packageInfo.version
};