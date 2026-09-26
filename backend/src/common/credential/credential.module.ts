import { Global, Module } from '@nestjs/common';
import { CredentialResolverService } from './credential-resolver.service';
import { CredentialTokenService } from './credential-token.service';

@Global()
@Module({
  providers: [CredentialTokenService, CredentialResolverService],
  exports: [CredentialTokenService, CredentialResolverService],
})
export class CredentialModule {}
