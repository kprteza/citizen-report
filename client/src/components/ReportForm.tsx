import { useState } from "react";
import type { NewReport } from "../types";
import { CATEGORIES, SEVERITIES } from "../constants";

interface Props {
  onCreate: (report: NewReport) => Promise<void>;
}

const EMPTY: NewReport = {
  title: "",
  description: "",
  category: "pothole",
  severity: "medium",
  address: "",
  reporter_name: "",
};

export function ReportForm({ onCreate }: Props) {
  const [form, setForm] = useState<NewReport>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function update<K extends keyof NewReport>(key: K, value: NewReport[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      await onCreate({
        ...form,
        reporter_name: form.reporter_name.trim() || "Anonymous",
      });
      setForm(EMPTY);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card report-form" onSubmit={handleSubmit}>
      <h2>Report an issue</h2>
      <p className="form-hint">
        Spotted a problem in your neighborhood? Let the city know.
      </p>

      <label>
        Title
        <input
          type="text"
          required
          minLength={3}
          maxLength={120}
          placeholder="e.g. Large pothole on Main Street"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
        />
      </label>

      <label>
        Description
        <textarea
          required
          minLength={5}
          maxLength={2000}
          rows={3}
          placeholder="Describe the issue and its impact"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />
      </label>

      <div className="form-row">
        <label>
          Category
          <select
            value={form.category}
            onChange={(e) =>
              update("category", e.target.value as NewReport["category"])
            }
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Severity
          <select
            value={form.severity}
            onChange={(e) =>
              update("severity", e.target.value as NewReport["severity"])
            }
          >
            {SEVERITIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        Location / Address
        <input
          type="text"
          required
          minLength={3}
          maxLength={200}
          placeholder="e.g. Main St & 3rd Ave"
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
        />
      </label>

      <label>
        Your name (optional)
        <input
          type="text"
          maxLength={80}
          placeholder="Anonymous"
          value={form.reporter_name}
          onChange={(e) => update("reporter_name", e.target.value)}
        />
      </label>

      {error && <p className="form-error">{error}</p>}
      {success && (
        <p className="form-success">Thanks! Your report has been submitted.</p>
      )}

      <button type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit report"}
      </button>
    </form>
  );
}
