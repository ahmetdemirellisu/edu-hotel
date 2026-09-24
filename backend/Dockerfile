FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

# Create upload directories that routes expect at ../../ relative to routes/
# Since routes are at /app/routes/, ../../ resolves to /
# We create them under /app instead and symlink
RUN mkdir -p /app/paymentRecieptsPending /app/paymentRecieptsAprooved /app/identityDocs \
    /paymentRecieptsPending /paymentRecieptsAprooved /identityDocs

# Run as non-root user for security
RUN chown -R node:node /app /paymentRecieptsPending /paymentRecieptsAprooved /identityDocs
USER node

ENV PORT=9004

EXPOSE 9004
CMD ["npm", "start"]
