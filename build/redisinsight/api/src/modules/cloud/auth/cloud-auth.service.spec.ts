import axios from 'axios';
import { CloudAuthService } from 'src/modules/cloud/auth/cloud-auth.service';
import {
  mockCloudAuthAnalytics, mockCloudAuthCode,
  mockCloudAuthGithubAuthUrl, mockCloudAuthGithubCallbackQueryObject,
  mockCloudAuthGithubRequest,
  mockCloudAuthGoogleAuthUrl, mockCloudAuthGoogleCallbackQueryObject,
  mockCloudAuthGoogleRequest, mockCloudAuthGoogleTokenUrl, mockCloudAuthResponse,
  mockGithubIdpCloudAuthStrategy,
  mockGoogleIdpCloudAuthStrategy, mockTokenResponse,
} from 'src/__mocks__/cloud-auth';
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CloudSessionService } from 'src/modules/cloud/session/cloud-session.service';
import {
  mockAxiosBadRequestError, mockCloudSessionService, mockSessionMetadata, MockType,
} from 'src/__mocks__';
import { GithubIdpCloudAuthStrategy } from 'src/modules/cloud/auth/auth-strategy/github-idp.cloud.auth-strategy';
import { GoogleIdpCloudAuthStrategy } from 'src/modules/cloud/auth/auth-strategy/google-idp.cloud.auth-strategy';
import { CloudAuthAnalytics } from 'src/modules/cloud/auth/cloud-auth.analytics';
import { CloudAuthIdpType, CloudAuthStatus } from 'src/modules/cloud/auth/models';
import {
  CloudOauthMisconfigurationException,
  CloudOauthMissedRequiredDataException,
  CloudOauthUnknownAuthorizationRequestException,
} from 'src/modules/cloud/auth/exceptions';
import { InternalServerErrorException } from '@nestjs/common';
import { CloudSsoFeatureStrategy } from 'src/modules/cloud/cloud-sso.feature.flag';

const mockedAxios = axios as jest.Mocked<typeof axios>;
jest.mock('axios');

