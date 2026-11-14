import type { Language } from './dictionary';

/**
 * Texts of the file picker (components/site/FilePicker.tsx). The browser's
 * own file box writes "Dosya Seç / Dosya seçilmedi" in the browser language,
 * whatever the page language is, so the native control is hidden and these
 * texts are shown instead.
 */
export type FilePickerCopy = { choose: string; none: string };

export const filePickerCopy: Record<Language, FilePickerCopy> = {
  tr: { choose: 'Dosya seç', none: 'Dosya seçilmedi' },
  en: { choose: 'Choose file', none: 'No file chosen' },
  sq: { choose: 'Zgjidh skedarin', none: 'Nuk është zgjedhur asnjë skedar' },
  ar: { choose: 'اختر ملفًا', none: 'لم يتم اختيار أي ملف' },
  mk: { choose: 'Избери датотека', none: 'Не е избрана датотека' },
};
