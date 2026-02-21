# Runtime image only: expects pre-built .next/ from CI
FROM node:24-alpine

# curl for Coolify healthcheck
RUN apk add --no-cache curl

# Create non-root user before any file operations
RUN addgroup -g 1001 -S appgroup && adduser -u 1001 -S appuser -G appgroup

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Copy standalone output + static assets from CI build
COPY .next/standalone ./
COPY public ./public
COPY .next/static ./.next/static

# Prisma schema, config + migrations for running migrations at startup
# (standalone output includes the runtime client but not the CLI)
COPY prisma ./prisma
COPY prisma.config.ts* ./
RUN npm install --no-save --ignore-scripts prisma@7

# Copy only the whitelisted script files (avoids CopyIgnoredFile warnings)
COPY scripts/entrypoint.sh ./scripts/entrypoint.sh
COPY scripts/healthcheck.sh ./scripts/healthcheck.sh
RUN chmod +x ./scripts/entrypoint.sh ./scripts/healthcheck.sh

# Transfer ownership to non-root user, then drop privileges
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=5s --timeout=5s --retries=10 --start-period=30s \
  CMD ./scripts/healthcheck.sh

CMD ["./scripts/entrypoint.sh"]
