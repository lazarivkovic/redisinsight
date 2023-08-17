import IORedis from 'ioredis';
import {
  mockSocket,
  mockBulActionsAnalyticsService,
} from 'src/__mocks__';
import {
  DeleteBulkActionSimpleRunner,
} from 'src/modules/bulk-actions/models/runners/simple/delete.bulk-action.simple.runner';
import { BulkAction } from 'src/modules/bulk-actions/models/bulk-action';
import { BulkActionStatus, BulkActionType } from 'src/modules/bulk-actions/constants';
import * as Utils from 'src/modules/database/utils/database.total.util';
import { BulkActionFilter } from 'src/modules/bulk-actions/models/bulk-action-filter';

const mockExec = jest.fn();
const nodeClient = Object.create(IORedis.prototype);
nodeClient.sendCommand = jest.fn();
nodeClient.pipeline = jest.fn(() => ({
  exec: mockExec,
}));
nodeClient.options = { db: 1 };
const mockBulkActionFilter = new BulkActionFilter();

const mockCreateBulkActionDto = {
  id: 'bulk-action-id',
  databaseId: 'database-id',
  type: BulkActionType.Delete,
};

let bulkAction;

const mockKey = 'mockedKey';
const mockKeyBuffer = Buffer.from(mockKey);
const mockCursorString = '12345';
const mockCursorNumber = parseInt(mockCursorString, 10);
const mockCursorBuffer = Buffer.from(mockCursorString);
const mockZeroCursorBuffer = Buffer.from('0');
const mockRESPError = 'Reply Error: NOPERM for delete.';
const mockRESPErrorBuffer = Buffer.from(mockRESPError);

