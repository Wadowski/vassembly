FROM node:22-bookworm-slim

ARG MCPPROXY_VERSION=0.46.0
ADD https://github.com/smart-mcp-proxy/mcpproxy-go/releases/download/v${MCPPROXY_VERSION}/mcpproxy-${MCPPROXY_VERSION}-linux-amd64.tar.gz /tmp/mcpproxy.tgz
RUN tar xz -C /usr/local/bin -f /tmp/mcpproxy.tgz mcpproxy \
  && rm /tmp/mcpproxy.tgz

COPY mcpproxy.config.json /etc/mcpproxy/config.json

EXPOSE 8080

CMD ["mcpproxy", "serve", "--config", "/etc/mcpproxy/config.json"]
