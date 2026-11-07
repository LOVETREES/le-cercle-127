# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
ENV EXPO_NO_TELEMETRY=1
COPY package.json package-lock.json ./
# Le certificat est facultatif sur un Mac ; le cloud le fournit comme secret BuildKit.
RUN --mount=type=secret,id=proxy_ca \
    set -eu; \
    if [ -f /run/secrets/proxy_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca; fi; \
    npm ci --no-audit --no-fund --strict-ssl=true; \
    sha256sum package.json package-lock.json | sha256sum | cut -d ' ' -f 1 > node_modules/.c127-dependencies.sha256

FROM dependencies AS development
COPY . .
COPY --chmod=755 docker/entrypoint.sh /usr/local/bin/c127-expo
EXPOSE 8081
ENTRYPOINT ["c127-expo"]
CMD ["npx", "expo", "start", "--lan", "--port", "8081", "--max-workers", "2"]
