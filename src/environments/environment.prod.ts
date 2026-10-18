import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: true,
  apiUrl: 'http://localhost:8080/clinica/v1',
  apiUrlAuth: 'http://localhost:8080/clinica/v1'
};