describe('CloudAuthService', () => {
  let service: CloudAuthService;
  let analytics: MockType<CloudAuthAnalytics>;
  let sessionService: MockType<CloudSessionService>;

  beforeEach(async () => {
    jest.mock('axios', () => mockedAxios);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventEmitter2,
        CloudAuthService,
        {
          provide: CloudSessionService,
          useFactory: mockCloudSessionService,
        },
        {
          provide: GithubIdpCloudAuthStrategy,
          useFactory: mockGithubIdpCloudAuthStrategy,
        },
        {
          provide: GoogleIdpCloudAuthStrategy,
          useFactory: mockGoogleIdpCloudAuthStrategy,
        },
        {
          provide: CloudAuthAnalytics,
          useFactory: mockCloudAuthAnalytics,
        },
      ],
    }).compile();

    service = await module.get(CloudAuthService);
    analytics = await module.get(CloudAuthAnalytics);
    sessionService = await module.get(CloudSessionService);
  });

  describe('getAuthStrategy', () => {
    it('should get Google auth strategy', async () => {
      expect(service.getAuthStrategy(CloudAuthIdpType.Google)).toEqual(service['googleIdpAuthStrategy']);
    });
    it('should get GitHub auth strategy', async () => {
      expect(service.getAuthStrategy(CloudAuthIdpType.GitHub)).toEqual(service['githubIdpCloudAuthStrategy']);
    });
    it('should throw CloudOauthUnknownAuthorizationRequestException error for unsupported strategy', async () => {
      try {
        service.getAuthStrategy('cognito' as CloudAuthIdpType);
      } catch (e) {
        expect(e).toEqual(new CloudOauthUnknownAuthorizationRequestException('Unknown cloud auth strategy'));
      }
    });
  });
  describe('getAuthorizationUrl', () => {
    let logoutSpy;

    beforeEach(() => {
      logoutSpy = jest.spyOn(service, 'logout');
    });

    it('should get Google auth url and add auth request to the pool', async () => {
      expect(service['authRequests'].size).toEqual(0);
      expect(await service.getAuthorizationUrl(
        mockSessionMetadata,
        {
          strategy: CloudAuthIdpType.Google,
        },
      )).toEqual(mockCloudAuthGoogleAuthUrl);
      expect(logoutSpy).toHaveBeenCalled();
      expect(service['authRequests'].size).toEqual(1);
      expect(service['authRequests'].get(mockCloudAuthGoogleRequest.state)).toEqual(mockCloudAuthGoogleRequest);
    });
    it('should get GitHub auth url and add request to the pool but before clear it', async () => {
      service['authRequests'].set(mockCloudAuthGoogleRequest.state, mockCloudAuthGoogleRequest);
      expect(service['authRequests'].size).toEqual(1);
      expect(await service.getAuthorizationUrl(
        mockSessionMetadata,
        {
          strategy: CloudAuthIdpType.GitHub,
        },
      )).toEqual(mockCloudAuthGithubAuthUrl);
      expect(logoutSpy).toHaveBeenCalled();
      expect(service['authRequests'].size).toEqual(1);
      expect(service['authRequests'].get(mockCloudAuthGithubRequest.state)).toEqual(mockCloudAuthGithubRequest);
    });
    it('should throw an error if logout failed', async () => {
      sessionService.deleteSessionData.mockRejectedValueOnce(new Error('Unable to delete session'));
      service['authRequests'].set(mockCloudAuthGoogleRequest.state, mockCloudAuthGoogleRequest);
      expect(service['authRequests'].size).toEqual(1);
      await expect(service.getAuthorizationUrl(
        mockSessionMetadata,
        {
          strategy: CloudAuthIdpType.GitHub,
        },
      )).rejects.toThrow(Error);
      expect(logoutSpy).toHaveBeenCalled();
      // previous request should stay
      expect(service['authRequests'].size).toEqual(1);
      expect(service['authRequests'].get(mockCloudAuthGoogleRequest.state)).toEqual(mockCloudAuthGoogleRequest);
    });
  });
  describe('exchangeCode', () => {
    it('should exchange auth code to access token', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: mockTokenResponse });
      const url = new URL(mockCloudAuthGoogleTokenUrl);

      expect(await service['exchangeCode'](
        mockCloudAuthGoogleRequest,
        mockCloudAuthCode,
      )).toEqual(mockTokenResponse);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${url.origin}${url.pathname}`,
        url.searchParams,
        {
          headers: {
            accept: 'application/json',
            'cache-control': 'no-cache',
            'content-type': 'application/x-www-form-urlencoded',
          },
        },
      );
    });
    it('should throw http error in case of an error', async () => {
      mockedAxios.post.mockRejectedValue(mockAxiosBadRequestError);

      await expect(service['exchangeCode'](
        mockCloudAuthGoogleRequest,
        mockCloudAuthCode,
      )).rejects.toThrow(InternalServerErrorException); // todo: handle this?
    });
  });
  describe('getAuthRequestInfo', () => {
    it('get only few fields from r0equest and don\'t remove it', async () => {
      service['authRequests'] = new Map([[mockCloudAuthGoogleRequest.state, mockCloudAuthGoogleRequest]]);
      expect(service['authRequests'].size).toEqual(1);
      expect(await service['getAuthRequestInfo'](
        mockCloudAuthGoogleCallbackQueryObject,
      )).toEqual({
        action: mockCloudAuthGoogleRequest.action,
        idpType: mockCloudAuthGoogleRequest.idpType,
      });
      expect(service['authRequests'].size).toEqual(1);
    });
    it('should throw an error if request not found', async () => {
      service['authRequests'] = new Map([[mockCloudAuthGoogleRequest.state, mockCloudAuthGoogleRequest]]);
      expect(service['authRequests'].size).toEqual(1);
      await expect(service['getAuthRequestInfo'](
        mockCloudAuthGithubCallbackQueryObject,
      )).rejects.toThrow(CloudOauthUnknownAuthorizationRequestException);
    });
  });
  describe('callback', () => {
    let spy;

    beforeEach(() => {
      service['authRequests'] = new Map([[mockCloudAuthGoogleRequest.state, mockCloudAuthGoogleRequest]]);
      spy = jest.spyOn(service as any, 'exchangeCode');
      spy.mockResolvedValue(mockTokenResponse);
    });

    it('should exchange code and remove auth request from the pool', async () => {
      expect(service['authRequests'].size).toEqual(1);
      expect(await service['callback'](
        mockCloudAuthGoogleCallbackQueryObject,
      )).toEqual(mockCloudAuthGoogleRequest.callback);
      expect(spy).toHaveBeenCalledWith(mockCloudAuthGoogleRequest, mockCloudAuthGoogleCallbackQueryObject.code);
      expect(service['authRequests'].size).toEqual(0);
    });
    it('should throw an error if error field in query parameters (CloudOauthMisconfigurationException)', async () => {
      expect(service['authRequests'].size).toEqual(1);
      await expect(service['callback'](
        {
          ...mockCloudAuthGoogleCallbackQueryObject,
          error: 'bad request',
          error_description: 'some unknown error message',
        },
      )).rejects.toThrow(CloudOauthMisconfigurationException);
    });
    it('should throw an error if error field in query parameters (CloudOauthMissedRequiredDataException)', async () => {
      expect(service['authRequests'].size).toEqual(1);
      await expect(service['callback'](
        {
          ...mockCloudAuthGoogleCallbackQueryObject,
          error: 'bad request',
          error_description: 'Some properties are missing: email and lastName',
        },
      )).rejects.toThrow(new CloudOauthMissedRequiredDataException('Some properties are missing: email and lastName'));
    });
    it('should throw an error if request not found', async () => {
      expect(service['authRequests'].size).toEqual(1);
      await expect(service['callback'](
        mockCloudAuthGithubCallbackQueryObject,
      )).rejects.toThrow(CloudOauthUnknownAuthorizationRequestException);
    });
  });
  describe('handleCallback', () => {
    let spy;
    let callback;

    beforeEach(() => {
      service['authRequests'] = new Map([[mockCloudAuthGoogleRequest.state, mockCloudAuthGoogleRequest]]);
      spy = jest.spyOn(service as any, 'callback');
      callback = jest.fn();
      spy.mockResolvedValue(callback);
    });

    it('should successfully handle auth callback', async () => {
      expect(await service['handleCallback'](
        mockCloudAuthGoogleCallbackQueryObject,
      )).toEqual(mockCloudAuthResponse);
      expect(callback).toHaveBeenCalledWith(mockCloudAuthResponse);
      expect(analytics.sendCloudSignInSucceeded).toHaveBeenCalledWith(
        CloudSsoFeatureStrategy.DeepLink,
        mockCloudAuthGoogleRequest.action,
      );
    });
    it('should not fail if async callback failed', async () => {
      callback.mockRejectedValueOnce(new Error('some error'));
      expect(await service['handleCallback'](
        mockCloudAuthGoogleCallbackQueryObject,
      )).toEqual(mockCloudAuthResponse);
      expect(callback).toHaveBeenCalledWith(mockCloudAuthResponse);
    });
    it('should not fail if sync callback failed', async () => {
      callback.mockImplementationOnce(() => { throw new Error('some error'); });
      expect(await service['handleCallback'](
        mockCloudAuthGoogleCallbackQueryObject,
      )).toEqual(mockCloudAuthResponse);
      expect(callback).toHaveBeenCalledWith(mockCloudAuthResponse);
    });

    it('should response with an error and call callback', async () => {
      const error = new CloudOauthUnknownAuthorizationRequestException();
      const errorResponse = {
        status: CloudAuthStatus.Failed,
        error: error.getResponse(),
      };

      spy.mockRejectedValueOnce(error);
      expect(await service['handleCallback'](
        mockCloudAuthGoogleCallbackQueryObject,
      )).toEqual(errorResponse);
      expect(callback).not.toHaveBeenCalled();
      expect(analytics.sendCloudSignInFailed).toHaveBeenCalledWith(
        error,
        CloudSsoFeatureStrategy.DeepLink,
        mockCloudAuthGoogleRequest.action,
      );
    });
  });
});
