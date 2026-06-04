import type {
  CreateNamespacedCacheParams,
  NamespacedCache,
} from './types';

const buildNamespacedKey = ({
  namespace,
  key,
}: {
  namespace: string;
  key: string;
}): string => `${namespace}:${key}`;

export const createNamespacedCache = ({
  namespace,
  store,
}: CreateNamespacedCacheParams): NamespacedCache => ({
  get: async ({ key }) =>
    store.get({ key: buildNamespacedKey({ namespace, key }) }),
  set: async ({ key, value, ttlMs }) =>
    store.set({ key: buildNamespacedKey({ namespace, key }), value, ttlMs }),
  delete: async ({ key }) =>
    store.delete({ key: buildNamespacedKey({ namespace, key }) }),
  deleteMany: async ({ keys }) =>
    store.deleteMany({
      keys: keys.map((key) => buildNamespacedKey({ namespace, key })),
    }),
});
