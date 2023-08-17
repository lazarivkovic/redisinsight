import {
  expect,
  describe,
  deps,
  getMainCheckFn, fsExtra, before, after,
} from '../deps';
import { constants } from '../../helpers/constants';
import * as defaultConfig from '../../../config/features-config.json';
import { getRepository, initSettings, repositories } from '../../helpers/local-db';
const { getSocket, server, request } = deps;

// endpoint to test
const endpoint = () => request(server).get('/features');
const syncEndpoint = () => request(server).post('/features/sync');
const updateSettings = (data) => request(server).patch('/settings').send(data);

const mainCheckFn = getMainCheckFn(endpoint);


const waitForFlags = async (flags: any) => {
  const client = await getSocket('');

  await new Promise((res, rej) => {
    client.once('features', (data) => {
      expect(flags).to.deep.eq(data);
      res(true);
    })
    setTimeout(() => {
      rej(new Error('no flags received in 10s'));
    }, 10000);
  });
};

let featureConfigRepository;
let featureRepository;
describe('GET /features', () => {
  after(initSettings);

  before(async () => {
    await initSettings();
    featureConfigRepository = await getRepository(repositories.FEATURES_CONFIG);
    featureRepository = await getRepository(repositories.FEATURE);
  });

  [
    {
      name: 'Should return false flag since no range was defined',
      before: async () => {
        await fsExtra.writeFile(constants.TEST_FEATURE_FLAG_REMOTE_CONFIG_PATH, JSON.stringify({
          version: defaultConfig.version + 1,
          features: {
            insightsRecommendations: {
              perc: [],
              flag: true,
            }
          },
        })).catch(console.error);

        // remove all configs
        await featureConfigRepository.delete({});
        await syncEndpoint();
        await waitForFlags({
          features: {
            insightsRecommendations: {
              flag: false,
            },
          },
        });
      },
      statusCode: 200,
      responseBody: {
        features: {
          insightsRecommendations: {
            flag: false,
          }
        }
      }
    },
    {
      name: 'Should return true since controlNumber is inside range',
      before: async () => {
        const [config, empty] = await featureConfigRepository.find();
        expect(empty).to.eq(undefined);

        await fsExtra.writeFile(constants.TEST_FEATURE_FLAG_REMOTE_CONFIG_PATH, JSON.stringify({
          version: defaultConfig.version + 2,
          features: {
            insightsRecommendations: {
              perc: [[config.controlNumber - 1, config.controlNumber + 1]],
              flag: true,
            }
          },
        })).catch(console.error);

        // remove all configs

        await syncEndpoint();
        await waitForFlags({
          features: {
            insightsRecommendations: {
              flag: true,
            },
          },
        });
      },
      statusCode: 200,
      responseBody: {
        features: {
          insightsRecommendations: {
            flag: true,
          }
        }
      }
    },
    {
      name: 'Should return true since controlNumber is inside range and filters are match (analytics=true)',
      before: async () => {
        const [config, empty] = await featureConfigRepository.find();
        expect(empty).to.eq(undefined);

        await fsExtra.writeFile(constants.TEST_FEATURE_FLAG_REMOTE_CONFIG_PATH, JSON.stringify({
          version: JSON.parse(config.data).version + 1,
          features: {
            insightsRecommendations: {
              perc: [[config.controlNumber - 1, config.controlNumber + 1]],
              flag: true,
              filters: [{
                name: 'agreements.analytics',
                value: true,
                cond: 'eq',
              }],
            }
          },
        })).catch(console.error);

        await syncEndpoint();
        await waitForFlags({
          features: {
            insightsRecommendations: {
              flag: true,
            },
          },
        });
      },
      statusCode: 200,
      responseBody: {
        features: {
          insightsRecommendations: {
            flag: true,
          }
        }
      }
    },
    {
      name: 'Should return false since analytics disabled (triggered by settings change)',
      before: async () => {
        await new Promise((res, rej) => {
          waitForFlags({
            features: {
              insightsRecommendations: {
                flag: false,
              },
            },
          }).then(res).catch(rej);

          updateSettings({
            agreements: {
              analytics: false,
            },
          }).catch(rej);
        });
      },
      statusCode: 200,
      responseBody: {
        features: {
          insightsRecommendations: {
            flag: false,
          }
        }
      }
    },
  ].map(mainCheckFn);
});
