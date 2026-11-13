# ============================================================
#  Dockerfile del frontend - Clinica DDSF (Angular 19)
# ============================================================
#
#  Construccion en dos etapas:
#
#   Etapa 1 "build": trae Node, instala las dependencias y compila la
#     aplicacion Angular en modo produccion. El resultado son archivos
#     estaticos (HTML, CSS, JS) en la carpeta dist/.
#
#   Etapa 2 "runtime": trae Nginx, un servidor web ligero, y copia esos
#     archivos estaticos para servirlos. La imagen final no incluye Node
#     ni el codigo fuente: solo los archivos ya compilados y el servidor.
# ============================================================

# ---------- Etapa 1: construccion ----------
FROM node:20-alpine AS build
WORKDIR /app

# Se copian primero los manifiestos de dependencias y se instalan.
# Docker cachea esta capa: si package.json no cambia, no se reinstala.
COPY package.json package-lock.json ./
RUN npm ci

# Se copia el resto del proyecto y se construye en modo produccion.
COPY . .
RUN npm run build

# ---------- Etapa 2: ejecucion con Nginx ----------
FROM nginx:1.27-alpine

# Configuracion de Nginx adaptada a una aplicacion de pagina unica (SPA):
# cualquier ruta desconocida se redirige a index.html para que el enrutador
# de Angular la resuelva.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Se copian los archivos compilados de Angular al directorio que sirve Nginx.
# El build de este proyecto genera la salida directamente en dist/.
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx escucha en el puerto 80 dentro del contenedor.
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