describe('AbstractBulkActionSimpleRunner', () => {
  let deleteRunner: DeleteBulkActionSimpleRunner;

  beforeEach(() => {
    jest.clearAllMocks();

    bulkAction = new BulkAction(
      mockCreateBulkActionDto.id,
      mockCreateBulkActionDto.databaseId,
      mockCreateBulkActionDto.type,
      mockBulkActionFilter,
      mockSocket,
      mockBulActionsAnalyticsService,
    );

    deleteRunner = new DeleteBulkActionSimpleRunner(bulkAction, nodeClient);
  });

  describe('prepareToStart', () => {
    it('should get total before start', async () => {
      jest.spyOn(Utils, 'getTotal').mockResolvedValue(100);

      expect(deleteRunner['progress']['total']).toEqual(0);
      expect(deleteRunner['progress']['scanned']).toEqual(0);
      expect(deleteRunner['progress']['cursor']).toEqual(0);

      await deleteRunner.prepareToStart();

      expect(deleteRunner['progress']['total']).toEqual(100);
      expect(deleteRunner['progress']['scanned']).toEqual(0);
      expect(deleteRunner['progress']['cursor']).toEqual(0);
    });
  });

  describe('getKeysToProcess', () => {
    beforeEach(() => {
      deleteRunner['bulkAction']['status'] = BulkActionStatus.Running;
      deleteRunner['progress']['total'] = 1_000_000;
    });

    it('Should get keys to process and change cursor', async () => {
      nodeClient.sendCommand.mockResolvedValueOnce([mockCursorBuffer, [mockKeyBuffer, mockKeyBuffer]]);
      nodeClient.sendCommand.mockResolvedValueOnce([mockCursorBuffer, [mockKeyBuffer, mockKeyBuffer]]);
      nodeClient.sendCommand.mockResolvedValueOnce([mockZeroCursorBuffer, [mockKeyBuffer, mockKeyBuffer]]);

      expect(deleteRunner['progress']['cursor']).toEqual(0);
      expect(deleteRunner['progress']['total']).toEqual(1_000_000);

      await deleteRunner.getKeysToProcess();

      expect(deleteRunner['progress']['cursor']).toEqual(mockCursorNumber);
      expect(deleteRunner['progress']['total']).toEqual(1_000_000);

      await deleteRunner.getKeysToProcess();

      expect(deleteRunner['progress']['cursor']).toEqual(mockCursorNumber);
      expect(deleteRunner['progress']['total']).toEqual(1_000_000);

      await deleteRunner.getKeysToProcess();

      expect(deleteRunner['progress']['cursor']).toEqual(-1);
      expect(deleteRunner['progress']['total']).toEqual(1_000_000);

      await deleteRunner.getKeysToProcess();

      expect(nodeClient.sendCommand).toHaveBeenCalledTimes(3);
    });
  });

  describe('runIteration', () => {
    beforeEach(() => {
      deleteRunner['bulkAction']['status'] = BulkActionStatus.Running;
      deleteRunner['progress']['total'] = 1_000_000;
    });

    it('Should get keys to process and change cursor', async () => {
      nodeClient.sendCommand.mockResolvedValueOnce([mockCursorBuffer, [mockKeyBuffer, mockKeyBuffer]]);
      nodeClient.sendCommand.mockResolvedValueOnce([mockCursorBuffer, [mockKeyBuffer, mockKeyBuffer]]);
      nodeClient.sendCommand.mockResolvedValueOnce([mockZeroCursorBuffer, [mockKeyBuffer, mockKeyBuffer]]);
      mockExec.mockResolvedValue([
        [null, 1],
        [mockRESPErrorBuffer, null],
      ]);

      expect(deleteRunner['progress']['cursor']).toEqual(0);
      expect(deleteRunner['progress']['scanned']).toEqual(0);
      expect(deleteRunner['progress']['total']).toEqual(1_000_000);

      expect(deleteRunner['summary']['processed']).toEqual(0);
      expect(deleteRunner['summary']['succeed']).toEqual(0);
      expect(deleteRunner['summary']['failed']).toEqual(0);
      expect(deleteRunner['summary']['errors']).toEqual([]);

      await deleteRunner.runIteration();

      expect(deleteRunner['progress']['cursor']).toEqual(mockCursorNumber);
      expect(deleteRunner['progress']['scanned']).toEqual(10_000);
      expect(deleteRunner['progress']['total']).toEqual(1_000_000);

      expect(deleteRunner['summary']['processed']).toEqual(2);
      expect(deleteRunner['summary']['succeed']).toEqual(1);
      expect(deleteRunner['summary']['failed']).toEqual(1);
      expect(deleteRunner['summary']['errors']).toEqual([
        {
          key: mockKeyBuffer,
          error: mockRESPErrorBuffer,
        },
      ]);

      await deleteRunner.runIteration();

      expect(deleteRunner['progress']['cursor']).toEqual(mockCursorNumber);
      expect(deleteRunner['progress']['scanned']).toEqual(20_000);
      expect(deleteRunner['progress']['total']).toEqual(1_000_000);

      expect(deleteRunner['summary']['processed']).toEqual(4);
      expect(deleteRunner['summary']['succeed']).toEqual(2);
      expect(deleteRunner['summary']['failed']).toEqual(2);
      expect(deleteRunner['summary']['errors']).toEqual([
        {
          key: mockKeyBuffer,
          error: mockRESPErrorBuffer,
        },
        {
          key: mockKeyBuffer,
          error: mockRESPErrorBuffer,
        },
      ]);

      await deleteRunner.runIteration();

      expect(deleteRunner['progress']['cursor']).toEqual(-1);
      expect(deleteRunner['progress']['scanned']).toEqual(1_000_000);
      expect(deleteRunner['progress']['total']).toEqual(1_000_000);

      expect(deleteRunner['summary']['processed']).toEqual(6);
      expect(deleteRunner['summary']['succeed']).toEqual(3);
      expect(deleteRunner['summary']['failed']).toEqual(3);
      expect(deleteRunner['summary']['errors']).toEqual([
        {
          key: mockKeyBuffer,
          error: mockRESPErrorBuffer,
        },
        {
          key: mockKeyBuffer,
          error: mockRESPErrorBuffer,
        },
        {
          key: mockKeyBuffer,
          error: mockRESPErrorBuffer,
        },
      ]);
    });
  });

  describe('run', () => {
    let runIterationSpy;

    beforeEach(() => {
      runIterationSpy = jest.spyOn(deleteRunner, 'runIteration');
      runIterationSpy.mockImplementation(async () => {
        await new Promise((res) => {
          setTimeout(() => res(''), 50);
        });
      });
      deleteRunner['bulkAction']['status'] = BulkActionStatus.Running;
    });

    it('should should run if cursor 0 and status is Running and stop on status change', async () => {
      expect(deleteRunner['progress']['cursor']).toEqual(0);
      expect(deleteRunner['bulkAction']['status']).toEqual(BulkActionStatus.Running);
      setTimeout(() => {
        deleteRunner['bulkAction']['status'] = BulkActionStatus.Aborted;
      }, 90);
      await deleteRunner.run();

      expect(runIterationSpy).toHaveBeenCalledTimes(2);
    });

    it('should should run if cursor 0 and status is Running and stop on wen cursor -1', async () => {
      expect(deleteRunner['progress']['cursor']).toEqual(0);
      expect(deleteRunner['bulkAction']['status']).toEqual(BulkActionStatus.Running);
      setTimeout(() => {
        deleteRunner['progress']['cursor'] = -1;
      }, 90);
      await deleteRunner.run();

      expect(runIterationSpy).toHaveBeenCalledTimes(2);
    });
  });
});
