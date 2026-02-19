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

EXPOSE 3000

HEALTHCHECK --interval=5s --timeout=5s --retries=10 --start-period=30s \
  CMD curl -fsS http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
