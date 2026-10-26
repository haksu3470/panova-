/**
 * Kuzey Makedonya’daki tüzel kişi: PANOVA TARIM DOO Struga (EMBS 7758812).
 * Panova Bangladeş (Dhaka), Türkiye (Sivas) ve Kuzey Makedonya’da (Struga) faaliyet gösterir.
 * Telefonlarda kişi adı yok. Sermaye ve pay oranları kamuya açık değildir.
 */
export const company = {
  shortName: 'PANOVA TARIM DOO Struga',
  shortNameMk: 'ПАНОВА ТАРИМ ДОО Струга',
  legalName: 'Друштво за производство трговија и услуги ПАНОВА ТАРИМ ДОО Струга',
  address: 'Ul. PARTIZANSKA Br. 2/1-30, Struga, North Macedonia',
  email: 'panova@panovagroup.org',
  embs: '7758812',
  taxId: '4026024543858',
  established: '27 Nisan 2024',
  managers: ['Mehmet Çitil', 'Hüseyin Aksu'] as const,
  phones: [
    { display: '+389 70 385 792', tel: '+38970385792' },
    { display: '+389 75 818 697', tel: '+38975818697' },
  ] as const,
  turkey: {
    label: 'Türkiye Ofisi',
    city: 'Sivas',
    addressLines: [
      'Gültepe Mahallesi 17. Sanayi Sokak No:14/7',
      'Merkez / Sivas, Türkiye',
    ] as const,
    phone: { display: '0545 364 4930', tel: '+905453644930' },
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
    phone: { display: '+880 1805 511473', tel: '+8801805511473' },
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
