const [appUrl] = process.argv.slice(2);

if (!appUrl) {
  process.stderr.write("usage: node scripts/watch-health.mts <app url>\n");
  process.exit(2);
}

const healthUrl = new URL("/api/health", appUrl).toString();
const startedAt = Date.now();
let requests = 0;
let failures = 0;

async function probe() {
  const at = new Date().toISOString();
  try {
    const response = await fetch(healthUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    requests += 1;
    if (!response.ok) {
      failures += 1;
      process.stdout.write(`${at} ${response.status}\n`);
    }
  } catch (error) {
    requests += 1;
    failures += 1;
    process.stdout.write(
      `${at} ${error instanceof Error ? error.message : String(error)}\n`,
    );
  }
}

const timer = setInterval(() => void probe(), 500);
process.stdout.write(`watching ${healthUrl} every 0.5 s, Ctrl+C to stop\n`);

process.on("SIGINT", () => {
  clearInterval(timer);
  const seconds = Math.round((Date.now() - startedAt) / 1000);
  process.stdout.write(
    `${requests} requests, ${failures} failures in ${seconds} s\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
});
