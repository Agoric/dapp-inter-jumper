import { timeoutDurationMS } from './constants';

const getNodeIterator = (nodes: string[]) => {
  let currentIndex = Math.floor(Math.random() * nodes.length);
  const next = () => {
    currentIndex += 1;
    if (currentIndex >= nodes.length) {
      currentIndex = 0;
    }
    return nodes[currentIndex];
  };

  return { next };
};

/**
 * Queries a vstorage path from a random node from `nodes`. Every
 * `timeoutDurationMS`, it will queue up another request to a new node until
 * all nodes are exhausted, returning the first result it gets.
 *
 * @param nodes The API nodes to request vstorage data from
 * @param path The vstorage path
 * @returns The vstorage query result
 */
export const vstorageQuery = async (nodes: string[], path: string) => {
  const nodeIterator = getNodeIterator(nodes);

  const requestPromises = [];
  const resolvers: [(value: unknown) => void, (reason?: any) => void][] = [];
  for (let i = 0; i < nodes.length; i++) {
    requestPromises.push(
      new Promise((resolve, reject) => {
        resolvers.push([resolve, reject]);
      })
    );
  }

  let queueFetchInterval: number | undefined = undefined;
  let currentNodeIndex = 0;
  const queueFetch = async (node: string) => {
    if (currentNodeIndex >= nodes.length) {
      clearInterval(queueFetchInterval);
      return;
    }
    let index = currentNodeIndex;
    currentNodeIndex += 1;
    try {
      const result = await fetch(node + '/agoric/vstorage/data/' + path);
      resolvers[index][0](result);
    } catch (e) {
      console.error(e);
      resolvers[index][1](e);
    }
  };

  queueFetch(nodeIterator.next());
  queueFetchInterval = setInterval(() => {
    queueFetch(nodeIterator.next());
  }, timeoutDurationMS);

  try {
    // @ts-expect-error if .json() doesn't exist, fetch error is implied and handled in main.ts.
    return (await Promise.any(requestPromises)).json();
  } finally {
    clearInterval(queueFetchInterval);
  }
};
