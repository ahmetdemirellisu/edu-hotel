# 1. Aşama: Derleme (Builder)
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . . 
RUN npm run build

# 2. Aşama: Yayına Alma (Production)
FROM nginx:stable-alpine

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
