import { Routes } from 'nest-router';
import { BrowserModule } from 'src/modules/browser/browser.module';
import { CliModule } from 'src/modules/cli/cli.module';
import { WorkbenchModule } from 'src/modules/workbench/workbench.module';
import { SlowLogModule } from 'src/modules/slow-log/slow-log.module';
import { PubSubModule } from 'src/modules/pub-sub/pub-sub.module';
import { ClusterMonitorModule } from 'src/modules/cluster-monitor/cluster-monitor.module';
import { DatabaseAnalysisModule } from 'src/modules/database-analysis/database-analysis.module';
import { TriggeredFunctionsModule } from 'src/modules/triggered-functions/triggered-functions.module';
import { BulkActionsModule } from 'src/modules/bulk-actions/bulk-actions.module';
import { DatabaseRecommendationModule } from 'src/modules/database-recommendation/database-recommendation.module';

export const routes: Routes = [
  {
    path: '/databases',
    children: [
      {
        path: '/:dbInstance',
        module: BrowserModule,
      },
      {
        path: '/:dbInstance',
        module: CliModule,
      },
      {
        path: '/:dbInstance',
        module: WorkbenchModule,
      },
      {
        path: '/:dbInstance',
        module: SlowLogModule,
      },
      {
        path: '/:dbInstance',
        module: PubSubModule,
      },
      {
        path: '/:dbInstance',
        module: ClusterMonitorModule,
      },
      {
        path: '/:dbInstance',
        module: DatabaseAnalysisModule,
      },
      {
        path: '/:dbInstance',
        module: BulkActionsModule,
      },
      {
        path: '/:dbInstance',
        module: DatabaseRecommendationModule,
      },
      {
        path: '/:dbInstance',
        module: TriggeredFunctionsModule,
      },
    ],
  },
];
