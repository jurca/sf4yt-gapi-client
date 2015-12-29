
/**
 * Base class of OAuth2.0 token generators.
 *
 * @abstract
 */
export default class AbstractOAuthTokenGenerator {
  /**
   * Initializes the token generator.
   */
  constructor() {
    if (new.target === AbstractOAuthTokenGenerator) {
      throw new Error("The AbstractOAuthTokenGenerator class is abstract " +
          "and must be overridden first")
    }

    if (this.generate === AbstractOAuthTokenGenerator.prototype.generate) {
      throw new Error("The generate method is abstract and must be overridden")
    }
  }

  /**
   * Generates an OAuth2.0 token to use when accessing the Google APIs.
   *
   * @return {Promise<string>} A promise that will resolve into the OAuth 2.0
   *         token to currently use.
   */
  generate() {
    throw new Error("The generate method is abstract and must be overridden")
  }
}
