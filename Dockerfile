# Runtime image only: expects pre-built .next/ from CI
FROM node:24-alpine

# curl for Coolify healthcheck
RUN apk add --no-cache curl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Copy standalone output + static assets from CI build
COPY .next/standalone ./
COPY public ./public
COPY .next/static ./.next/static

# Prisma schema + migrations for running migrations at startup
# (standalone output includes the runtime client but not the CLI)
COPY prisma ./prisma
RUN npm install -g prisma@7 --ignore-scripts

# Entrypoint + healthcheck scripts (run migrations before start)
COPY scripts ./scripts
RUN chmod +x ./scripts/entrypoint.sh ./scripts/healthcheck.sh

EXPOSE 3000

HEALTHCHECK --interval=5s --timeout=5s --retries=10 --start-period=30s \
  CMD ./scripts/healthcheck.sh

CMD ["./scripts/entrypoint.sh"]
