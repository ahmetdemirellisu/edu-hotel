# 1. Aşama: Derleme (Builder)
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_URL=/ehp/api
ARG VITE_BASE_PATH=/ehp
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BASE_PATH=$VITE_BASE_PATH

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# 2. Aşama: Yayına Alma (Production)
FROM nginx:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8004

CMD ["nginx", "-g", "daemon off;"]
