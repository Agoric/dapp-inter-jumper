import { abciQuery } from './abci-query';

export const vstorageQuery = async (
  node: string,
  path: string,
  blockHeight?: number
) => abciQuery(node, `/custom/vstorage/data/${path}`, blockHeight);
