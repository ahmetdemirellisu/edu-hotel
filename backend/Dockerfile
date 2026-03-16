FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

ENV PORT=9004

EXPOSE 9004
CMD ["npm", "start"]