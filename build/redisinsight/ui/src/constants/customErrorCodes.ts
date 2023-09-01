export enum CustomErrorCodes {
  // General [10000, 10999]
  WindowUnauthorized = 10_001,

  // Cloud API [11001, 11099]
  CloudApiInternalServerError = 11_000,
  CloudApiUnauthorized = 11_001,
  CloudApiForbidden = 11_002,
  CloudApiBadRequest = 11_003,
  CloudApiNotFound = 11_004,
  CloudOauthMisconfiguration = 11_005,
  CloudOauthGithubEmailPermission = 11_006,
  CloudOauthUnknownAuthorizationRequest = 11_007,
  CloudOauthUnexpectedError = 11_008,
  CloudCapiUnauthorized = 11_021,
  CloudCapiKeyUnauthorized = 11_022,

  // Cloud Job errors [11100, 11199]
  CloudJobUnexpectedError = 11_100,
  CloudJobAborted = 11_101,
  CloudJobUnsupported = 11_102,
  CloudTaskProcessingError = 11_103,
  CloudTaskNoResourceId = 11_104,
  CloudSubscriptionIsInTheFailedState = 11_105,
  CloudSubscriptionIsInUnexpectedState = 11_106,
  CloudDatabaseIsInTheFailedState = 11_107,
  CloudDatabaseAlreadyExistsFree = 11_108,
  CloudDatabaseIsInUnexpectedState = 11_109,
  CloudPlanUnableToFindFree = 11_110,
  CloudSubscriptionUnableToDetermine = 11_111,
  CloudTaskNotFound = 11_112,
  CloudJobNotFound = 11_113,
}
