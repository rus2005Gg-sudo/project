// Parallel frame capture: node scripts/render.js <outDir> <fps> <workers> [width=1080]
// Serves the project over http, opens N headless browsers, each renders every N-th frame (resume-safe: existing files are skipped).
const { chromium } = require("playwright"); const http = require("http"); const fs = require("fs"); const path = require("path");
const [, , OUT, FPS_, WORKERS_, WIDTH_] = process.argv; const FPS = +FPS_ || 30, NW = +WORKERS_ || 3, WIDTH = +WIDTH_ || 1080, HEIGHT = Math.round(WIDTH * 16 / 9);
const root = path.resolve(__dirname, ".."); fs.mkdirSync(OUT, { recursive: true });
const types = { ".html": "text/html", ".js": "text/javascript", ".woff2": "font/woff2", ".json": "application/json" };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split("?")[0]).replace(/^\/$/, "/index.html")); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" }); r.end(d); } }); });
srv.listen(0, async () => {
  const port = srv.address().port; const cue = JSON.parse(fs.readFileSync(path.join(root, "assets/cues.js"), "utf8").replace(/^window\.CUE=/, "").replace(/;$/, "")); const total = Math.ceil(cue.dur * FPS);
  console.log("frames", total, "fps", FPS, "workers", NW, "size", WIDTH + "x" + HEIGHT); const t0 = Date.now(); let done = 0;
  await Promise.all(Array.from({ length: NW }, async (_, w) => {
    const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"] });
    const p = await b.newPage({ viewport: { width: WIDTH, height: HEIGHT } }); p.on("pageerror", (e) => console.log("pageerror", e.message)); p.on("console", (m) => { const x = m.text(); if (x.includes("RENDERFAIL")) console.log(x); });
    await p.goto("http://localhost:" + port + "/index.html?w=" + WIDTH); await p.waitForFunction("window.__ready===true", null, { timeout: 600000 });
    if (WIDTH !== 1080) await p.addStyleTag({ content: "#root{transform:scale(" + WIDTH / 1080 + ");transform-origin:0 0}" });
    for (let i = w; i < total; i += NW) {
      const f = path.join(OUT, "f_" + String(i).padStart(5, "0") + ".jpg"); if (fs.existsSync(f)) { done++; continue; }
      await p.evaluate((t) => window.__seek(t), i / FPS); await p.screenshot({ path: f, type: "jpeg", quality: 95 }); done++;
      if (done % 20 === 0) { const el = (Date.now() - t0) / 1000; console.log(done + "/" + total, "elapsed " + Math.round(el) + "s", "eta " + Math.round(el / done * (total - done)) + "s"); }
    }
    await b.close();
  }));
  srv.close(); console.log("capture done in", Math.round((Date.now() - t0) / 1000), "s");
});
