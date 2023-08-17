import { Test, TestingModule } from '@nestjs/testing';
import {
  mockRepository,
  MockType,
} from 'src/__mocks__';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationEntity } from 'src/modules/notification/entities/notification.entity';
import { Repository } from 'typeorm';
import { NotificationServerEvents, NotificationType } from 'src/modules/notification/constants';
import axios from 'axios';
import {
  NotificationDto,
  NotificationsDto,
} from 'src/modules/notification/dto';
import { NotificationEmitter } from 'src/modules/notification/providers/notification.emitter';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockNotification1 = new NotificationDto({
  title: 'Title-1',
  body: 'Body-1',
  timestamp: 100,
  type: NotificationType.Global,
  read: false,
});

const mockNotification2 = new NotificationDto({
  title: 'Title-2',
  body: 'Body-2',
  timestamp: 200,
  type: NotificationType.Global,
  read: false,
});

const mockEventEmitter = {
  emit: jest.fn(),
};

describe('NotificationEmitter', () => {
  let service: NotificationEmitter;
  let repository: MockType<Repository<NotificationEntity>>;
  let emitter: MockType<EventEmitter2>;

  beforeEach(async () => {
    // jest.resetAllMocks();
    jest.mock('axios', () => mockedAxios);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationEmitter,
        EventEmitter2,
        {
          provide: EventEmitter2,
          useFactory: () => mockEventEmitter,
        },
        {
          provide: getRepositoryToken(NotificationEntity),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = await module.get(NotificationEmitter);
    repository = await module.get(
      getRepositoryToken(NotificationEntity),
    );
    emitter = await module.get(EventEmitter2);
    emitter.emit.mockReset();
  });

  describe('notification', () => {
    it('should return undefined if no notifications', async () => {
      await service.notification([]);
      expect(emitter.emit).toHaveBeenCalledTimes(0);
    });
    it('should should init and set interval only once', async () => {
      repository.createQueryBuilder().getCount.mockResolvedValueOnce(2);

      await service.notification([mockNotification1, mockNotification2]);
      expect(emitter.emit).toHaveBeenCalledTimes(1);
      expect(emitter.emit).toHaveBeenCalledWith(NotificationServerEvents.Notification, new NotificationsDto({
        notifications: [
          mockNotification1,
          mockNotification2,
        ],
        totalUnread: 2,
      }));
    });
    it('should log an error but not fail', async () => {
      repository.createQueryBuilder().getCount.mockRejectedValueOnce(new Error('some error'));

      await service.notification([mockNotification1]);

      expect(emitter.emit).toHaveBeenCalledTimes(0);
    });
  });
});
