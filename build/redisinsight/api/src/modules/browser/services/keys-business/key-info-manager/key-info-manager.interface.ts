import { GetKeyInfoResponse } from 'src/modules/browser/dto';
import { RedisString } from 'src/common/constants';
import { ClientMetadata } from 'src/common/models';

export interface IKeyInfoStrategy {
  getInfo(
    clientMetadata: ClientMetadata,
    key: RedisString,
    type: string,
  ): Promise<GetKeyInfoResponse>;
}
