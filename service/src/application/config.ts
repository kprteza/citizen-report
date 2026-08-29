/** Tunable correlation parameters. Defaults target Japan but are configurable. */
export interface CorrelationConfig {
  movement: {
    /** Candidate search radius in km (spec: 10 or 20 km). */
    radiusKm: number;
    /** Plausible max travel speed for a biker gang, km/h. */
    maxSpeedKmh: number;
    /** How far back to look for prior sightings, milliseconds. */
    windowMs: number;
  };
  colocation: {
    /** Two reports are "at the same location" within this many metres. */
    radiusMeters: number;
    /** How far back to look for co-located reports, milliseconds. */
    windowMs: number;
  };
}

export const DEFAULT_CORRELATION_CONFIG: CorrelationConfig = {
  movement: {
    radiusKm: 20,
    maxSpeedKmh: 80,
    windowMs: 3 * 60 * 60 * 1000, // 3 hours
  },
  colocation: {
    radiusMeters: 50,
    windowMs: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
};
