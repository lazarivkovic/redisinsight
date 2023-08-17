import {
  describe,
  deps,
  requirements,
  Joi,
  nock, getMainCheckFn,
  serverConfig,
} from '../deps';
import { mockCloudAccountInfo, mockCloudApiAccount } from 'src/__mocks__/cloud-autodiscovery';
const { request, server, constants } = deps;

const endpoint = () => request(server).get(`/cloud/autodiscovery/account`);

const headers = {
  'x-cloud-api-key': constants.TEST_CLOUD_API_KEY,
  'x-cloud-api-secret': constants.TEST_CLOUD_API_SECRET_KEY,
}

const responseSchema = Joi.object().keys({
  accountId: Joi.number().required(),
  accountName: Joi.string().required(),
  ownerName: Joi.string().required(),
  ownerEmail: Joi.string().required(),
}).required();

const mainCheckFn = getMainCheckFn(endpoint);

const nockScope = nock(serverConfig.get('redis_cloud').url);

describe('GET /cloud/autodiscovery/account', () => {
  requirements('rte.serverType=local');

  describe('Common', () => {
    [
      {
        before: () => {
          nockScope.get('/')
            .reply(200, { account: mockCloudApiAccount });
        },
        name: 'Should get account info',
        headers,
        responseSchema,
        responseBody: mockCloudAccountInfo,
      },
      {
        before: () => {
          nockScope.get('/')
            .reply(403, {
              response: {
                status: 403,
                data: { message: 'Unauthorized for this action' },
              }
            });
        },
        name: 'Should throw Forbidden error when api returned 403 error',
        headers,
        statusCode: 403,
        responseBody: {
          statusCode: 403,
          error: 'Forbidden',
        },
      },
      {
        before: () => {
          nockScope.get('/')
            .reply(401, {
              response: {
                status: 401,
                data: '',
              }
            });
        },
        name: 'Should throw Forbidden error when api returns 401 error',
        headers,
        statusCode: 403,
        responseBody: {
          statusCode: 403,
          error: 'Forbidden',
        },
      },
      {
        name: 'Should throw Unauthorized error when api key or secret was not provided',
        headers: {},
        statusCode: 401,
        responseBody: {
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Required authentication credentials were not provided',
        },
      },
    ].map(mainCheckFn);
  });
});
