import { Injectable } from '@nestjs/common';
import { RedisToolService } from 'src/modules/redis/redis-tool.service';
import { filter, get, map } from 'lodash';
import { pluginBlockingCommands, pluginUnsupportedCommands } from 'src/constants';
import { ClientMetadata } from 'src/common/models';

@Injectable()
export class PluginCommandsWhitelistProvider {
  private databasesCommands: Map<string, string[]> = new Map();

  constructor(
    private redisTool: RedisToolService,
  ) {}

  /**
   * Get cached commands list or determine it and cache
   * @param clientMetadata
   */
  async getWhitelistCommands(clientMetadata: ClientMetadata): Promise<string[]> {
    return this.databasesCommands.get(clientMetadata.databaseId)
      || this.determineWhitelistCommandsForDatabase(clientMetadata);
  }

  /**
   * Get or create Workbench redis client, fetch commands and cache them
   * @param clientMetadata
   */
  async determineWhitelistCommandsForDatabase(clientMetadata: ClientMetadata): Promise<string[]> {
    // no need to define AppTool since it was set on RedisTool creation. todo: do not forget after refactoring
    const client = await this.redisTool.getRedisClient(clientMetadata);

    const commands = await this.calculateWhiteListCommands(client);
    this.databasesCommands.set(clientMetadata.databaseId, commands);

    return commands;
  }

  /**
   * Get whitelisted commands available for plugins for particular database
   * Commands:
   *  +Readonly
   *  -Hardcoded unsupported commands
   *  -Hardcoded blocking commands
   *  -Redis dangerous
   *  -Redis blocking
   */
  async calculateWhiteListCommands(client: any): Promise<string[]> {
    let pluginWhiteListCommands = [];
    try {
      const availableCommands = await client.call('command');
      const readOnlyCommands = map(filter(availableCommands, (
        command,
      ) => get(command, [2], [])
        .includes('readonly')), (command) => command[0]);

      const blackListCommands = [...pluginUnsupportedCommands, ...pluginBlockingCommands];
      try {
        const dangerousCommands = await client.call('acl', ['cat', 'dangerous']);
        blackListCommands.push(...dangerousCommands);
      } catch (e) {
        // ignore error as acl cat available since Redis 6.0
      }

      try {
        const blockingCommands = await client.call('acl', ['cat', 'blocking']);
        blackListCommands.push(...blockingCommands);
      } catch (e) {
        // ignore error as acl cat available since Redis 6.0
      }

      pluginWhiteListCommands = filter(readOnlyCommands, (command) => !blackListCommands.includes(command));
    } catch (e) {
      // ignore any error to not block main process of client creation
    }

    return pluginWhiteListCommands.map((cmd) => cmd.toLowerCase());
  }
}
