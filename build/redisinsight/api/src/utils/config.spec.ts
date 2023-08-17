import defaultConfig from '../../config/default';
import devConfig from '../../config/development';
import stageConfig from '../../config/staging';
import prodConfig from '../../config/production';

describe('Config util', () => {
  const OLD_ENV = process.env;

  describe('get', () => {
    beforeEach(() => {
      // Clears the cache
      jest.resetModules();
      // Make a copy
      process.env = { ...OLD_ENV };
    });

    afterAll(() => {
      // Restore old environment
      process.env = OLD_ENV;
    });

    it('should return dev server config', () => {
      process.env.NODE_ENV = 'development';
      // eslint-disable-next-line global-require
      const { get } = require('./config');

      const result = get('server');

      expect(result).toEqual({
        ...defaultConfig.server,
        ...devConfig.server,
      });
    });

    it('should return stage server config', () => {
      process.env.NODE_ENV = 'staging';
      // eslint-disable-next-line global-require
      const { get } = require('./config');

      const result = get('server');

      expect(result).toEqual({
        ...defaultConfig.server,
        ...stageConfig.server,
      });
    });

    it('should return prod server config', () => {
      process.env.NODE_ENV = 'production';
      // eslint-disable-next-line global-require
      const { get } = require('./config');

      const result = get('server');

      expect(result).toEqual({
        ...defaultConfig.server,
        ...prodConfig.server,
      });
    });
  });
});
