import { Language } from '@/lib/dictionary';
import { registrationCountryOptions } from '@/lib/registrationCountries';

/** Country options for candidate nationality: Europe plus source countries. */
export function RegistrationCountryOptions({
  lang,
  currentValue,
}: {
  lang: Language;
  currentValue?: string;
}) {
  const options = registrationCountryOptions(lang);
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
