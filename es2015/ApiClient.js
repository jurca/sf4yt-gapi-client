
/**
 * Base URL of the REST API.
 *
 * @type {string}
 */
const API_BASE = "https://www.googleapis.com/"

/**
 * Separator of query parameter pairs to use when serializing query parameters
 * into a query string.
 *
 * @type {string}
 */
const QUERY_PARAMETERS_SEPARATOR = "&"

/**
 * Private field and method symbols.
 *
 * @type {Object<string, symbol>}
 */
const PRIVATE = Object.freeze({
  // fields
  baseUrl: Symbol("baseUrl"),
  apiKey: Symbol("apiKey"),
  tokenProvider: Symbol("tokenProvider"),
  loadTimeout: Symbol("loadTimeout"),

  // methods
  encodeQueryData: Symbol("encodeQueryData"),
  prepareAndSendRequest: Symbol("prepareAndSendRequest"),
  sendRequest: Symbol("sendRequest"),
  processRequest: Symbol("processRequest")
})

/**
 * Google REST API client.
 */
export default class ApiClient {
  /**
   * Initializes the Google REST API client.
   *
   * @param {string} service The service to access, for example "youtube".
   * @param {number} version The version of the REST API to access, for example
   *        3.
   * @param {string} apiKey The REST API key to use when not using resources
   *        requiring authorization.
   * @param {AbstractOAuthTokenGenerator} tokenProvider Generator of OAuth2.0
   *        tokens to use.
   * @param {number=} loadTimeout The REST API request timeout in milliseconds,
   *        defaults to 15 seconds.
   */
  constructor(service, version, apiKey, tokenProvider, loadTimeout = 15000) {
    /**
     * The base URL of the service within the Google REST API to access.
     *
     * @type {string}
     */
    this[PRIVATE.baseUrl] = `${API_BASE}${service}/v${version}/`

    /**
     * The REST API key to use when not using resources requiring
     * authorization.
     *
     * @type {string}
     */
    this[PRIVATE.apiKey] = apiKey

    /**
     * Generator of OAuth2.0 tokens to use.
     *
     * @type {AbstractOAuthTokenGenerator}
     */
    this[PRIVATE.tokenProvider] = tokenProvider

    /**
     * The REST API request timeout in milliseconds, defaults to 15 seconds.
     *
     * @type {number}
     */
    this[PRIVATE.loadTimeout] = loadTimeout

    Object.freeze(this)
  }

  /**
   * Retrieves an entity or entities at the specified location matching the
   * specified criteria.
   *
   * @param {string} path The path within the REST API denoting the resource or
   *        entity to query.
   * @param {Object<string, ?(boolean|number|string)>} parameters Parameters
   *        restricting the result to return.
   * @param {boolean=} authorized Flag signalling whether the request should be
   *        sent as authorized by user (requires OAuth2 token) or not. Some
   *        REST resources will require authorization.
   * @return {Promise<Object>} A promise that will resolve to the response body
   *         parsed as JSON.
   */
  list(path, parameters, authorized = false) {
    return this[PRIVATE.prepareAndSendRequest](
      "GET",
      path,
      parameters,
      authorized
    )
  }

  /**
   * Creates a new entity at the specified path.
   *
   * @param {string} path The path within the REST API denoting the location
   *        where the entity should be created.
   * @param {Object<string, *>} data The data representing the entity.
   * @param {boolean=} authorized Flag signalling whether the request should be
   *        sent as authorized by user (requires OAuth2 token) or not. Some
   *        REST resources will require authorization.
   * @return {Promise<Object>} A promise that will resolve to the response body
   *         parsed as JSON.
   */
  insert(path, data, authorized = false) {
    return this[PRIVATE.prepareAndSendRequest]("POST", path, data, authorized)
  }

  /**
   * Updates the entity denoted by the provided path.
   *
   * @param {string} path The path within the REST API denoting the entity.
   * @param {Object<string, *>} data Data representing the updated the entity
   *        and related metadata.
   * @param {boolean=} authorized Flag signalling whether the request should be
   *        sent as authorized by user (requires OAuth2 token) or not. Some
   *        REST resources will require authorization.
   * @return {Promise<Object>} A promise that will resolve to the response
   *         body parsed as JSON.
   */
  update(path, data, authorized = false) {
    return this[PRIVATE.prepareAndSendRequest]("PUT", path, data, authorized)
  }

  /**
   * Deletes the entity denoted by the provided path.
   *
   * @param {string} path The path within the REST API denoting the entity.
   * @param {Object<string, *>} parameters The operations parameters to send to
   *        the server. There will be send as JSON-encoded request body.
   * @param {boolean=} authorized Flag signalling whether the request should be
   *        sent as authorized by user (requires OAuth2 token) or not. Some
   *        REST resources will require authorization.
   * @return {Promise<Object>} A promise that will resolve to the response
   *         body parsed as JSON.
   */
  delete(path, parameters, authorized = false) {
    return this[PRIVATE.prepareAndSendRequest](
      "DELETE",
      path,
      parameters,
      authorized
    )
  }

