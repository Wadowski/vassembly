const padTwo = (value: number): string => value.toString().padStart(2, '0');

export const formatLocalDateTime = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value);
  const day = padTwo(date.getDate());
  const month = padTwo(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = padTwo(date.getHours());
  const minutes = padTwo(date.getMinutes());

  return `${day}.${month}.${year} ${hours}:${minutes}`;
};
