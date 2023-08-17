import ERROR_MESSAGES from 'src/constants/error-messages';
import { IGetNodeKeysResult } from 'src/modules/browser/services/keys-business/scanner/scanner.interface';

const NODES_SEPARATOR = '||';
const CURSOR_SEPARATOR = '@';
// Correct format 172.17.0.1:7001@-1||172.17.0.1:7002@33
const CLUSTER_CURSOR_REGEX = /^(([a-z0-9.])+:[0-9]+(@-?\d+)(?:\|{2}(?!$)|$))+$/;

export const isClusterCursorValid = (cursor) => CLUSTER_CURSOR_REGEX.test(cursor);

/**
 * Parses composed custom cursor from FE and returns nodes
 * Format: 172.17.0.1:7001@22||172.17.0.1:7002@33
 */
export const parseClusterCursor = (cursor: string): IGetNodeKeysResult[] => {
  if (!isClusterCursorValid(cursor)) {
    throw new Error(ERROR_MESSAGES.INCORRECT_CLUSTER_CURSOR_FORMAT);
  }
  const nodeStrings = cursor.split(NODES_SEPARATOR);
  const nodes = [];

  nodeStrings.forEach((item: string) => {
    const [address, nextCursor] = item.split(CURSOR_SEPARATOR);
    const [host, port] = address.split(':');

    // ignore nodes with cursor -1 (fully scanned)
    if (parseInt(nextCursor, 10) >= 0) {
      nodes.push({
        total: 0,
        scanned: 0,
        host,
        port: parseInt(port, 10),
        cursor: parseInt(nextCursor, 10),
        keys: [],
      });
    }
  });
  return nodes;
};
