import http from "node:http";

export function createServer(port, handler) {
  const server = http.createServer((req, res) => handler(req, res));
  server.listen(port);
  return server;
}
