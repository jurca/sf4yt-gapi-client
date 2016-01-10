
import moment from "moment/src/moment"

/**
 * Private field and method symbols.
 *
 * @type {Object<string, symbol>}
 */
const PRIVATE = Object.freeze({
  // fields
  apiClient: Symbol("apiClient"),

  // methods
  listAll: Symbol("listAll")
})

/**
 * High-level YouTube REST API client.
 */
export default class YouTubeApiClient {
  /**
   * Initializes the YouTube API client.
   *
   * @param {ApiClient} apiClient The Google REST API client to use for
   *        accessing the YouTube-related APIs.
   */
  constructor(apiClient) {
    /**
     * The Google REST API client to use for accessing the YouTube-related
     * APIs.
     *
     * @type {ApiClient}
     */
    this[PRIVATE.apiClient] = apiClient

    Object.freeze(this)
  }

  /**
   * Retrieves the information about the specified YouTube account or the
   * account of the currently authorized user.
   *
   * @param {?string} accountId The ID of the YouTube account, or {@code null}
   *        if the information should be fetched for the account of the
   *        currently authorized user.
   * @return {Promise<?{id: string, title: string, playlistIds: {watchHistory: ?string, watchLater: ?string}}>}
   *         A promise that will resolve into information about the YouTube
   *         account.
   */
  getAccountInfo(accountId = null) {
    let parameters = {
      part: "snippet,contentDetails",
      fields: "items(id,snippet/title," +
          "contentDetails/relatedPlaylists(watchHistory,watchLater))"
    }
    if (accountId) {
      parameters.id = accountId
    } else {
      parameters.mine = true
    }

    return this[PRIVATE.apiClient].list(
      "channels",
      parameters,
      !accountId
    ).then((response) => {
      if (!response.items.length) {
        return null
      }

      let account = response.items[0]
      let result = {
        id: account.id,
        title: account.snippet.title,
        playlistIds: {
          watchHistory: null,
          watchLater: null
        }
      }
      if (account.contentDetails && account.contentDetails.relatedPlaylists) {
        let playlists = account.contentDetails.relatedPlaylists
        result.playlistIds.watchHistory = playlists.watchHistory || null
        result.playlistIds.watchLater = playlists.watchLater || null
      }

      return result
    })
  }

  /**
   * Fetches the channel ID of the specified user.
   *
   * @param {string} username The YouTube username.
   * @return {Promise<?string>} A promise that will resolve to the channel ID
   *         of the specified YouTube user, or {@code null} if the user does
   *         not exist.
   */
  getUserChannelId(username) {
    return this[PRIVATE.apiClient].list("channels", {
      part: "id",
      forUsername: username,
      fields: "items/id"
    }).then((response) => {
      if (!response.items.length) {
        return null
      }

      return response.items[0].id
    })
  }

  /**
   * Fetches the list of channels the current user is subscribed to. The method
   * requires the current user to be authorized and have valid (unexpired)
   * OAuth2 token if the account ID is {@code null}.
   *
   * The thumbnails object keys describe the thumbnail quality at the given
   * URL. The keys, sorted from the lowest quality, to the highest, with their
   * dimensions (at the moment of writing this) attached, are as follows:
   *
   * - {@code default} - 88 &times; 88 pixels
   * - {@code high} - 240 &times; 240 pixels
   *
   * @param {?string=} accountId Youtube account ID, must be the current user's
   *        account ID, or {@code null}.
   * @param {?boolean=} authorized Whether or not the request should be
   *        authorized using OAuth. Defaults to {@code null}, which means
   *        authorized request when the {@code accountId} is {@code null}, and
   *        unauthorized request when the {@code accountId} is provided.
   * @return {Promise<{id: string, title: string, videoCount: number, thumbnails: Object<string, string>}[]>}
   *         A promise that will resolve into a list of objects, where each
   *         object represents a single YouTube channel the current user or the
   *         specified user is subscribed to.
   */
  getSubscribedChannels(accountId = null, authorized = null) {
    let parameters = {
      part: "snippet,contentDetails",
      maxResults: 50,
      fields: "pageInfo,nextPageToken," +
          "items(snippet(title,resourceId,thumbnails)," +
          "contentDetails/totalItemCount)"
    }
    if (accountId) {
      parameters.channelId = accountId
      if (authorized === null) {
        authorized = false
      }
    } else {
      parameters.mine = true
      if (authorized === null) {
        authorized = true
      }
    }

    return this[PRIVATE.listAll](
      "subscriptions",
      parameters,
      () => true,
      authorized
    ).then((items) => {
      return items.map((item) => {
        return {
          id: item.snippet.resourceId.channelId,
          title: item.snippet.title,
          videoCount: item.contentDetails.totalItemCount,
          thumbnails: item.snippet.thumbnails
        }
      })
    })
  }

