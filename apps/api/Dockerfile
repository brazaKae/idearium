# Idearium API — production image
# Build: docker build -f apps/api/Dockerfile -t idearium-api .
# Context esperado: raiz do monorepo

FROM node:20-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm ci --workspace=@idearium/api --include-workspace-root

FROM node:20-alpine AS builder
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY --from=deps /repo/apps/api/node_modules ./apps/api/node_modules
COPY tsconfig.base.json ./
COPY apps/api ./apps/api
WORKDIR /repo/apps/api
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S idearium && adduser -S idearium -G idearium
COPY --from=builder --chown=idearium:idearium /repo/apps/api/dist ./dist
COPY --from=builder --chown=idearium:idearium /repo/apps/api/node_modules ./node_modules
COPY --from=builder --chown=idearium:idearium /repo/apps/api/prisma ./prisma
COPY --from=builder --chown=idearium:idearium /repo/apps/api/package.json ./package.json
USER idearium
EXPOSE 3000
CMD ["node", "dist/main.js"]
