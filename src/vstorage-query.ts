import { timeoutDurationMS } from './constants';

/**
 * Enumerates an infinite sequence composed of elements from
 * successive Fisher-Yates shuffles of an array.
 *
 * @param elements
 * @returns An iterator
 */
const enumerateShuffles = <T>(elements: T[]): Iterator<T> => {
  const indices = elements.map((_element, i) => i);
  // https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
  const shuffleIndices = () => {
    for (let i = indices.length - 1; i >= 1; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = indices[j];
      indices[j] = indices[i];
      indices[i] = tmp;
    }
  };

  let i = elements.length;
  const next: () => IteratorResult<T> = () => {
    i += 1;
    if (i >= elements.length) {
      shuffleIndices();
      i = 0;
    }
    return { done: false, value: elements[indices[i]] };
  };
  return { next };
};

/**
 * Queries a vstorage path from a random node from `nodes`. Every
 * `timeoutDurationMS`, it will queue up another request to a new node until
 * all nodes are exhausted, returning the first result it gets.
 *
 * @param apiAddrs The API server addresses to request vstorage data from
 * @param path The vstorage path
 * @returns The vstorage query result
 */
export const vstorageQuery = async (apiAddrs: string[], path: string) => {
  const apiAddrIterator = enumerateShuffles(apiAddrs);
  const resolvers: [(value: unknown) => void, (reason?: any) => void][] = [];
  const requestPromises = apiAddrs.map(
    () =>
      new Promise((resolve, reject) => {
        resolvers.push([resolve, reject]);
      })
  );

  let currentFetchIndex = -1;
  const queueNextFetch = () => {
    currentFetchIndex += 1;
    if (currentFetchIndex === apiAddrs.length) {
      return;
    }
    queueFetch();
  };

  const queueFetch = async () => {
    let index = currentFetchIndex;
    const apiAddr = apiAddrIterator.next().value;

    const doFetch = async () => {
      const result = await fetch(apiAddr + '/agoric/vstorage/data/' + path);
      resolvers[index][0](result);
    };

    let nextFetchTimeout: number | undefined = undefined;
    const clearNextFetchTimeout = () => {
      clearTimeout(nextFetchTimeout);
    };

    nextFetchTimeout = setTimeout(() => {
      queueNextFetch();
      nextFetchTimeout = undefined;
    }, timeoutDurationMS);

    try {
      await doFetch();
    } catch {
      try {
        // Retry once.
        await doFetch();
      } catch (e) {
        console.error(e);
        resolvers[index][1](e);
        if (nextFetchTimeout !== undefined) {
          queueNextFetch();
        }
      }
    } finally {
      clearNextFetchTimeout();
    }
  };

  queueNextFetch();
  const res = await Promise.any(requestPromises);
  // @ts-expect-error if .json() doesn't exist, fetch error is implied and handled in main.ts.
  return res.json();
};
