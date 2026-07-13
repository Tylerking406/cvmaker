# Build stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# BACKEND_URL is used by next.config.ts at build time for the fallback rewrite.
# Override at runtime via docker-compose env — must also be passed here as a
# build arg so the standalone server picks it up.
ARG BACKEND_URL=http://api:5133
ENV BACKEND_URL=${BACKEND_URL}

RUN npm run build

# Runtime stage — Next.js standalone output
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
