import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve("dist");
const host = "127.0.0.1";
const port = Number(process.env.PORT || 4175);
const types = { ".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8", ".jpg": "image/jpeg", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp" };

createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${host}:${port}`);
  const requestedPath = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  let filePath = resolve(root, `.${requestedPath}`);
  if (!filePath.startsWith(root)) { response.writeHead(403); response.end("Forbidden"); return; }
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) filePath = join(root, "index.html");
  response.writeHead(200, { "Content-Type": types[extname(filePath)] || "application/octet-stream" });
  createReadStream(filePath).pipe(response);
}).listen(port, host, () => console.log(`Tatanka premium preview running at http://${host}:${port}/`));
