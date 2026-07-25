FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

ARG MCPPROXY_VERSION=0.40.0
RUN curl -fsSL "https://github.com/smart-mcp-proxy/mcpproxy-go/releases/download/v${MCPPROXY_VERSION}/mcpproxy_${MCPPROXY_VERSION}_linux_amd64.tar.gz" \
  | tar xz -C /usr/local/bin mcpproxy

COPY mcpproxy.config.json /etc/mcpproxy/config.json

EXPOSE 8080

CMD ["mcpproxy", "serve", "--config", "/etc/mcpproxy/config.json"]