  /**
   * Fetches the uploaded videos playlist ID of the specified YouTube channel.
   *
   * @param {string} channelId Channel ID.
   * @return {Promise<?string>} A promise that will resolve to the playlist ID
   *         of the uploads playlist for the specified channel ID. The ID will
   *         be {@code null} if the channel is not found.
   */
  getUploadsPlaylistId(channelId) {
    return this[PRIVATE.apiClient].list("channels", {
      part: "contentDetails",
      id: channelId,
      fields: "items/contentDetails/relatedPlaylists/uploads"
    }).then((response) => {
      if (response.items.length) {
        return null
      }

      let channelInfo = response.items[0]
      return channelInfo.contentDetails.relatedPlaylists.uploads
    })
  }

  /**
   * Retrieves the uploads playlist IDs for the specified YouTube channels.
   *
   * @param {string[]} channelIds Channel IDs.
   * @return {Promise<{id: string, uploadsPlaylistId: string}[]>} A promise
   *         that will resolve into an array of objects matching the channel
   *         IDs to uploads playlist IDs. The array will not contain elements
   *         for channels that were not found.
   */
  getUploadsPlaylistIds(channelIds) {
    return this[PRIVATE.listAll]("channels", {
      part: "contentDetails",
      id: channelIds.join(","),
      fields: "items(id,contentDetails/relatedPlaylists/uploads)"
    }).then((channels) => {
      return channels.map((channel) => {
        return {
          id: channel.id,
          uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads
        }
      })
    })
  }

  /**
   * Fetches information about the specified playlist. The method requires the
   * current user to be authorized and have valid (unexpired) OAuth2 token if
   * the playlist is the user's watch history or the watch later playlist.
   *
   * The thumbnails object keys describe the thumbnail quality, and, sorted
   * from the lowest quality to the highest, are as follows:
   *
   * - {@code default}
   * - {@code medium}
   * - {@code high}
   * - {@code standard}
   * - {@code maxres}
   *
   * Note that the thumbnails may change with every video added to the
   * playlist.
   *
   * @param {string} playlistId Playlist ID.
   * @param {boolean=} authorized Flag signalling whether the request should be
   *        authorized by the user. This is required for the user's watch
   *        history and watch later playlist.
   * @return {Promise<?{id: string, title: string, description: string, channelId: string, videoCount: number, thumbnails: Object<string, {url: string, width: number, height: number}>}>}
   *         A promise that will resolve to information about the specified
   *         playlist. The playlist info will be {@code null} if the playlist
   *         is not found.
   */
  getPlaylistInfo(playlistId, authorized = false) {
    return this[PRIVATE.apiClient].list("playlists", {
      part: "snippet,contentDetails",
      id: playlistId,
      fields: "items(id,snippet(title,description,channelId,thumbnails)," +
          "contentDetails)"
    }, authorized).then((response) => {
      if (!response.items.length) {
        return null
      }

      let playlist = response.items[0]
      return {
        id: playlist.id,
        title: playlist.snippet.title,
        description: playlist.snippet.description,
        channelId: playlist.snippet.channelId,
        videoCount: playlist.contentDetails.itemCount,
        thumbnails: playlist.snippet.thumbnails
      }
    })
  }

  /**
   * Retrieves the video counts for the specified playlists. The method
   * requires the current user to be authorized and have valid (unexpired)
   * OAuth2 token if the playlist is the user's watch history or the watch
   * later playlist.
   *
   * @param {string[]} playlistIds Playlist IDs.
   * @param {boolean=} authorized Flag signalling whether the request should be
   *        authorized by the user. This is required for the user's watch
   *        history and watch later playlist.
   * @return {Promise<{id: string, videoCount: number}[]>} A promise that will
   *         resolve to objects representing the meta information about the
   *         specified playlists. The array will not contain items for
   *         playlists that were not found.
   */
  getPlaylistVideoCounts(playlistIds, authorized = false) {
    return this[PRIVATE.listAll]("playlists", {
      part: "contentDetails",
      id: playlistIds.join(","),
      fields: "items(id,contentDetails)"
    }, () => true, authorized).then((playlists) => {
      return playlists.map((playlist) => {
        return {
          id: playlist.id,
          videoCount: playlist.contentDetails.itemCount
        }
      })
    })
  }

