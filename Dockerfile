# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
ENV EXPO_NO_TELEMETRY=1
COPY package.json package-lock.json ./
# Le certificat est facultatif sur un Mac ; le cloud le fournit comme secret BuildKit.
RUN --mount=type=secret,id=proxy_ca \
    set -eu; \
    if [ -f /run/secrets/proxy_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca; fi; \
    npm ci --no-audit --no-fund --strict-ssl=true

FROM dependencies AS development
EXPOSE 8081
CMD ["npx", "expo", "start", "--lan", "--port", "8081", "--max-workers", "2"]
