import { AbstractInfoStrategy } from 'src/modules/cluster-monitor/strategies/abstract.info.strategy';
import { Cluster, Command } from 'ioredis';
import { ClusterNodeDetails, HealthStatus, NodeRole } from 'src/modules/cluster-monitor/models';

export class ClusterNodesInfoStrategy extends AbstractInfoStrategy {
  async getClusterNodesFromRedis(client: Cluster): Promise<Partial<ClusterNodeDetails>[]> {
    const resp = await client.sendCommand(new Command('cluster', ['nodes'], {
      replyEncoding: 'utf8',
    })) as string;

    return resp.split('\n').filter((e) => e).map((nodeString) => {
      const [id, endpoint, flags, primary,,,,, ...slots] = nodeString.split(' ');
      const [host, ports] = endpoint.split(':');
      const [port] = ports.split('@');
      return {
        id,
        host,
        port: parseInt(port, 10),
        role: primary && primary !== '-' ? NodeRole.Replica : NodeRole.Primary,
        primary: primary && primary !== '-' ? primary : undefined,
        slots: slots?.length ? slots : undefined,
        health: ClusterNodesInfoStrategy.determineNodeHealth(flags),
      };
    })
      .filter((node) => node.role === NodeRole.Primary); // tmp work with primary nodes only;
  }

  static determineNodeHealth(flags: string): HealthStatus {
    if (flags.indexOf('fail') > -1 && flags.indexOf('pfail') < 0) {
      return HealthStatus.Offline;
    }

    if (flags.indexOf('master') > -1 || flags.indexOf('slave') > -1) {
      return HealthStatus.Online;
    }

    return HealthStatus.Loading;
  }
}
