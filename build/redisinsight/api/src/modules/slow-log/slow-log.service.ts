import * as IORedis from 'ioredis';
import { concat } from 'lodash';
import {
  BadRequestException, HttpException, Injectable, Logger,
} from '@nestjs/common';
import { DatabaseConnectionService } from 'src/modules/database/database-connection.service';
import { SlowLog, SlowLogConfig } from 'src/modules/slow-log/models';
import { SlowLogArguments, SlowLogCommands } from 'src/modules/slow-log/constants/commands';
import { catchAclError, convertStringsArrayToObject } from 'src/utils';
import { UpdateSlowLogConfigDto } from 'src/modules/slow-log/dto/update-slow-log-config.dto';
import { GetSlowLogsDto } from 'src/modules/slow-log/dto/get-slow-logs.dto';
import { SlowLogAnalyticsService } from 'src/modules/slow-log/slow-log-analytics.service';
import { ClientMetadata } from 'src/common/models';

@Injectable()
export class SlowLogService {
  private logger = new Logger('SlowLogService');

  constructor(
    private databaseConnectionService: DatabaseConnectionService,
    private analyticsService: SlowLogAnalyticsService,
  ) {}

  /**
   * Get slow logs for each node and return concatenated result
   * @param clientMetadata
   * @param dto
   */
  async getSlowLogs(clientMetadata: ClientMetadata, dto: GetSlowLogsDto) {
    try {
      this.logger.log('Getting slow logs');

      const client = await this.databaseConnectionService.getOrCreateClient(clientMetadata);
      const nodes = await this.getNodes(client);

      return concat(...(await Promise.all(nodes.map((node) => this.getNodeSlowLogs(node, dto)))));
    } catch (e) {
      if (e instanceof HttpException) {
        throw e;
      }

      throw catchAclError(e);
    }
  }

  /**
   * Get array of slow logs for particular node
   * @param node
   * @param dto
   */
  async getNodeSlowLogs(node: IORedis.Redis, dto: GetSlowLogsDto): Promise<SlowLog[]> {
    const resp = await node.call(SlowLogCommands.SlowLog, [SlowLogArguments.Get, dto.count]);
    // @ts-expect-error
    // https://github.com/luin/ioredis/issues/1572
    return resp.map((log) => {
      const [id, time, durationUs, args, source, client] = log;

      return {
        id,
        time,
        durationUs,
        args: args.join(' '),
        source,
        client,
      };
    });
  }

  /**
   * Clear slow logs in all nodes
   * @param clientMetadata
   */
  async reset(clientMetadata: ClientMetadata): Promise<void> {
    try {
      this.logger.log('Resetting slow logs');

      const client = await this.databaseConnectionService.getOrCreateClient(clientMetadata);
      const nodes = await this.getNodes(client);

      await Promise.all(nodes.map((node) => node.call(SlowLogCommands.SlowLog, SlowLogArguments.Reset)));
    } catch (e) {
      if (e instanceof HttpException) {
        throw e;
      }

      throw catchAclError(e);
    }
  }

  /**
   * Get current slowlog config to show for user
   * @param clientMetadata
   */
  async getConfig(clientMetadata: ClientMetadata): Promise<SlowLogConfig> {
    try {
      const client = await this.databaseConnectionService.getOrCreateClient(clientMetadata);
      const resp = convertStringsArrayToObject(
        await client.call(SlowLogCommands.Config, [SlowLogArguments.Get, 'slowlog*']),
      );

      return {
        slowlogMaxLen: parseInt(resp['slowlog-max-len'], 10) || 0,
        slowlogLogSlowerThan: parseInt(resp['slowlog-log-slower-than'], 10) || 0,
      };
    } catch (e) {
      if (e instanceof HttpException) {
        throw e;
      }

      throw catchAclError(e);
    }
  }

  /**
   * Update slowlog config
   * @param clientMetadata
   * @param dto
   */
  async updateConfig(clientMetadata: ClientMetadata, dto: UpdateSlowLogConfigDto): Promise<SlowLogConfig> {
    try {
      const commands = [];
      const config = await this.getConfig(clientMetadata);
      const { slowlogLogSlowerThan, slowlogMaxLen } = config;

      if (dto.slowlogLogSlowerThan !== undefined) {
        commands.push({
          command: SlowLogCommands.Config,
          args: [SlowLogArguments.Set, 'slowlog-log-slower-than', dto.slowlogLogSlowerThan],
          analytics: () => this.analyticsService.slowlogLogSlowerThanUpdated(
            clientMetadata.databaseId,
            slowlogLogSlowerThan,
            dto.slowlogLogSlowerThan,
          ),
        });

        config.slowlogLogSlowerThan = dto.slowlogLogSlowerThan;
      }

      if (dto.slowlogMaxLen !== undefined) {
        commands.push({
          command: SlowLogCommands.Config,
          args: [SlowLogArguments.Set, 'slowlog-max-len', dto.slowlogMaxLen],
          analytics: () => this.analyticsService.slowlogMaxLenUpdated(
            clientMetadata.databaseId,
            slowlogMaxLen,
            dto.slowlogMaxLen,
          ),
        });

        config.slowlogMaxLen = dto.slowlogMaxLen;
      }

      if (commands.length) {
        const client = await this.databaseConnectionService.getOrCreateClient(clientMetadata);

        if (client.isCluster) {
          return Promise.reject(new BadRequestException('Configuration slowlog for cluster is deprecated'));
        }
        await Promise.all(commands.map((command) => client.call(
          command.command,
          command.args,
        ).then(command.analytics)));
      }

      return config;
    } catch (e) {
      if (e instanceof HttpException) {
        throw e;
      }

      throw catchAclError(e);
    }
  }

  /**
   * Get redis nodes to execute commands like "slowlog get", "slowlog clean", etc. for each node
   * @param client
   * @private
   */
  private async getNodes(client: IORedis.Redis | IORedis.Cluster): Promise<IORedis.Redis[]> {
    if (client.isCluster) {
      return (client as IORedis.Cluster).nodes();
    }

    return [client as IORedis.Redis];
  }
}
