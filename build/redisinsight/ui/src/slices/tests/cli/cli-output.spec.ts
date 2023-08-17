import { cloneDeep, first } from 'lodash'

import { AppDispatch, RootState } from 'uiSrc/slices/store'
import { cleanup, clearStoreActions, initialStateDefault, mockedStore, mockStore, } from 'uiSrc/utils/test-utils'
import { ClusterNodeRole, CommandExecutionStatus } from 'uiSrc/slices/interfaces/cli'
import { apiService } from 'uiSrc/services'
import { cliTexts } from 'uiSrc/constants/cliOutput'
import { cliParseTextResponseWithOffset, cliParseTextResponseWithRedirect } from 'uiSrc/utils/cliHelper'
import ApiErrors from 'uiSrc/constants/apiErrors'
import { processCliClient, updateCliClientAction } from 'uiSrc/slices/cli/cli-settings'
import { SendClusterCommandDto, SendClusterCommandResponse } from 'apiSrc/modules/cli/dto/cli.dto'
import reducer, {
  concatToOutput,
  initialState,
  outputSelector,
  processUnsupportedCommand,
  sendCliClusterCommandAction,
  sendCliCommand,
  sendCliCommandAction,
  sendCliCommandFailure,
  sendCliCommandSuccess,
  setCliDbIndex,
  updateCliCommandHistory,
} from '../../cli/cli-output'

jest.mock('uiSrc/services', () => ({
  ...jest.requireActual('uiSrc/services'),
}))
jest.mock('uiSrc/slices/cli/cli-settings', () => ({
  ...jest.requireActual('uiSrc/slices/cli/cli-settings'),
  updateCliClientAction: jest.fn()
    .mockImplementation((_dispatch: AppDispatch, stateInit: () => RootState) => stateInit())
}))

let store: typeof mockedStore
beforeEach(() => {
  cleanup()
  store = cloneDeep(mockedStore)
  store.clearActions()
})

