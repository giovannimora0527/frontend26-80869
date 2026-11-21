# Copiar en la raíz del repositorio FRONTEND (junto al package.json y angular.json).
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps
COPY . .
RUN npm run build -- --configuration production
# Angular 17+ genera dist/<proyecto>/browser; versiones anteriores dist/<proyecto>. Se localiza el index.html.
RUN mkdir /out && d="$(dirname "$(find dist -name index.html | head -1)")" && cp -r "$d"/. /out/

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /out /usr/share/nginx/html
EXPOSE 80
