import { isArray, isObject } from 'lodash';
import { getASCIISafeStringFromBuffer } from 'src/utils/cli-helper';
import { IFormatterStrategy } from '../formatter.interface';

export class ASCIIFormatterStrategy implements IFormatterStrategy {
  public format(reply: any): any {
    if (reply instanceof Buffer) {
      return getASCIISafeStringFromBuffer(reply);
    }
    if (isArray(reply)) {
      return this.formatRedisArrayReply(reply);
    }
    if (isObject(reply)) {
      return this.formatRedisObjectReply(reply);
    }
    return reply;
  }

  private formatRedisArrayReply(reply: Buffer | Buffer[]): any[] {
    let result: any;
    if (isArray(reply)) {
      if (!reply.length) {
        result = [];
      } else {
        result = reply.map((item) => this.formatRedisArrayReply(item));
      }
    } else {
      result = this.format(reply);
    }
    return result;
  }

  private formatRedisObjectReply(reply: Object): object {
    const result = {};
    Object.keys(reply).forEach((key) => {
      result[key] = this.format(reply[key]);
    });
    return result;
  }
}
