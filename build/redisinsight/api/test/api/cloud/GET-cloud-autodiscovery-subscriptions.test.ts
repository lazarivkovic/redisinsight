import {
  describe,
  deps,
  requirements,
  Joi, getMainCheckFn, serverConfig
} from '../deps';
import { nock } from '../../helpers/test';
import {
  mockCloudApiSubscription,
  mockCloudSubscription,
  mockCloudSubscriptionFixed
} from 'src/__mocks__/cloud-autodiscovery';
const { request, server, constants } = deps;

const endpoint = () => request(server).get(`/cloud/autodiscovery/subscriptions`);

const headers = {
  'x-cloud-api-key': constants.TEST_CLOUD_API_KEY,
  'x-cloud-api-secret': constants.TEST_CLOUD_API_SECRET_KEY,
}

const responseSchema = Joi.array().items(Joi.object().keys({
  id: Joi.number().required(),
  name: Joi.string().required(),
  numberOfDatabases: Joi.number().required(),
  status: Joi.string().required(),
  provider: Joi.string(),
  region: Joi.string(),
  type: Joi.string(),
})).required();

const mainCheckFn = getMainCheckFn(endpoint);

const nockScope = nock(serverConfig.get('redis_cloud').url);

describe('GET /cloud/autodiscovery/subscriptions', () => {
  requirements('rte.serverType=local');

  describe('Common', () => {
    [
      {
        before: () => {
          nockScope
            .get('/fixed/subscriptions')
            .reply(200, { subscriptions: [mockCloudApiSubscription] })
            .get('/subscriptions')
            .reply(200, { subscriptions: [mockCloudApiSubscription] });
        },
        headers,
        name: 'Should get subscriptions list',
        responseSchema,
        responseBody: [mockCloudSubscriptionFixed, mockCloudSubscription],
      },
      {
        before: () => {
          nockScope
            .get('/fixed/subscriptions')
            .reply(200, { subscriptions: [mockCloudApiSubscription] })
            .get('/subscriptions')
            .reply(403, {
              response: {
                status: 403,
                data: { message: 'Unauthorized for this action' },
              }
            });
        },
        headers,
        name: 'Should throw Forbidden error when api returned 403 error',
        statusCode: 403,
        responseBody: {
          statusCode: 403,
          error: 'Forbidden',
        },
      },
      {
        before: () => {
          nockScope
            .get('/fixed/subscriptions')
            .reply(401, {
              response: {
                status: 401,
                data: '',
              }
            })
            .get('/subscriptions')
            .reply(200, { subscriptions: [mockCloudApiSubscription] });
        },
        name: 'Should throw Forbidden error when api returned 401',
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
