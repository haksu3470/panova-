import { test } from 'node:test';
import assert from 'node:assert/strict';
import { END_REASONS, METRIC_KEYS, formatMetric, processMetricsLabels } from './processMetrics.ts';

test('every language labels every metric and end reason', () => {
  for (const [lang, l] of Object.entries(processMetricsLabels)) {
    for (const k of METRIC_KEYS) assert.ok(l.metrics[k], `${lang} metric ${k}`);
    for (const r of END_REASONS) assert.ok(l.reasons[r], `${lang} reason ${r}`);
  }
});

test('formatMetric shows days, percent by language, and a dash without data', () => {
  assert.equal(formatMetric({ metric: 'days_permit_to_visa_median', value: '30.0', sample: 1 }, 'en'), '30 days');
  assert.equal(formatMetric({ metric: 'visa_approval_rate', value: 66.7, sample: 3 }, 'tr'), '%66.7');
  assert.equal(formatMetric({ metric: 'retention_6m', value: '50', sample: 2 }, 'en'), '50%');
  assert.equal(formatMetric({ metric: 'retention_12m', value: null, sample: 0 }, 'en'), '—');
  assert.equal(formatMetric(undefined, 'mk'), '—');
});
