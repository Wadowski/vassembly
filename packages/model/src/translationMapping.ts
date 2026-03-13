import { COUNTRIES } from "@vassembly/constants";
import { Translation } from "./types";

const isValidLanguage = (language: COUNTRIES): boolean => {
  return Object.values(COUNTRIES).includes(language);
};

const findTranslationValue = (
  translationArray: Translation[] | undefined,
  language: COUNTRIES,
  fallbackValue: any
): any => {
  if (!Array.isArray(translationArray)) return fallbackValue;

  const translation = translationArray.find(
    ({ language: translationLanguage }) => translationLanguage === language
  );

  return translation?.value ?? fallbackValue;
};

export const getTranslation = (
  fieldKey: string,
  translationsKey: string,
  instance: any,
  language: COUNTRIES
): any => {
  if (
    instance?.[fieldKey] === undefined ||
    instance?.[translationsKey] === undefined ||
    !isValidLanguage(language)
  ) {
    return;
  }

  const originalValue = instance[fieldKey];
  const translations = instance[translationsKey] as Translation[];

  return findTranslationValue(translations, language, originalValue);
};

export const getTranslationList = (
  fieldKey: string,
  translationsKey: string,
  instance: any,
  language: COUNTRIES
): any[] | undefined => {
  const [topLevelFieldKey, bottomLevelFieldKey] = fieldKey.split(".[].");
  const [topLevelTranslationKey, bottomLevelTranslationKey] =
    translationsKey.split(".[].");

  if (
    !topLevelFieldKey ||
    !topLevelTranslationKey ||
    !bottomLevelFieldKey ||
    !bottomLevelTranslationKey ||
    !Array.isArray(instance?.[topLevelFieldKey]) ||
    !Array.isArray(instance?.[topLevelTranslationKey]) ||
    !isValidLanguage(language)
  )
    return;

  return instance[topLevelFieldKey].map((item) =>
    getTranslation(
      bottomLevelFieldKey,
      bottomLevelTranslationKey,
      item,
      language
    )
  );
};

export const getTranslationListList = (
  fieldKey: string,
  translationsKey: string,
  instance: any,
  language: COUNTRIES
): any[][] | undefined => {
  const [topLevelFieldKey, bottomLevelFieldKey] = fieldKey.split(".[].[].");
  const [topLevelTranslationKey, bottomLevelTranslationKey] =
    translationsKey.split(".[].[].");
  
  if (
    !topLevelFieldKey ||
    !topLevelTranslationKey ||
    !Array.isArray(instance?.[topLevelFieldKey]) ||
    !Array.isArray(instance?.[topLevelTranslationKey]) ||
    !isValidLanguage(language)
  )
    return;

  return instance[topLevelFieldKey].map((level1Items) => {
    if (!Array.isArray(level1Items) || !bottomLevelFieldKey || !bottomLevelTranslationKey) {
      return [];
    }

    return level1Items.map((level2Item) => ({
        ...level2Item,
        [bottomLevelFieldKey]: getTranslation(
            bottomLevelFieldKey,
            bottomLevelTranslationKey,
            level2Item,
            language
        ),
    }));
  });
};

