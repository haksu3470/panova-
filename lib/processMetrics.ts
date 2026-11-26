import type { Language } from './dictionary';

/** Rows of public.staff_process_metrics(p_include_demo). */
export interface ProcessMetricRow {
  metric: string;
  value: number | string | null;
  sample: number;
}

export const METRIC_KEYS = [
  'days_permit_to_visa_median',
  'visa_approval_rate',
  'retention_3m',
  'retention_6m',
  'retention_12m',
] as const;
export type MetricKey = (typeof METRIC_KEYS)[number];

/** Values of job_candidates.employment_end_reason (check constraint, migration 20261126120000). */
export const END_REASONS = ['resigned', 'absconded', 'employer_terminated', 'contract_completed', 'other'] as const;
export type EndReason = (typeof END_REASONS)[number];

interface Labels {
  title: string;
  hint: string;
  includeDemo: string;
  sample: string;
  days: string;
  metrics: Record<MetricKey, string>;
  endTitle: string;
  endDate: string;
  endReason: string;
  endSave: string;
  endClear: string;
  endSaved: string;
  endNeedBoth: string;
  reasons: Record<EndReason, string>;
  toggleOn: string;
  toggleOff: string;
  toggleHint: string;
  offNote: string;
  toggleSaved: string;
  toggleFailed: string;
  byAll: string;
  byCountry: string;
  byEmployer: string;
  groupCountry: string;
  groupEmployer: string;
  unknown: string;
  noGroups: string;
}

