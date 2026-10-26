import { Language } from '@/lib/dictionary';
import { europeanCountryOptions } from '@/lib/europeanCountries';

/** Shared <option> list for every registration / profile country select. */
export function EuropeanCountryOptions({
  lang,
  currentValue,
}: {
  lang: Language;
  currentValue?: string;
}) {
  const options = europeanCountryOptions(lang);
  const known = !currentValue || options.some((country) => country.value === currentValue);

  return (
    <>
      {currentValue && !known ? <option value={currentValue}>{currentValue}</option> : null}
      {options.map((country) => (
        <option key={country.code} value={country.value}>
          {country.label}
        </option>
      ))}
    </>
  );
}
