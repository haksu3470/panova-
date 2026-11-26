const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Candidate portal opened by staff: `/candidate?as=<candidate id>`.
 * Returns the id only when it is a UUID; the page still checks is_staff()
 * before using it, and RLS decides what the staff member may read.
 */
export function staffViewCandidateId(search: string): string | null {
  const id = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('as');
  return id && UUID.test(id) ? id : null;
}

/** Link from the staff candidate file to that candidate's portal view. */
export function candidatePortalViewHref(candidateId: string): string {
  return `/candidate?as=${encodeURIComponent(candidateId)}`;
}

export const staffViewLabels: Record<'tr' | 'en' | 'sq' | 'ar' | 'mk', {
  banner: string;
  open: string;
  memberLabel: string;
  on: string;
  off: string;
  always: string;
  failed: string;
}> = {
  tr: {
    banner: 'Personel görünümü: adayın portalını onun gördüğü gibi izliyorsunuz. Salt okunur; teklif yanıtlanamaz, bilgi değiştirilemez.',
    open: 'Aday portalında gör',
    memberLabel: 'Aday portalını görüntüleyebilir',
    on: 'İzin ver',
    off: 'Kapalı',
    always: 'Üst yönetim her zaman görüntüleyebilir.',
    failed: 'İzin kaydedilemedi.',
  },
  en: {
    banner: 'Staff view: you see the candidate portal as the candidate does. Read only; offers cannot be answered and nothing can be changed.',
    open: 'View candidate portal',
    memberLabel: 'Can view candidate portals',
    on: 'Allow',
    off: 'Off',
    always: 'Upper management can always view.',
    failed: 'The permission could not be saved.',
  },
  sq: {
    banner: 'Pamja e stafit: e shihni portalin e kandidatit si ai. Vetëm për lexim; ofertat nuk mund të përgjigjen dhe asgjë nuk ndryshon.',
    open: 'Shiko portalin e kandidatit',
    memberLabel: 'Mund të shohë portalin e kandidatit',
    on: 'Lejo',
    off: 'Joaktiv',
    always: 'Menaxhimi i lartë mund të shohë gjithmonë.',
    failed: 'Leja nuk u ruajt.',
  },
  ar: {
    banner: 'عرض الموظفين: ترى بوابة المرشح كما يراها. للقراءة فقط؛ لا يمكن الرد على العروض ولا تغيير أي شيء.',
    open: 'عرض بوابة المرشح',
    memberLabel: 'يمكنه عرض بوابة المرشح',
    on: 'السماح',
    off: 'معطّل',
    always: 'الإدارة العليا يمكنها العرض دائمًا.',
    failed: 'تعذّر حفظ الإذن.',
  },
  mk: {
    banner: 'Приказ за персонал: го гледате порталот на кандидатот како него. Само за читање; понудите не може да се одговорат и ништо не се менува.',
    open: 'Види портал на кандидатот',
    memberLabel: 'Може да го гледа порталот на кандидатот',
    on: 'Дозволи',
    off: 'Исклучено',
    always: 'Највисокото раководство секогаш може да гледа.',
    failed: 'Дозволата не може да се зачува.',
  },
};