export const processMetricsLabels: Record<Language, Labels> = {
  tr: {
    title: 'Süreç metrikleri',
    hint: 'Aşama geçmişi 26.11.2026 itibarıyla kaydediliyor; önceki adımlar sayılmaz.',
    includeDemo: 'Demo kayıtları dahil et',
    sample: '{n} aday',
    days: '{n} gün',
    metrics: {
      days_permit_to_visa_median: 'Çalışma izni başvurusundan vize onayına (medyan)',
      visa_approval_rate: 'Vize onay oranı',
      retention_3m: '3. ayda işte kalma',
      retention_6m: '6. ayda işte kalma',
      retention_12m: '12. ayda işte kalma',
    },
    endTitle: 'İşten ayrılma',
    endDate: 'Ayrılma tarihi',
    endReason: 'Neden',
    endSave: 'Kaydet',
    endClear: 'Kaydı kaldır',
    endSaved: 'İşten ayrılma kaydedildi.',
    endNeedBoth: 'Tarih ve neden birlikte girilmeli.',
    reasons: {
      resigned: 'İstifa etti',
      absconded: 'İşi bırakıp ayrıldı (kaçtı)',
      employer_terminated: 'İşveren sözleşmeyi feshetti',
      contract_completed: 'Sözleşme tamamlandı',
      other: 'Diğer',
    },
    toggleOn: 'Açık',
    toggleOff: 'Kapalı',
    toggleHint: 'Kapalıyken metrik kartları ve aday dosyasındaki İşten ayrılma kutusu gizlenir; aşama geçmişi kaydedilmeye devam eder.',
    offNote: 'Süreç metrikleri kapalı. Ekranlar eski haliyle çalışıyor.',
    toggleSaved: 'Ayar kaydedildi.',
    toggleFailed: 'Ayar kaydedilemedi.',
    byAll: 'Toplam',
    byCountry: 'Ülkeye göre',
    byEmployer: 'İşverene göre',
    groupCountry: 'Ülke',
    groupEmployer: 'İşveren',
    unknown: 'Belirtilmemiş',
    noGroups: 'Henüz kayıtlı aşama değişikliği yok.',
  },
  en: {
    title: 'Process metrics',
    hint: 'Stage history is recorded from 26 Nov 2026; earlier steps are not counted.',
    includeDemo: 'Include demo records',
    sample: '{n} candidates',
    days: '{n} days',
    metrics: {
      days_permit_to_visa_median: 'Work permit application to visa approval (median)',
      visa_approval_rate: 'Visa approval rate',
      retention_3m: 'Still working at 3 months',
      retention_6m: 'Still working at 6 months',
      retention_12m: 'Still working at 12 months',
    },
    endTitle: 'Employment ended',
    endDate: 'End date',
    endReason: 'Reason',
    endSave: 'Save',
    endClear: 'Remove record',
    endSaved: 'Employment end saved.',
    endNeedBoth: 'Enter both the date and the reason.',
    reasons: {
      resigned: 'Resigned',
      absconded: 'Left without notice (absconded)',
      employer_terminated: 'Terminated by employer',
      contract_completed: 'Contract completed',
      other: 'Other',
    },
    toggleOn: 'On',
    toggleOff: 'Off',
    toggleHint: 'When off, the metrics cards and the Employment ended box on the candidate file are hidden; stage history keeps being recorded.',
    offNote: 'Process metrics are off. Screens work as before.',
    toggleSaved: 'Setting saved.',
    toggleFailed: 'Setting could not be saved.',
    byAll: 'Total',
    byCountry: 'By country',
    byEmployer: 'By employer',
    groupCountry: 'Country',
    groupEmployer: 'Employer',
    unknown: 'Not specified',
    noGroups: 'No stage changes recorded yet.',
  },
  sq: {
    title: 'Treguesit e procesit',
    hint: 'Historiku i fazave regjistrohet nga 26.11.2026; hapat e mëparshëm nuk numërohen.',
    includeDemo: 'Përfshi të dhënat demo',
    sample: '{n} kandidatë',
    days: '{n} ditë',
    metrics: {
      days_permit_to_visa_median: 'Nga kërkesa për leje pune te miratimi i vizës (mesatarja)',
      visa_approval_rate: 'Shkalla e miratimit të vizës',
      retention_3m: 'Ende në punë në muajin e 3-të',
      retention_6m: 'Ende në punë në muajin e 6-të',
      retention_12m: 'Ende në punë në muajin e 12-të',
    },
    endTitle: 'Largimi nga puna',
    endDate: 'Data e largimit',
    endReason: 'Arsyeja',
    endSave: 'Ruaj',
    endClear: 'Hiq regjistrimin',
    endSaved: 'Largimi nga puna u ruajt.',
    endNeedBoth: 'Shkruani datën dhe arsyen bashkë.',
    reasons: {
      resigned: 'Dha dorëheqjen',
      absconded: 'U largua pa njoftim',
      employer_terminated: 'Punëdhënësi e ndërpreu kontratën',
      contract_completed: 'Kontrata përfundoi',
      other: 'Tjetër',
    },
    toggleOn: 'Aktiv',
    toggleOff: 'Joaktiv',
    toggleHint: 'Kur është joaktiv, kartat e treguesve dhe kutia Largimi nga puna fshihen; historiku i fazave vazhdon të regjistrohet.',
    offNote: 'Treguesit e procesit janë joaktivë. Ekranet punojnë si më parë.',
    toggleSaved: 'Cilësimi u ruajt.',
    toggleFailed: 'Cilësimi nuk u ruajt.',
    byAll: 'Gjithsej',
    byCountry: 'Sipas shtetit',
    byEmployer: 'Sipas punëdhënësit',
    groupCountry: 'Shteti',
    groupEmployer: 'Punëdhënësi',
    unknown: 'E papërcaktuar',
    noGroups: 'Ende nuk ka ndryshime fazash të regjistruara.',
  },
  ar: {
    title: 'مؤشرات العملية',
    hint: 'يُسجَّل سجل المراحل اعتبارًا من 26.11.2026؛ الخطوات السابقة غير محتسبة.',
    includeDemo: 'تضمين السجلات التجريبية',
    sample: '{n} مرشح',
    days: '{n} يوم',
    metrics: {
      days_permit_to_visa_median: 'من طلب تصريح العمل إلى الموافقة على التأشيرة (الوسيط)',
      visa_approval_rate: 'نسبة الموافقة على التأشيرة',
      retention_3m: 'ما زال يعمل بعد 3 أشهر',
      retention_6m: 'ما زال يعمل بعد 6 أشهر',
      retention_12m: 'ما زال يعمل بعد 12 شهرًا',
    },
    endTitle: 'انتهاء العمل',
    endDate: 'تاريخ الانتهاء',
    endReason: 'السبب',
    endSave: 'حفظ',
    endClear: 'إزالة السجل',
    endSaved: 'تم حفظ انتهاء العمل.',
    endNeedBoth: 'أدخل التاريخ والسبب معًا.',
    reasons: {
      resigned: 'استقال',
      absconded: 'غادر دون إشعار',
      employer_terminated: 'أنهى صاحب العمل العقد',
      contract_completed: 'اكتمل العقد',
      other: 'أخرى',
    },
    toggleOn: 'مفعّل',
    toggleOff: 'معطّل',
    toggleHint: 'عند التعطيل تُخفى بطاقات المؤشرات ومربع انتهاء العمل في ملف المرشح؛ ويستمر تسجيل سجل المراحل.',
    offNote: 'مؤشرات العملية معطّلة. تعمل الشاشات كما في السابق.',
    toggleSaved: 'تم حفظ الإعداد.',
    toggleFailed: 'تعذّر حفظ الإعداد.',
    byAll: 'الإجمالي',
    byCountry: 'حسب الدولة',
    byEmployer: 'حسب صاحب العمل',
    groupCountry: 'الدولة',
    groupEmployer: 'صاحب العمل',
    unknown: 'غير محدد',
    noGroups: 'لا توجد تغييرات مراحل مسجلة بعد.',
  },
  mk: {
    title: 'Показатели на процесот',
    hint: 'Историјата на фазите се бележи од 26.11.2026; претходните чекори не се бројат.',
    includeDemo: 'Вклучи демо записи',
    sample: '{n} кандидати',
    days: '{n} дена',
    metrics: {
      days_permit_to_visa_median: 'Од барање за работна дозвола до одобрена виза (медијана)',
      visa_approval_rate: 'Стапка на одобрени визи',
      retention_3m: 'Сè уште работи по 3 месеци',
      retention_6m: 'Сè уште работи по 6 месеци',
      retention_12m: 'Сè уште работи по 12 месеци',
    },
    endTitle: 'Престанок на работа',
    endDate: 'Датум на престанок',
    endReason: 'Причина',
    endSave: 'Зачувај',
    endClear: 'Отстрани запис',
    endSaved: 'Престанокот на работа е зачуван.',
    endNeedBoth: 'Внесете ги датумот и причината заедно.',
    reasons: {
      resigned: 'Даде отказ',
      absconded: 'Замина без најава',
      employer_terminated: 'Работодавачот го раскина договорот',
      contract_completed: 'Договорот заврши',
      other: 'Друго',
    },
    toggleOn: 'Вклучено',
    toggleOff: 'Исклучено',
    toggleHint: 'Кога е исклучено, картичките со показатели и полето Престанок на работа се скриени; историјата на фазите продолжува да се бележи.',
    offNote: 'Показателите на процесот се исклучени. Екраните работат како порано.',
    toggleSaved: 'Поставката е зачувана.',
    toggleFailed: 'Поставката не може да се зачува.',
    byAll: 'Вкупно',
    byCountry: 'По држава',
    byEmployer: 'По работодавач',
    groupCountry: 'Држава',
    groupEmployer: 'Работодавач',
    unknown: 'Неодредено',
    noGroups: 'Сè уште нема забележани промени на фази.',
  },
};