describe('cliOutput slice', () => {
  describe('concatToOutput', () => {
    it('should properly concat a new array to existed output', () => {
      const data = ['\n\n', 'tatata']
      // Arrange
      const state: typeof initialState = {
        ...initialState,
        data,
      }

      // Act
      const nextState = reducer(initialState, concatToOutput(data))

      // Assert
      const rootState = Object.assign(initialStateDefault, {
        cli: {
          output: nextState,
        },
      })
      expect(outputSelector(rootState)).toEqual(state)
    })
  })

  describe('updateCliCommandHistory', () => {
    it('should properly updated cli history output', () => {
      const data = ['lalal', 'tatata']
      // Arrange
      const state: typeof initialState = {
        ...initialState,
        commandHistory: data,
      }

      // Act
      const nextState = reducer(initialState, updateCliCommandHistory(data))

      // Assert
      const rootState = Object.assign(initialStateDefault, {
        cli: {
          output: nextState,
        },
      })
      expect(outputSelector(rootState)).toEqual(state)
    })
  })

  describe('sendCliCommand', () => {
    it('should properly set loading = true', () => {
      // Arrange
      const state = {
        ...initialState,
        loading: true,
      }

      // Act
      const nextState = reducer(initialState, sendCliCommand())

      // Assert
      const rootState = Object.assign(initialStateDefault, {
        cli: {
          output: nextState,
        },
      })
      expect(outputSelector(rootState)).toEqual(state)
    })
  })

  describe('sendCliCommandSuccess', () => {
    it('should properly set the state with fetched data', () => {
      // Arrange

      const state = {
        ...initialState,
        loading: false,
      }

      // Act
      const nextState = reducer(initialState, sendCliCommandSuccess())

      // Assert
      const rootState = Object.assign(initialStateDefault, {
        cli: {
          output: nextState,
        },
      })
      expect(outputSelector(rootState)).toEqual(state)
    })
  })

  describe('sendCliCommandFailure', () => {
    it('should properly set the error', () => {
      // Arrange
      const data = 'some error'
      const state = {
        ...initialState,
        loading: false,
        error: data,
      }

      // Act
      const nextState = reducer(initialState, sendCliCommandFailure(data))

      // Assert
      const rootState = Object.assign(initialStateDefault, {
        cli: {
          output: nextState,
        },
      })
      expect(outputSelector(rootState)).toEqual(state)
    })
  })

  describe('processUnsupportedCommand', () => {
    it('should properly concat to output "unsupported text"', async () => {
      // Arrange
      const onSuccessActionMock = jest.fn()
      const unsupportedCommands: string[] = ['sync', 'subscription']
      const command = first(unsupportedCommands) ?? ''

      const nextState = {
        ...initialStateDefault.cli.settings,
        unsupportedCommands,
      }

      // Assert
      const rootState = Object.assign(initialStateDefault, {
        cli: {
          settings: nextState,
        },
      })

      const tempStore = mockStore(rootState)

      // Act
      await tempStore.dispatch<any>(
        processUnsupportedCommand(command, first(unsupportedCommands), onSuccessActionMock)
      )

      // Assert
      const expectedActions = [
        concatToOutput(
          cliParseTextResponseWithOffset(
            cliTexts.CLI_UNSUPPORTED_COMMANDS(command, unsupportedCommands.join(', ')),
            command,
            CommandExecutionStatus.Fail
          )
        ),
      ]

      expect(onSuccessActionMock).toBeCalled()
      expect(clearStoreActions(tempStore.getActions())).toEqual(clearStoreActions(expectedActions))
    })
  })

  describe('setCliDbIndex', () => {
    it('should set correct value', () => {
      // Arrange
      const db = 1
      const state: typeof initialState = { ...initialState, db }

      // Act
      const nextState = reducer(initialState, setCliDbIndex(db))

      // Assert
      const rootState = Object.assign(initialStateDefault, {
        cli: {
          output: nextState,
        },
      })
      expect(outputSelector(rootState)).toEqual(state)
    })
  })

  describe('thunks', () => {
    describe('Standalone Cli command', () => {
      it('call both sendCliStandaloneCommandAction and sendCliCommandSuccess when response status is successed', async () => {
        // Arrange
        const command = 'keys *'
        const data = {
          response: 'tatata',
          status: CommandExecutionStatus.Success,
        }
        const responsePayload = { data, status: 200 }

        apiService.post = jest.fn().mockResolvedValue(responsePayload)

        // Act
        await store.dispatch<any>(sendCliCommandAction(command))

        // Assert
        const expectedActions = [
          sendCliCommand(),
          sendCliCommandSuccess(),
          concatToOutput(cliParseTextResponseWithOffset(data.response, command, data.status)),
        ]
        expect(clearStoreActions(store.getActions())).toEqual(clearStoreActions(expectedActions))
      })

      it('call setCliDbIndex when response status is successed', async () => {
        // Arrange
        const dbIndex = 1
        const command = `SELECT ${dbIndex}`
        const data = { response: 'OK', status: CommandExecutionStatus.Success }
        const responsePayload = { data, status: 200 }

        apiService.post = jest.fn().mockResolvedValue(responsePayload)

        // Act
        await store.dispatch<any>(sendCliCommandAction(command))

        // Assert
        const expectedActions = [
          sendCliCommand(),
          sendCliCommandSuccess(),
          concatToOutput(cliParseTextResponseWithOffset(data.response, command, data.status)),
          setCliDbIndex(dbIndex)
        ]
        expect(clearStoreActions(store.getActions())).toEqual(clearStoreActions(expectedActions))
      })

      it('should not call setCliDbIndex when response status is failed', async () => {
        // Arrange
        const dbIndex = 1
        const command = `SELECT ${dbIndex}`
        const data = { response: 'OK', status: CommandExecutionStatus.Fail }
        const responsePayload = { data, status: 200 }

        apiService.post = jest.fn().mockResolvedValue(responsePayload)

        // Act
        await store.dispatch<any>(sendCliCommandAction(command))

        // Assert
        const expectedActions = [
          sendCliCommand(),
          sendCliCommandSuccess(),
          concatToOutput(cliParseTextResponseWithOffset(data.response, command, data.status)),
        ]
        expect(clearStoreActions(store.getActions())).toEqual(clearStoreActions(expectedActions))
      })

      it('call both sendCliStandaloneCommandAction and sendCliCommandSuccess when response status is fail', async () => {
        // Arrange
        const command = 'keys *'
        const data = {
          response: '(err) tatata',
          status: CommandExecutionStatus.Fail,
        }
        const responsePayload = { data, status: 200 }

        apiService.post = jest.fn().mockResolvedValue(responsePayload)

        // Act
        await store.dispatch<any>(sendCliCommandAction(command))

        // Assert
        const expectedActions = [
          sendCliCommand(),
          sendCliCommandSuccess(),
          concatToOutput(cliParseTextResponseWithOffset(data.response, command, data.status)),
        ]

        expect(clearStoreActions(store.getActions())).toEqual(clearStoreActions(expectedActions))
      })

      it('call both sendCliStandaloneCommandAction and sendCliCommandFailure when fetch is fail', async () => {
        // Arrange
        const command = 'keys *'
        const errorMessage = 'Could not connect to aoeu:123, please check the connection details.'
        const responsePayload = {
          response: {
            status: 500,
            data: { message: errorMessage },
          },
        }

        apiService.post = jest.fn().mockRejectedValueOnce(responsePayload)

        // Act
        await store.dispatch<any>(sendCliCommandAction(command))

        // Assert
        const expectedActions = [
          sendCliCommand(),
          sendCliCommandFailure(responsePayload.response.data.message),
          concatToOutput(cliParseTextResponseWithOffset(errorMessage, command, CommandExecutionStatus.Fail)),
        ]
        expect(clearStoreActions(store.getActions())).toEqual(clearStoreActions(expectedActions))
      })

      it('call both updateCliClientAction on ClientNotFound error', async () => {
        // Arrange
        const command = 'keys *'
        const errorMessage = cliTexts.CONNECTION_CLOSED
        const responsePayload = {
          response: {
            status: 404,
            data: { message: errorMessage, name: ApiErrors.ClientNotFound },
          },
        }
        apiService.post = jest.fn().mockRejectedValueOnce(responsePayload)
        const rootState = Object.assign(initialStateDefault, {
          cli: {
            settings: { ...initialStateDefault.cli.settings, cliClientUuid: '123' },
          },
        })
        const tempStore = mockStore(rootState)

        // Act
        await tempStore.dispatch<any>(sendCliCommandAction(command))

        // Assert
        const expectedActions = [
          sendCliCommand(),
          sendCliCommandFailure(responsePayload.response.data.message),
          concatToOutput(cliParseTextResponseWithOffset(errorMessage, command, CommandExecutionStatus.Fail)),
          processCliClient(),
        ]
        expect(clearStoreActions(tempStore.getActions())).toEqual(clearStoreActions(expectedActions))
      })
    })

    describe('Single Node Cluster Cli command', () => {
      const options: SendClusterCommandDto = {
        command: 'keys *',
        nodeOptions: {
          host: 'localhost',
          port: 7000,
          enableRedirection: true,
        },
        role: ClusterNodeRole.All,
      }

      it('call both sendCliClusterCommandAction and sendCliCommandSuccess when response status is successed', async () => {
        // Arrange
        const command = 'keys *'
        const data: SendClusterCommandResponse[] = [
          {
            response: '(nil)',
            status: CommandExecutionStatus.Success,
            node: { host: '127.0.0.1', port: 7002, slot: 6918 },
          },
        ]
        const responsePayload = { data, status: 200 }

        apiService.post = jest.fn().mockResolvedValue(responsePayload)

        // Act
        await store.dispatch<any>(sendCliClusterCommandAction(command, options))

        // Assert
        const expectedActions = [
          sendCliCommand(),
          sendCliCommandSuccess(),
          concatToOutput(
            cliParseTextResponseWithRedirect(
              first(data)?.response, command, first(data)?.status, first(data)?.node
            )
          ),
        ]
        expect(clearStoreActions(store.getActions())).toEqual(clearStoreActions(expectedActions))
      })

      it('call both sendCliClusterCommandAction and sendCliCommandSuccess when response status is fail', async () => {
        // Arrange
        const command = 'keys *'
        const data: SendClusterCommandResponse[] = [
          {
            response: null,
            status: CommandExecutionStatus.Success,
            node: { host: '127.0.0.1', port: 7002, slot: 6918 },
          },
        ]
        const responsePayload = { data, status: 200 }

        apiService.post = jest.fn().mockResolvedValue(responsePayload)

        // Act
        await store.dispatch<any>(sendCliClusterCommandAction(command, options))

        // Assert
        const expectedActions = [
          sendCliCommand(),
          sendCliCommandSuccess(),
          concatToOutput(
            cliParseTextResponseWithRedirect(
              first(data)?.response, command, first(data)?.status, first(data)?.node
            )
          ),
        ]
        expect(clearStoreActions(store.getActions())).toEqual(clearStoreActions(expectedActions))
      })

      it('call both sendCliClusterCommandAction and sendCliCommandFailure when fetch is fail', async () => {
        // Arrange
        const command = 'keys *'
        const errorMessage = 'Could not connect to aoeu:123, please check the connection details.'
        const responsePayload = {
          response: {
            status: 500,
            data: { message: errorMessage },
          },
        }

        apiService.post = jest.fn().mockRejectedValueOnce(responsePayload)

        // Act
        await store.dispatch<any>(sendCliClusterCommandAction(command, options))

        // Assert
        const expectedActions = [
          sendCliCommand(),
          sendCliCommandFailure(responsePayload.response.data.message),
          concatToOutput(cliParseTextResponseWithOffset(errorMessage, command, CommandExecutionStatus.Fail)),
        ]
        expect(clearStoreActions(store.getActions())).toEqual(clearStoreActions(expectedActions))
      })

      it('call both updateCliClientAction on ClientNotFound error', async () => {
        // Arrange
        const command = 'keys *'
        const errorMessage = cliTexts.CONNECTION_CLOSED
        const responsePayload = {
          response: {
            status: 404,
            data: { message: errorMessage, name: ApiErrors.ClientNotFound },
          },
        }
        apiService.post = jest.fn().mockRejectedValueOnce(responsePayload)
        const rootState = Object.assign(initialStateDefault, {
          cli: {
            settings: { ...initialStateDefault.cli.settings, cliClientUuid: '123' },
          },
        })
        const tempStore = mockStore(rootState)

        // Act
        await tempStore.dispatch<any>(sendCliClusterCommandAction(command, options))

        // Assert
        const expectedActions = [
          sendCliCommand(),
          sendCliCommandFailure(responsePayload.response.data.message),
          concatToOutput(cliParseTextResponseWithOffset(errorMessage, command, CommandExecutionStatus.Fail)),
          processCliClient(),
        ]
        expect(clearStoreActions(tempStore.getActions())).toEqual(clearStoreActions(expectedActions))
      })
    })
  })
})
