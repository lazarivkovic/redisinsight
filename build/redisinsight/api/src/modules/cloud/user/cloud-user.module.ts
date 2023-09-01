import { Module } from '@nestjs/common';
import { CloudSessionModule } from 'src/modules/cloud/session/cloud-session.module';
import { CloudUserRepository } from 'src/modules/cloud/user/repositories/cloud-user.repository';
import { InSessionCloudUserRepository } from 'src/modules/cloud/user/repositories/in-session.cloud-user.repository';
import { CloudUserController } from 'src/modules/cloud/user/cloud-user.controller';
import { CloudUserCapiService } from 'src/modules/cloud/user/cloud-user.capi.service';
import { CloudUserCapiProvider } from 'src/modules/cloud/user/providers/cloud-user.capi.provider';
import { CloudUserApiProvider } from 'src/modules/cloud/user/providers/cloud-user.api.provider';
import { CloudUserApiService } from 'src/modules/cloud/user/cloud-user.api.service';

@Module({
  imports: [CloudSessionModule],
  providers: [
    CloudUserApiProvider,
    CloudUserCapiProvider,
    CloudUserApiService,
    CloudUserCapiService,
    {
      provide: CloudUserRepository,
      useClass: InSessionCloudUserRepository,
    },
  ],
  controllers: [CloudUserController],
  exports: [
    CloudUserCapiService,
    CloudUserApiService,
  ],
})
export class CloudUserModule {}
