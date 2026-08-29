-- Schema for the Citizen Report service (RDS / PostgreSQL).
CREATE TABLE IF NOT EXISTS reports (
  id          TEXT PRIMARY KEY,
  device_id   TEXT NOT NULL,
  issue_type  TEXT NOT NULL,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  note        TEXT,
  photo_key   TEXT,
  observed_at TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL,
  country     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_type_created ON reports (issue_type, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_location ON reports (latitude, longitude);
