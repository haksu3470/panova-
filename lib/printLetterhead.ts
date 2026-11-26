import { company } from './company';
import type { Language } from './dictionary';

/**
 * Panova letterhead for every printout (list exports in their own window and
 * the candidate page's offer / document sheet). One HTML builder, so both
 * look the same. Always the general Panova details (lib/company.ts); an
 * employer's printout adds "Prepared for: {company}", an offer adds the
 * offering employer. Text is in the language of whoever prints.
 * Every value is escaped.
 */

export const printLabels: Record<Language, {
  taxId: string;
  docNo: string;
  printedAt: string;
  printedBy: string;
  preparedFor: string;
  offeringEmployer: string;
  benefits: string;
  notes: string;
  signature: string;
  signName: string;
  signDate: string;
  signCandidate: string;
  signEmployer: string;
  signPanova: string;
  askSignature: string;
  confidential: string;
  staffView: string;
}> = {
  tr: {
    taxId: 'Vergi No',
    docNo: 'Belge No',
    printedAt: 'Yazdırma tarihi',
    printedBy: 'Yazdıran',
    preparedFor: 'Hazırlanan',
    offeringEmployer: 'Teklifi veren işveren',
    benefits: 'Sağlanan imkânlar',
    notes: 'Ek şartlar ve notlar',
    signature: 'İmza',
    signName: 'Ad Soyad',
    signDate: 'Tarih',
    signCandidate: 'Aday',
    signEmployer: 'İşveren',
    signPanova: 'Panova Group',
    askSignature: 'Çıktıya imza alanı eklensin mi?\n\nTamam: imza alanıyla · İptal: imza alanı olmadan',
    confidential: 'Bu belge kişisel veri içerir. Yalnızca ilgili işlem için kullanılmalı ve üçüncü kişilerle paylaşılmamalıdır.',
    staffView: 'Panova personeli',
  },
  en: {
    taxId: 'Tax ID',
    docNo: 'Document no.',
    printedAt: 'Printed on',
    printedBy: 'Printed by',
    preparedFor: 'Prepared for',
    offeringEmployer: 'Offering employer',
    benefits: 'Benefits provided',
    notes: 'Additional terms and notes',
    signature: 'Signature',
    signName: 'Full name',
    signDate: 'Date',
    signCandidate: 'Candidate',
    signEmployer: 'Employer',
    signPanova: 'Panova Group',
    askSignature: 'Add signature fields to the printout?\n\nOK: with signature fields · Cancel: without',
    confidential: 'This document contains personal data. Use it only for the related process and do not share it with third parties.',
    staffView: 'Panova staff',
  },
  sq: {
    taxId: 'Nr. tatimor',
    docNo: 'Nr. i dokumentit',
    printedAt: 'Data e printimit',
    printedBy: 'Printoi',
    preparedFor: 'Përgatitur për',
    offeringEmployer: 'Punëdhënësi që ofron',
    benefits: 'Përfitimet e ofruara',
    notes: 'Kushte dhe shënime shtesë',
    signature: 'Nënshkrimi',
    signName: 'Emri dhe mbiemri',
    signDate: 'Data',
    signCandidate: 'Kandidati',
    signEmployer: 'Punëdhënësi',
    signPanova: 'Panova Group',
    askSignature: 'Të shtohen fushat e nënshkrimit në printim?\n\nOK: me nënshkrim · Anulo: pa nënshkrim',
    confidential: 'Ky dokument përmban të dhëna personale. Përdoreni vetëm për procesin përkatës dhe mos e ndani me palë të treta.',
    staffView: 'Stafi i Panova',
  },
  ar: {
    taxId: 'الرقم الضريبي',
    docNo: 'رقم المستند',
    printedAt: 'تاريخ الطباعة',
    printedBy: 'طُبع بواسطة',
    preparedFor: 'أُعدّ لـ',
    offeringEmployer: 'صاحب العمل مقدم العرض',
    benefits: 'المزايا المقدمة',
    notes: 'شروط وملاحظات إضافية',
    signature: 'التوقيع',
    signName: 'الاسم الكامل',
    signDate: 'التاريخ',
    signCandidate: 'المرشح',
    signEmployer: 'صاحب العمل',
    signPanova: 'Panova Group',
    askSignature: 'هل تريد إضافة حقول التوقيع إلى المطبوع؟\n\nموافق: مع التوقيع · إلغاء: بدون توقيع',
    confidential: 'يحتوي هذا المستند على بيانات شخصية. استخدمه فقط للإجراء المعني ولا تشاركه مع أطراف ثالثة.',
    staffView: 'موظفو Panova',
  },
  mk: {
    taxId: 'ЕДБ',
    docNo: 'Бр. на документ',
    printedAt: 'Датум на печатење',
    printedBy: 'Испечатил',
    preparedFor: 'Подготвено за',
    offeringEmployer: 'Работодавач што нуди',
    benefits: 'Обезбедени поволности',
    notes: 'Дополнителни услови и белешки',
    signature: 'Потпис',
    signName: 'Име и презиме',
    signDate: 'Датум',
    signCandidate: 'Кандидат',
    signEmployer: 'Работодавач',
    signPanova: 'Panova Group',
    askSignature: 'Да се додадат полиња за потпис во печатењето?\n\nОК: со потпис · Откажи: без потпис',
    confidential: 'Овој документ содржи лични податоци. Користете го само за соодветниот процес и не го споделувајте со трети лица.',
    staffView: 'Персонал на Panova',
  },
};

