# Use a more specific tag and add retry logic
FROM node:18-alpine AS base

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies with retry logic
RUN npm install --maxsockets 1 --fetch-retries 5 --fetch-retry-mintimeout 20000 --fetch-retry-maxtimeout 120000 || \
    (sleep 5 && npm install --maxsockets 1 --fetch-retries 5 --fetch-retry-mintimeout 20000 --fetch-retry-maxtimeout 120000) || \
    (sleep 10 && npm install --maxsockets 1 --fetch-retries 5 --fetch-retry-mintimeout 20000 --fetch-retry-maxtimeout 120000)

COPY . .

RUN npm run build

EXPOSE 50056

CMD ["npm", "run", "start:dev"]