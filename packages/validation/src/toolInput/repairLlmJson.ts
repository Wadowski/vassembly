const DEFAULT_LLM_JSON_REPAIRS: Array<(value: string) => string> = [
  (value) => value.replace(/😕/g, ':'),
  (value) => value.replace(/type:\s*""([^"]+)""/g, 'type":"$1"'),
  (value) => value.replace(/type:\\*"([^"\\]+)\\"?/g, 'type":"$1"'),
  (value) => value.replace(/\\"}/g, '"}'),
  (value) => value.replace(/,(\s*[}\]])/g, '$1'),
];

export const repairLlmJson = ({
  raw,
  repairs = DEFAULT_LLM_JSON_REPAIRS,
}: {
  raw: string;
  repairs?: Array<(value: string) => string>;
}): string => {
  return repairs.reduce((value, repair) => repair(value), raw);
};
