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

test('groupMetricRows: one entry per group, unknown last, every language labels the breakdown', async () => {
  const { groupMetricRows } = await import('./processMetrics.ts');
  const row = (group_key: string, group_label: string, metric: string, value: number | null, sample: number) => ({ group_key, group_label, metric, value, sample });
  const groups = groupMetricRows([
    row('', '', 'visa_approval_rate', 0, 1),
    row('b', 'Zeta Ltd', 'retention_6m', 0, 1),
    row('a', 'Alfa DOO', 'retention_6m', 100, 1),
    row('a', 'Alfa DOO', 'visa_approval_rate', 100, 1),
  ]);
  assert.deepEqual(groups.map((g) => g.key), ['a', 'b', '']);
  assert.equal(groups[0].metrics.visa_approval_rate?.value, 100);
  for (const [lang, l] of Object.entries(processMetricsLabels)) {
    for (const k of ['byAll', 'byCountry', 'byEmployer', 'groupCountry', 'groupEmployer', 'unknown', 'noGroups'] as const) assert.ok(l[k], `${lang} ${k}`);
  }
});
