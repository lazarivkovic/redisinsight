import { AxiosError } from 'axios'
import { DEFAULT_ERROR_MESSAGE, getApiErrorMessage, getAxiosError, parseCloudOAuthError } from 'uiSrc/utils'
import { EnhancedAxiosError } from 'uiSrc/slices/interfaces'

const error = { response: { data: { message: 'error' } } } as AxiosError
const errors = { response: { data: { message: ['error1', 'error2'] } } } as AxiosError

const customError1: EnhancedAxiosError = { response: { data: { message: 'error' } } }
const customError2: EnhancedAxiosError = { response: { data: { message: 'error', errorCode: 11_002 } } }
const customError3: EnhancedAxiosError = { response: { data: { message: 'error', error: 'UnexpectedError' } } }

describe('getAxiosError', () => {
  it('should return proper error', () => {
    expect(getAxiosError(customError1)).toEqual(customError1)
    expect(getAxiosError(customError2)).toEqual(parseCloudOAuthError(customError2.response?.data))
    expect(getAxiosError(customError3)).toEqual(customError3)
  })
})

describe('getApiErrorMessage', () => {
  it('should return proper message', () => {
    expect(getApiErrorMessage(error)).toEqual('error')
    expect(getApiErrorMessage(null)).toEqual(DEFAULT_ERROR_MESSAGE)
    expect(getApiErrorMessage(errors)).toEqual('error1')
  })
})