/** One display value per metric key: '—' when there is no data yet. */
export function formatMetric(row: ProcessMetricRow | undefined, lang: Language): string {
  const l = processMetricsLabels[lang];
  if (!row || row.value === null || row.value === '') return '—';
  const n = Number(row.value);
  if (!Number.isFinite(n)) return '—';
  const shown = Number.isInteger(n) ? String(n) : n.toFixed(1);
  if (row.metric === 'days_permit_to_visa_median') return l.days.replace('{n}', shown);
  return lang === 'tr' ? `%${shown}` : `${shown}%`;
}

/** Rows of public.staff_process_metrics_by(p_by, p_include_demo). */
export interface GroupedMetricRow extends ProcessMetricRow {
  group_key: string;
  group_label: string;
}

export type MetricGroupBy = 'all' | 'country' | 'employer';

/** One entry per group, its five metrics by key; named groups A–Z, the unknown group ('') last. */
export function groupMetricRows(rows: readonly GroupedMetricRow[]) {
  const groups = new Map<string, { key: string; label: string; metrics: Partial<Record<MetricKey, ProcessMetricRow>> }>();
  for (const row of rows) {
    const g = groups.get(row.group_key) || { key: row.group_key, label: row.group_label, metrics: {} };
    if ((METRIC_KEYS as readonly string[]).includes(row.metric)) g.metrics[row.metric as MetricKey] = row;
    groups.set(row.group_key, g);
  }
  return [...groups.values()].sort((a, b) => (a.key === '' ? 1 : b.key === '' ? -1 : a.label.localeCompare(b.label)));
}
