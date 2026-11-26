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

export const staffViewLabels: Record<'tr' | 'en' | 'sq' | 'ar' | 'mk', { banner: string; open: string }> = {
  tr: {
    banner: 'Personel görünümü: adayın portalını onun gördüğü gibi izliyorsunuz. Salt okunur; teklif yanıtlanamaz, bilgi değiştirilemez.',
    open: 'Aday portalında gör',
  },
  en: {
    banner: 'Staff view: you see the candidate portal as the candidate does. Read only; offers cannot be answered and nothing can be changed.',
    open: 'View candidate portal',
  },
  sq: {
    banner: 'Pamja e stafit: e shihni portalin e kandidatit si ai. Vetëm për lexim; ofertat nuk mund të përgjigjen dhe asgjë nuk ndryshon.',
    open: 'Shiko portalin e kandidatit',
  },
  ar: {
    banner: 'عرض الموظفين: ترى بوابة المرشح كما يراها. للقراءة فقط؛ لا يمكن الرد على العروض ولا تغيير أي شيء.',
    open: 'عرض بوابة المرشح',
  },
  mk: {
    banner: 'Приказ за персонал: го гледате порталот на кандидатот како него. Само за читање; понудите не може да се одговорат и ништо не се менува.',
    open: 'Види портал на кандидатот',
  },
};
