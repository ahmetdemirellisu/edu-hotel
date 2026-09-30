FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

# D02: All upload directories under /app (non-root writable)
# Routes use UPLOAD_DIR env var (defaults to /app when not set)
RUN mkdir -p /app/paymentRecieptsPending/.tmp \
             /app/paymentRecieptsAprooved \
             /app/identityDocs/.tmp

# Run as non-root user for security
RUN chown -R node:node /app
USER node

ENV PORT=9004

EXPOSE 9004
CMD ["npm", "start"]
