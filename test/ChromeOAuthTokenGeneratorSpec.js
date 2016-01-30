
import TokenGenerator from "../es2015/ChromeOAuthTokenGenerator"
import {promiseIt} from "./testUtils"

describe("ChromeOAuthTokenGenerator", () => {

  let generator
  let accountId

  beforeEach(() => {
    let characters = "abcdefghijklmnopqrstuvwxyz"
    accountId = (
      characters.substring(
        Math.floor(Math.random() * characters.length)
      ) + Math.random() + characters.substring(
        0,
        Math.floor(Math.random() * characters.length)
      )
    )
    generator = new TokenGenerator(accountId)

    window.chrome = {
      identity: {
        getAuthToken: () => {}
      },
      runtime: {
        lastError: null
      }
    }
  })

  promiseIt("should use the account id and chrome APIs", () => {
    let called = false
    window.chrome.identity.getAuthToken = (options, callback) => {
      expect(options).toEqual({
        interactive: false,
        account: {
          id: accountId
        }
      })
      expect(callback instanceof Function).toBeTruthy()

      called = true
      callback("a")
    }

    return generator.generate().then(() => {
      expect(called).toBeTruthy()
    })
  })

  promiseIt("should generate the token", () => {
    let token = "token:" + Math.random()
    window.chrome.identity.getAuthToken = (options, callback) => {
      callback(token)
    }

    return generator.generate().then((generatedToken) => {
      expect(generatedToken).toBe(token)
    })
  })

  promiseIt("should reject with chrome runtime error", () => {
    window.chrome.identity.getAuthToken = (_, callback) => callback(undefined)
    window.chrome.runtime.lastError = {
      message: "This is an error message " + Math.random()
    }

    return generator.generate().then(() => {
      throw new Error("should have been rejected")
    }).catch((error) => {
      expect(error.name).toBe("OAuthError")
      expect(error.message).toBe(window.chrome.runtime.lastError.message)
    })
  })

})
