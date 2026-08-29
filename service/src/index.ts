import { buildContainer } from "./composition/container.js";

const PORT = Number(process.env.SERVICE_PORT ?? 4000);

async function main() {
  const container = buildContainer(process.env);
  await container.init();

  const server = container.app.listen(PORT, () => {
    console.log(`[citizen-report-service] listening on http://localhost:${PORT}`);
    console.log(
      `[citizen-report-service] report backend: ${
        process.env.REPORT_BACKEND ?? (process.env.DATABASE_URL ? "postgres" : "memory")
      }`,
    );
  });

  const stop = async () => {
    server.close();
    await container.shutdown();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((err) => {
  console.error("[citizen-report-service] failed to start", err);
  process.exit(1);
});
