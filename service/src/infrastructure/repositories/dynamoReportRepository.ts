import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import type {
  CandidateQuery,
  ListReportsQuery,
  ReportRepository,
} from "../../application/ports.js";
import { boundingBox } from "../../domain/geoBounds.js";
import type { Report } from "../../domain/report.js";

interface DynamoItem {
  id: string;
  device_id: string;
  issue_type: string;
  latitude: number;
  longitude: number;
  note: string | null;
  photo_key: string | null;
  observed_at: string;
  created_at: string;
  country: string;
  is_correlated: boolean;
}

function toItem(report: Report): DynamoItem {
  return {
    id: report.id,
    device_id: report.deviceId,
    issue_type: report.issueType,
    latitude: report.latitude,
    longitude: report.longitude,
    note: report.note,
    photo_key: report.photoKey,
    observed_at: report.observedAt,
    created_at: report.createdAt,
    country: report.country,
    is_correlated: report.isCorrelated,
  };
}

function toReport(item: DynamoItem): Report {
  return {
    id: item.id,
    deviceId: item.device_id,
    issueType: item.issue_type as Report["issueType"],
    latitude: item.latitude,
    longitude: item.longitude,
    note: item.note,
    photoKey: item.photo_key,
    observedAt: item.observed_at,
    createdAt: item.created_at,
    country: item.country,
    isCorrelated: item.is_correlated ?? false,
  };
}

export interface DynamoConfig {
  tableName: string;
  /** GSI with partition key `issue_type` and sort key `created_at`. */
  issueCreatedIndex: string;
}

/**
 * DynamoDB implementation of ReportRepository. Demonstrates that switching the
 * persistence backend is a composition-root change only: candidates are fetched
 * with a Query on the (issue_type, created_at) GSI plus a bounding-box filter,
 * and exact geo/time logic stays in the shared domain layer.
 */
export class DynamoReportRepository implements ReportRepository {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly config: DynamoConfig,
  ) {}

  async save(report: Report): Promise<void> {
    await this.client.send(
      new PutCommand({ TableName: this.config.tableName, Item: toItem(report) }),
    );
  }

  async getById(id: string): Promise<Report | null> {
    const res = await this.client.send(
      new GetCommand({ TableName: this.config.tableName, Key: { id } }),
    );
    return res.Item ? toReport(res.Item as DynamoItem) : null;
  }

  async findCandidates(query: CandidateQuery): Promise<Report[]> {
    const box = boundingBox(query.center, query.radiusKm);
    const res = await this.client.send(
      new QueryCommand({
        TableName: this.config.tableName,
        IndexName: this.config.issueCreatedIndex,
        KeyConditionExpression: "issue_type = :t AND created_at >= :since",
        FilterExpression:
          "latitude BETWEEN :minLat AND :maxLat AND longitude BETWEEN :minLng AND :maxLng",
        ExpressionAttributeValues: {
          ":t": query.issueType,
          ":since": query.since.toISOString(),
          ":minLat": box.minLat,
          ":maxLat": box.maxLat,
          ":minLng": box.minLng,
          ":maxLng": box.maxLng,
        },
      }),
    );
    return (res.Items ?? []).map((i) => toReport(i as DynamoItem));
  }

  async markCorrelated(id: string): Promise<void> {
    await this.client.send(
      new UpdateCommand({
        TableName: this.config.tableName,
        Key: { id },
        UpdateExpression: "SET is_correlated = :t",
        ExpressionAttributeValues: { ":t": true },
      }),
    );
  }

  async list(query: ListReportsQuery): Promise<Report[]> {
    // A scan with in-memory filtering keeps the adapter simple; a production
    // deployment would use a GSI/partition strategy for the dashboard queries.
    const res = await this.client.send(
      new ScanCommand({ TableName: this.config.tableName }),
    );
    let items = (res.Items ?? []).map((i) => toReport(i as DynamoItem));
    if (query.issueType) items = items.filter((r) => r.issueType === query.issueType);
    if (query.since) {
      const since = query.since.getTime();
      items = items.filter((r) => new Date(r.createdAt).getTime() >= since);
    }
    if (query.box) {
      const b = query.box;
      items = items.filter(
        (r) =>
          r.latitude >= b.minLat &&
          r.latitude <= b.maxLat &&
          r.longitude >= b.minLng &&
          r.longitude <= b.maxLng,
      );
    }
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items.slice(0, query.limit ?? 1000);
  }
}