export function escapePrintHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Short document code from a record id: "TKL-1A2B3C4D". */
export function printDocNo(prefix: string, id: string | null | undefined): string {
  const code = String(id || '').replace(/[^0-9a-f]/gi, '').slice(0, 8).toUpperCase();
  return code ? `${prefix}-${code}` : '';
}

export type LetterheadInput = {
  lang: Language;
  /** Page origin, so the logo also loads in a blank print window (about:blank). */
  origin: string;
  title: string;
  docNo?: string;
  printedAt: string;
  printedBy?: string;
  preparedFor?: string;
};

/** Styles shared by both print paths; class names are prefixed (pl-) so they never clash. */
export const LETTERHEAD_CSS = `
.pl-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 2px solid #166534; padding-bottom: 8px; margin-bottom: 10px; }
.pl-brand { display: flex; align-items: center; gap: 10px; }
.pl-brand img { height: 38px; width: auto; }
.pl-brand b { display: block; font-size: 15px; color: #14532d; }
.pl-brand span { display: block; font-size: 10px; color: #334155; }
.pl-contact { text-align: end; font-size: 9.5px; line-height: 1.45; color: #334155; }
.pl-title { font-size: 17px; font-weight: 700; margin: 6px 0 2px; color: #0f172a; }
.pl-meta { font-size: 10.5px; color: #334155; margin: 0 0 10px; }
.pl-meta b { color: #0f172a; }
.pl-sign { display: grid; grid-template-columns: repeat(var(--pl-cols, 2), 1fr); gap: 18px; margin-top: 22px; break-inside: avoid; page-break-inside: avoid; }
.pl-sign div { font-size: 10.5px; }
.pl-sign b { display: block; margin-bottom: 2px; }
.pl-sign span { display: block; border-bottom: 1px dotted #475569; padding-top: 16px; color: #334155; }
.pl-foot { margin-top: 18px; border-top: 1px solid #cbd5e1; padding-top: 6px; font-size: 9px; color: #475569; display: flex; justify-content: space-between; gap: 12px; }
`;

export function letterheadHtml(input: LetterheadInput): string {
  const l = printLabels[input.lang] || printLabels.en;
  const e = escapePrintHtml;
  const phone = company.phones[0]?.display || '';
  const meta = [
    input.docNo ? `${e(l.docNo)}: <b>${e(input.docNo)}</b>` : '',
    `${e(l.printedAt)}: <b>${e(input.printedAt)}</b>`,
    input.printedBy ? `${e(l.printedBy)}: <b>${e(input.printedBy)}</b>` : '',
    input.preparedFor ? `${e(l.preparedFor)}: <b>${e(input.preparedFor)}</b>` : '',
  ].filter(Boolean).join(' · ');
  return `<header class="pl-head">
  <div class="pl-brand"><img src="${e(input.origin.replace(/\/+$/, ''))}/logo.png" alt=""><div><b>${e(company.brandName)}</b><span>${e(company.shortName)}</span><span>Struga · Sivas · Dhaka</span></div></div>
  <div class="pl-contact">${e(company.address)}<br>EMBS ${e(company.embs)} · ${e(l.taxId)} ${e(company.taxId)}<br>${e(company.email)}${phone ? ` · ${e(phone)}` : ''}<br>panovagroup.org</div>
</header>
<div class="pl-title">${e(input.title)}</div>
<p class="pl-meta">${meta}</p>`;
}

/** Signature boxes: name, date and signature line per party. */
export function signatureHtml(lang: Language, parties: readonly string[]): string {
  const l = printLabels[lang] || printLabels.en;
  const e = escapePrintHtml;
  const boxes = parties.map((party) => `<div><b>${e(party)}</b><span>${e(l.signName)}:</span><span>${e(l.signDate)}:</span><span>${e(l.signature)}:</span></div>`).join('');
  return `<section class="pl-sign" style="--pl-cols:${Math.max(1, parties.length)}">${boxes}</section>`;
}

export function printFooterHtml(lang: Language): string {
  const l = printLabels[lang] || printLabels.en;
  return `<footer class="pl-foot"><span>${escapePrintHtml(l.confidential)}</span><span>${escapePrintHtml(company.brandName)} · panovagroup.org</span></footer>`;
}
