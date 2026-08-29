import pg from "pg";
import {
  DEFAULT_CORRELATION_CONFIG,
  type CorrelationConfig,
} from "../application/config.js";
import type { ImageStore, MapRenderer, ReportRepository, SocialPoster } from "../application/ports.js";
import { ProcessReportUseCase } from "../application/processReport.js";
import { SubmitReportUseCase } from "../application/submitReport.js";
import { ApiKeyAuthenticator, type ApiKeyMap } from "../infrastructure/auth/apiKeyAuthenticator.js";
import {
  FakeMapRenderer,
  FakeSocialPoster,
  InMemoryImageStore,
  RandomIdGenerator,
  SystemClock,
} from "../infrastructure/fakes.js";
import { JapanPoliceDirectory } from "../infrastructure/police/japanPoliceDirectory.js";
import { InMemoryReportRepository } from "../infrastructure/repositories/inMemoryReportRepository.js";
import {
  PostgresReportRepository,
  ensureSchema,
} from "../infrastructure/repositories/postgresReportRepository.js";
import { StaticMapRenderer } from "../infrastructure/map/staticMapRenderer.js";
import { createHttpApp } from "../interfaces/http/server.js";
import type { Express } from "express";

type Env = Record<string, string | undefined>;

export interface Container {
  app: Express;
  repository: ReportRepository;
  /** Runs one-time startup work (e.g. DB schema). */
  init(): Promise<void>;
  /** Releases resources (e.g. DB pool). */
  shutdown(): Promise<void>;
}

function parseApiTokens(raw: string | undefined): ApiKeyMap {
  if (!raw) return { "dev-mobile-token": "dev-mobile-app" };
  const map: ApiKeyMap = {};
  for (const pair of raw.split(",")) {
    const [token, client] = pair.split(":");
    if (token && client) map[token.trim()] = client.trim();
  }
  return map;
}

export function buildContainer(env: Env = process.env): Container {
  const country = env.COUNTRY ?? "JP";
  const config: CorrelationConfig = DEFAULT_CORRELATION_CONFIG;

  const { repository, init, shutdown } = buildRepository(env);
  const imageStore = buildImageStore(env);
  const socialPoster = buildSocialPoster(env);
  const mapRenderer = buildMapRenderer(env);

  const processor = new ProcessReportUseCase({
    repository,
    mapRenderer,
    socialPoster,
    policeDirectory: new JapanPoliceDirectory(),
    config,
  });

  const submit = new SubmitReportUseCase({
    repository,
    imageStore,
    clock: new SystemClock(),
    idGenerator: new RandomIdGenerator(),
    processor,
    country,
  });

  const authenticator = new ApiKeyAuthenticator(parseApiTokens(env.API_TOKENS));
  const app = createHttpApp({ submit, authenticator });

  return { app, repository, init, shutdown };
}

function buildRepository(env: Env): {
  repository: ReportRepository;
  init(): Promise<void>;
  shutdown(): Promise<void>;
} {
  const backend = env.REPORT_BACKEND ?? (env.DATABASE_URL ? "postgres" : "memory");

  if (backend === "postgres") {
    const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
    return {
      repository: new PostgresReportRepository(pool),
      init: () => ensureSchema(pool),
      shutdown: () => pool.end(),
    };
  }

  // DynamoDB is available as a drop-in (see DynamoReportRepository); it requires
  // AWS SDK client construction and is selected only when explicitly configured.
  const repository = new InMemoryReportRepository();
  return { repository, init: async () => {}, shutdown: async () => {} };
}

function buildImageStore(_env: Env): ImageStore {
  // S3ImageStore is available; default to in-memory to avoid external calls.
  return new InMemoryImageStore();
}

function buildSocialPoster(_env: Env): SocialPoster {
  // XSocialPoster is available; default to a safe fake (which logs what it would
  // post) unless real credentials are wired in.
  return new FakeSocialPoster(true);
}

function buildMapRenderer(env: Env): MapRenderer {
  if (env.STATIC_MAP_URL) return new StaticMapRenderer(env.STATIC_MAP_URL);
  return new FakeMapRenderer();
}