  /**
   * Fetches the list of videos present in the specified playlist. The method
   * requires the current user to be authorized and have valid (unexpired)
   * OAuth2 token if the playlist is the user's watch history or the watch
   * later playlist.
   *
   * The thumbnails object keys describe the thumbnail quality, and, sorted
   * from the lowest quality to the highest, are as follows:
   *
   * - {@code default}
   * - {@code medium}
   * - {@code high}
   * - {@code standard}
   * - {@code maxres}
   *
   * @param {string} playlistId Playlist ID.
   * @param {function(Object[]): boolean} continuationPredicate A callback
   *        executed after each call to the REST API. The callback will receive
   *        the items fetched in the last REST API call and should return
   *        either {@code true} if the method should fetch the next page, or
   *        {@code false} if no additional pages need to be fetched.
   * @param {boolean=} authorized Flag signalling whether the request should be
   *        authorized by the user. This is required for the user's watch
   *        history and watch later playlist.
   * @return {Promise<{id: number, title: string, description: string, publishedAt: Date, channelId: string, thumbnails: Object<string, {url: string, width: number, height: number}>}[]>}
   *         A promise that will resolve to array of objects, each representing
   *         a single video.
   */
  getPlaylistVideos(playlistId, continuationPredicate = () => true,
      authorized = false) {
    return this[PRIVATE.listAll]("playlistItems", {
      part: "snippet,contentDetails",
      maxResults: 50,
      playlistId,
      fields: "pageInfo,nextPageToken,items/snippet(publishedAt,title," +
          "description,channelId,thumbnails,resourceId/videoId)"
    }, continuationPredicate, authorized).then((items) => {
      return items.map((item) => {
        return {
          id: item.resourceId.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          publishedAt: new Date(item.snippet.publishedAt),
          channelId: item.snippet.channelId,
          thumbnails: item.snippet.thumbnails
        }
      })
    })
  }

  /**
   * Fetches the duration and view count for the specified video.
   *
   * @param {string} videoId Video ID.
   * @return {Promise<?{id: number, duration: number, viewCount: number}>} A
   *         promise that will resolve to the video metadata. The result will
   *         be {@code null} if the video is not found.
   */
  getVideoMetaData(videoId) {
    return this[PRIVATE.apiClient].list("videos", {
      part: "contentDetails,statistics",
      id: videoId,
      fields: "items(id,contentDetails/duration,statistics/viewCount)"
    }).then((response) => {
      if (!response.items.length) {
        return null
      }

      let video = response.items[0]
      return {
        id: video.id,
        duration: moment.duration(video.contentDetails.duration).asSeconds(),
        viewCount: video.statistics.viewCount
      }
    })
  }

  /**
   * Fetches the durations and view counts for the specified videos.
   *
   * @param {string[]} videoIds Video IDs.
   * @return {Promise<{id: number, duration: number, viewCount: number}[]>} A
   *         promise that will resolve to the video metadata. The resulting
   *         array will not contain metadata of videos that were not found.
   */
  getVideosMetaData(videoIds) {
    return this[PRIVATE.listAll]("videos", {
      part: "contentDetails,statistics",
      id: videoIds.join(","),
      fields: "items(id,contentDetails/duration,statistics/viewCount)"
    }).then((response) => {
      return response.items.map((video) => {
        return {
          id: video.id,
          duration: moment.duration(video.contentDetails.duration).asSeconds(),
          viewCount: video.statistics.viewCount
        }
      })
    })
  }

  /**
   * Adds the specified video the the specified playlist. This method requires
   * the current user to be authorized and have valid (unexpired) OAuth2 token.
   *
   * @param {string} playlistId ID of the playlist to which the video should be
   *        added.
   * @param {string} videoId ID of the video to add to the playlist.
   * @return {Promise<undefined>} A promise that resolves when the item has
   *         been added to the playlist.
   */
  addPlaylistItem(playlistId, videoId) {
    return this[PRIVATE.apiClient].insert("playlistItems?part=snippet", {
      snippet: {
        playlistId: playlistId,
        resourceId: {
          kind: "youtube#video",
          videoId: videoId
        }
      }
    }, true).then(() => undefined)
  }

  /**
   * Fetches all pages of items from the REST API that are matching the
   * specified parameters.
   *
   * @param {string} path The path within the REST API denoting the resource or
   *        entity to query.
   * @param {Object<string, ?(boolean|number|string)>} parameters Parameters
   *        restricting the result to return.
   * @param {function(Object[]): boolean} continuationPredicate A callback
   *        executed after each call to the REST API. The callback will receive
   *        the items fetched in the last REST API call and should return
   *        either {@code true} if the method should fetch the next page, or
   *        {@code false} if no additional pages need to be fetched.
   * @param {boolean=} authorized Flag signalling whether the request should be
   *        sent as authorized by user (requires OAuth2 token) or not. Some
   *        REST resources will require authorization.
   * @return {Promise<Object[]>} A promise that will resolve to the items
   *         fetched from the REST API.
   */
  [PRIVATE.listAll](path, parameters, continuationPredicate = () => true,
      authorized = false) {
    let items = []

    return fetchNextPage()

    function fetchNextPage(pageToken) {
      let fetchParams = Object.assign({}, parameters)
      if (pageToken) {
        fetchParams.pageToken = pageToken
      }

      return this[PRIVATE.apiClient].list(
        path,
        fetchParams,
        authorized
      ).then((response) => {
        if (response.items) {
          items = items.concat(response.items)
        }

        if (response.nextPageToken && continuationPredicate(response.items)) {
          return fetchNextPage(response.nextPageToken)
        } else {
          return items
        }
      })
    }
  }
}
