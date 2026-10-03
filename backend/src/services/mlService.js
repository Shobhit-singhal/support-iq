import axios from 'axios';

// Read at call time, not module load: with ESM, all `import`s are evaluated
// before server.js runs dotenv.config(), so reading process.env at the top level
// here would capture undefined and pin the URL to the 8000 default.
export function mlServiceUrl() {
  return process.env.ML_SERVICE_URL || 'http://localhost:8000';
}

const FALLBACK_CLASSIFICATION = {
  category: 'General',
  priority: 'Medium',
  sentiment: 'Neutral',
  suggested_team: null,
};

// The ML service may not be up yet during dev/testing, or may be flaky in prod;
// ticket creation must never fail just because classification is unavailable.
export async function classify(text) {
  try {
    const { data } = await axios.post(
      `${mlServiceUrl()}/classify`,
      { text },
      { timeout: 5000 }
    );
    return {
      category: data.category ?? FALLBACK_CLASSIFICATION.category,
      priority: data.priority ?? FALLBACK_CLASSIFICATION.priority,
      sentiment: data.sentiment ?? FALLBACK_CLASSIFICATION.sentiment,
      suggested_team: data.suggested_team ?? null,
    };
  } catch (err) {
    console.warn(`ML service classify() failed, falling back to defaults: ${err.message}`);
    return { ...FALLBACK_CLASSIFICATION };
  }
}

export default { classify };
