import { Test, TestingModule } from '@nestjs/testing';
import {
  mockRepository,
  MockType,
} from 'src/__mocks__';
import { GlobalNotificationProvider } from 'src/modules/notification/providers/global-notification.provider';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationEntity } from 'src/modules/notification/entities/notification.entity';
import { Repository } from 'typeorm';
import { NotificationType } from 'src/modules/notification/constants';
import axios from 'axios';
import { CreateNotificationDto, CreateNotificationsDto } from 'src/modules/notification/dto';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockNotification1 = {
  title: 'Title-1',
  body: 'Body-1',
  timestamp: 100,
};

const mockNotification1UPD = {
  title: 'UPD Title-1',
  body: 'Body-1',
  timestamp: 100,
};

const mockNotification2 = {
  title: 'Title-2',
  body: 'Body-2',
  timestamp: 200,
};

const mockNotification3 = {
  title: 'Title-3',
  body: 'Body-3',
  timestamp: 300,
};

const mockNotificationEntity1 = new NotificationEntity({
  ...mockNotification1,
  type: NotificationType.Global,
  read: true,
});

const mockNotificationEntity1UPD = new NotificationEntity({
  ...mockNotification1UPD,
  type: NotificationType.Global,
  read: true,
});

const mockNotificationEntity2 = new NotificationEntity({
  ...mockNotification2,
  type: NotificationType.Global,
  read: false,
});

const mockNotificationEntity3 = new NotificationEntity({
  ...mockNotification3,
  type: NotificationType.Global,
  read: false,
});

describe('GlobalNotificationProvider', () => {
  let service: GlobalNotificationProvider;
  let repository: MockType<Repository<NotificationEntity>>;
  let getNotificationsFromRemoteSpy;

  beforeEach(async () => {
    jest.mock('axios', () => mockedAxios);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobalNotificationProvider,
        EventEmitter2,
        {
          provide: getRepositoryToken(NotificationEntity),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = await module.get(GlobalNotificationProvider);
    repository = await module.get(
      getRepositoryToken(NotificationEntity),
    );

    getNotificationsFromRemoteSpy = jest.spyOn(service, 'getNotificationsFromRemote');
  });

  afterEach(() => {
    clearInterval(service ? service['interval'] : '');
  });
  describe('init', () => {
    it('should should init and set interval only once', async () => {
      const syncSpy = jest.spyOn(service, 'sync');

      expect(service['interval']).toEqual(undefined);
      await service.init();
      expect(service['interval']).not.toEqual(undefined);
      await service.init();
      expect(syncSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('sync', () => {
    it('should add new notifications and update existing one and delete one', async () => {
      getNotificationsFromRemoteSpy.mockResolvedValueOnce({
        notifications: [
          mockNotification1UPD,
          mockNotification2,
        ],
      });

      repository.createQueryBuilder().getMany.mockResolvedValueOnce([
        mockNotificationEntity1,
        mockNotificationEntity3,
      ]);

      await service.sync();

      expect(repository.insert).toHaveBeenCalledWith([
        mockNotificationEntity1UPD,
        mockNotificationEntity2,
      ]);
    });
  });

  describe('getNotificationsFromRemote', () => {
    it('should add new notifications and update existing one and delete one', async () => {
      mockedAxios.get.mockResolvedValue({
        data: Buffer.from(JSON.stringify({
          notifications: [
            mockNotification1,
            mockNotification2,
          ],
        })),
      });

      const res = await service.getNotificationsFromRemote();

      expect(res).toEqual(new CreateNotificationsDto({
        notifications: [
          new CreateNotificationDto({ ...mockNotification1 }),
          new CreateNotificationDto({ ...mockNotification2 }),
        ],
      }));
    });
    it('should throw an error when incorrect data passed', async () => {
      mockedAxios.get.mockResolvedValue({
        data: Buffer.from('incorrect json'),
      });

      try {
        await service.getNotificationsFromRemote();
        fail();
      } catch (e) {
        expect(e).toBeInstanceOf(InternalServerErrorException);
        expect(e.message).toEqual('Unable to get and parse file from remote');
      }
    });
  });
});
