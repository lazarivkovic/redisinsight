import { Module } from '@nestjs/common';
import { PlainEncryptionStrategy } from 'src/modules/encryption/strategies/plain-encryption.strategy';
import { KeytarEncryptionStrategy } from 'src/modules/encryption/strategies/keytar-encryption.strategy';
import { EncryptionService } from 'src/modules/encryption/encryption.service';

@Module({})
export class EncryptionModule {
  static register() {
    return {
      module: EncryptionModule,
      providers: [
        PlainEncryptionStrategy,
        KeytarEncryptionStrategy,
        EncryptionService,
      ],
      exports: [
        EncryptionService,
        // todo: rework to not export strategies
        PlainEncryptionStrategy,
        KeytarEncryptionStrategy,
      ],
    };
  }
}
