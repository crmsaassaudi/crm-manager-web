FROM node:22.21.1-alpine AS deps

WORKDIR /usr/src/app

ENV HUSKY=0

COPY package*.json ./
RUN npm ci --legacy-peer-deps

FROM node:22.21.1-alpine AS build

WORKDIR /usr/src/app

ENV HUSKY=0

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM nginx:1.29-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

EXPOSE 4201

CMD ["nginx", "-g", "daemon off;"]