  /**
   * Sends the specified request to the Google API.
   *
   * @param {("GET"|"POST"|"PUT"|"DELETE")} method The HTTP method to use.
   * @param {string} path The URI path within the REST API to send the request
   *        to.
   * @param {Object<string, *>} data The data to send to the server. These will
   *        be URI-encoded and sent as query string when the {@code GET} HTTP
   *        method is used, otherwise they will be JSON-encoded and sent as the
   *        request body.
   * @param {boolean} authorized Flag signalling whether the request should be
   *        sent as authorized by user (requires OAuth2 token) or not. Some
   *        REST resources will require authorization.
   * @return {Promise<Object>} A promise that will resolve to the response
   *         body parsed as JSON.
   */
  [PRIVATE.prepareAndSendRequest](method, path, data, authorized) {
    if (authorized) {
      return this[PRIVATE.tokenProvider].generate().then(
        startRequest.bind(this)
      )
    } else {
      return startRequest.call(this, null)
    }

    function startRequest(token) {
      let xhr = new XMLHttpRequest()

      let url = this[PRIVATE.baseUrl] + path
      let querySeparator = url.indexOf("?") > -1 ?
          QUERY_PARAMETERS_SEPARATOR : "?"

      if (!authorized) {
        url += querySeparator +
            "key=" + encodeURIComponent(this[PRIVATE.apiKey])
        querySeparator = QUERY_PARAMETERS_SEPARATOR
      }

      if (["GET", "DELETE"].indexOf(method) > -1) {
        url += querySeparator + this[PRIVATE.encodeQueryData](data)
      }
      xhr.open(method, url)
      xhr.timeout = this[PRIVATE.loadTimeout]

      if (authorized) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`)
      }
      if (["GET", "DELETE"].indexOf(method) === -1) {
        xhr.setRequestHeader("Content-Type", "application/json")
      }
      if ((typeof chrome !== "undefined") && chrome.runtime) {
        let extensionId = chrome.runtime.id
        xhr.setRequestHeader("Chrome-Extension-ID", extensionId)
      }

      return this[PRIVATE.sendRequest](
        xhr,
        (["GET", "DELETE"].indexOf(method) === -1) ? data : null
      )
    }
  }

  /**
   * Sends the provided request and data to the server. The method will handle
   * the response and errors within the returned promise.
   *
   * @param {XMLHttpRequest} xhr The semi-prepared request to send.
   * @param {?Object<string, *>} data The data to send to the server, they will
   *        be JSON-encoded and sent as the request body.
   * @return {Promise<Object>} A promise that will resolve to the response
   *         body parsed as JSON.
   */
  [PRIVATE.sendRequest](xhr, data) {
    return new Promise((resolve, reject) => {
      xhr.addEventListener("load", () => {
        this[PRIVATE.processRequest](xhr, resolve, reject)
      })

      xhr.addEventListener("abort", () => {
        let rejectionError = new Error("The request has been aborted")
        rejectionError.name = "HttpAbortError"
        rejectionError.xhr = xhr
        reject(rejectionError)
      })

      xhr.addEventListener("error", (event) => {
        let rejectionError = new Error("A network error has occurred")
        rejectionError.name = "HttpError"
        rejectionError.xhr = xhr
        rejectionError.errorEvent = event
        reject(rejectionError)
      })

      xhr.addEventListener("timeout", () => {
        let rejectionError = new Error("The request has timed out, the " +
            `timeout is set to ${this[PRIVATE.loadTimeout]} ms`)
        rejectionError.name = "HttpTimeoutError"
        rejectionError.xhr = xhr
        reject(rejectionError)
      })

      if (data) {
        xhr.send(JSON.stringify(data))
      } else {
        xhr.send()
      }
    })
  }

  /**
   * Processes a request that has had its response fully loaded.
   *
   * @param {XMLHttpRequest} xhr The XML HTTP request that was just loaded.
   * @param {function(Object)} resolve Callback to execute if the request was
   *        successful. The callback should receive the response body parsed as
   *        JSON as its argument.
   * @param {function(Error)} reject Callback to execute if the request has
   *        failed.
   */
  [PRIVATE.processRequest](xhr, resolve, reject) {
    if (xhr.status !== 200) {
      let rejectionError = new Error("The Google API rejected the " +
          `request with ${xhr.status} (${xhr.statusText}) code`)
      rejectionError.name = "GoogleApiError"
      rejectionError.xhr = xhr
      reject(rejectionError)
      return
    }

    let response = xhr.responseText
    try {
      resolve(JSON.parse(response))
    } catch (parseError) {
      let rejectionError = new Error(`Cannot parse response body: ${response}`)
      rejectionError.name = "HttpBodyParseError"
      rejectionError.xhr = xhr
      rejectionError.parseError = parseError
      reject(rejectionError)
    }
  }

  /**
   * Returns a query string generated from the provided data, without a
   * starting question mark (?).
   *
   * @param {Object<string, ?(boolean|number|string)>} data URI-compatible data
   *        to encode.
   * @return {string} URI-encoded query string generated from the provided
   *         data.
   */
  [PRIVATE.encodeQueryData](data) {
    return Object.keys(data).map((parameterName) => {
      return [parameterName, data[parameterName]]
    }).map((pair) => {
      return pair.map(encodeURIComponent).join("=")
    }).join(QUERY_PARAMETERS_SEPARATOR)
  }
}
