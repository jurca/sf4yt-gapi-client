
import AbstractTokenGenerator from "./AbstractOAuthTokenGenerator"

/**
 * Private field symbols.
 *
 * @type {Object<string, symbol>}
 */
const PRIVATE = Object.freeze({
  accountId: Symbol("accountId")
})

/**
 * OAuth2.0 token generator to use within Google Chrome extensions.
 */
export default class ChromeOAuthTokenGenerator extends AbstractTokenGenerator {
  /**
   * Initializes the OAuth token generator.
   *
   * @param {string} accountId GAIA ID of the user account for which the tokens
   *        should be retrieved.
   */
  constructor(accountId) {
    this[PRIVATE.accountId] = accountId

    Object.freeze(this)
  }

  /**
   * @inheritDoc
   * @override
   */
  generate() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({
        interactive: false,
        account: {
          id: this[PRIVATE.accountId]
        }
      }, (token) => {
        if (token) {
          resolve(token)
          return
        }

        let rejectionError = new Error(
          chrome.runtime.lastError.message || "Unknown OAuth2 API error"
        )
        rejectionError.name = "OAuthError"
        reject(rejectionError)
      })
    })
  }
}
