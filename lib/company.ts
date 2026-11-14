/**
 * Kuzey Makedonya’daki tüzel kişi: PANOVA TARIM DOO Struga (EMBS 7758812).
 * Panova Bangladeş (Dhaka), Türkiye (Sivas) ve Kuzey Makedonya’da (Struga) faaliyet gösterir.
 * Telefonlarda kişi adı yok. Sermaye ve pay oranları kamuya açık değildir.
 *
 * Telefonların tek kaynağı bu dosyadır: her numara bir kez E.164 (tel:) olarak
 * yazılır, ekrandaki boşluklu uluslararası biçim officePhone() ile ondan
 * üretilir. Ana sayfa, altbilgi, KVKK aydınlatma metni ve giriş sayfalarının
 * altbilgisi company.* üzerinden okur.
 */
export const turkeyOfficePhone = '+905453644930';

/** Digit groups after the country code, by calling code. */
const PHONE_GROUPS: Record<string, readonly number[]> = {
  '90': [3, 3, 2, 2], // +90 545 364 49 30
  '389': [2, 3, 3], // +389 70 385 792
  '880': [4, 6], // +880 1805 511473
};

/**
 * "+905453644930" -> "+90 545 364 49 30". Same international style for every
 * office; tel: links keep the number without spaces. An unknown code or
 * length is returned as written.
 */
export function formatPhoneDisplay(tel: string): string {
  const digits = tel.replace(/[^\d+]/g, '');
  for (const [code, groups] of Object.entries(PHONE_GROUPS)) {
    if (!digits.startsWith(`+${code}`)) continue;
    const rest = digits.slice(code.length + 1);
    if (rest.length !== groups.reduce((sum, size) => sum + size, 0)) return tel;
    const parts: string[] = [];
    let at = 0;
    for (const size of groups) {
      parts.push(rest.slice(at, at + size));
      at += size;
    }
    return `+${code} ${parts.join(' ')}`;
  }
  return tel;
}

/** A phone as shown and as dialled, from one E.164 value. */
export function officePhone(tel: string): { display: string; tel: string } {
  return { display: formatPhoneDisplay(tel), tel };
}

export const company = {
  /** Public brand, same in every locale. Registry names stay on legal surfaces. */
  brandName: 'Panova Group',
  shortName: 'PANOVA TARIM DOO Struga',
  shortNameMk: 'ПАНОВА ТАРИМ ДОО Струга',
  legalName: 'Друштво за производство трговија и услуги ПАНОВА ТАРИМ ДОО Струга',
  address: 'Ul. PARTIZANSKA Br. 2/1-30, Struga, North Macedonia',
  email: 'panova@panovagroup.org',
  embs: '7758812',
  taxId: '4026024543858',
  established: '27 Nisan 2024',
  managers: ['Mehmet Çitil', 'Hüseyin Aksu'] as const,
  phones: [officePhone('+38970385792'), officePhone('+38975818697')] as const,
  turkey: {
    label: 'Türkiye Ofisi',
    city: 'Sivas',
    addressLines: [
      'Gültepe Mahallesi 17. Sanayi Sokak No:14/7',
      'Merkez / Sivas, Türkiye',
    ] as const,
    phone: officePhone(turkeyOfficePhone),
    taxOffice: 'Site Vergi Dairesi',
    vkn: '1021016624',
    email: 'turkiye@panovagroup.org',
  },
  bangladesh: {
    label: 'Bangladeş Ofisi',
    city: 'Dhaka',
    addressLines: [
      'House 6, Road 10, Sector 13, Uttara',
      'Dhaka, Bangladesh',
    ] as const,
    phone: officePhone('+8801805511473'),
    email: 'bangladesh@panovagroup.org',
  },
  presence: [
    { country: 'Bangladeş', city: 'Dhaka' },
    { country: 'Türkiye', city: 'Sivas' },
    { country: 'Kuzey Makedonya', city: 'Struga' },
  ] as const,
};

export function presenceLabel(): string {
  return company.presence
    .map((place) => `${place.country} (${place.city})`)
    .join(' · ');
}
