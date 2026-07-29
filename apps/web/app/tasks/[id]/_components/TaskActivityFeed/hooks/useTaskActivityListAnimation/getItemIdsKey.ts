export const getItemIdsKey = ({ itemIds }: { itemIds: string[] }): string => itemIds.join('\0');
