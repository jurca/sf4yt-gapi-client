
const PRIVATE = Object.freeze({
  apiClient: Symbol("apiClient")
})

export default class YouTubeApiClient {
  constructor(apiClient) {
    this[PRIVATE.apiClient] = apiClient
  }

  /**
   * accountId = null requires authorization
   *
   * @param {?string} accountId
   * @return {Promise<?{id: string, title: string, playlistIds: {watchHistory: ?string, watchLater: ?string}}>}
   */
  getAccountInfo(accountId = null) {
    let parameters = {
      part: "id,snippet,contentDetails",
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
   * Require authorization for accessing user's watch history and watch later
   * playlist.
   *
   * @param {string} accountId
   * @param {boolean} authorized
   * @return {Promise<{id: string, title: string, videoCount: number, thumbnails: Object<string, string>}[]>}
   */
  getSubscribedChannels(accountId, authorized) {
    // TODO: paging (response.nextPageToken: string=), post-processing
    return this[PRIVATE.apiClient].list("subscriptions", {
      part: "snippet,contentDetails",
      channelId: accountId,
      maxResults: 50,
      fields: "pageInfo,nextPageToken," +
          "items(snippet(title,resourceId,thumbnails)," +
          "contentDetails/totalItemCount)"
    }, authorized)
    // parameters.pageToken = response.nextPageToken
  }

  /**
   * @param {string} channelId
   * @return {Promise<?string>}
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
   * @param {?string} playlistId
   * @return {Promise<?{id: string, title: string, description: string, videoCount: number, thumbnails: Object<string, {url: string, width: number, height: number}>}>}
   */
  getPlaylistInfo(playlistId) {
    return this[PRIVATE.apiClient].list("playlists", {
      part: "snippet,contentDetails",
      id: playlistId,
      fields: "items(id,snippet(title,description,thumbnails),contentDetails)"
    }).then((response) => {
      if (!response.items.length) {
        return null
      }

      let playlist = response.items[0]
      return {
        id: playlist.id,
        title: playlist.snippet.title,
        description: playlist.snippet.description,
        videoCount: playlist.contentDetails.itemCount,
        thumbnails: playlist.snippet.thumbnails
      }
    })
  }

  /**
   * @param {string} playlistId
   * @return {Promise<{title: string, description: string, publishedAt: Date, thumbnails: Object<string, {url: string, width: number, height: number}>}[]>}
   */
  getPlaylistVideos(playlistId) {
    // TODO: paging (response.nextPageToken: string=), post-processing
    return this[PRIVATE.apiClient].list("playlistItems", {
      part: "snippet,contentDetails",
      maxResults: 50,
      playlistId,
      fields: "pageInfo,nextPageToken,items/snippet(publishedAt,title," +
          "description,thumbnails,resourceId/videoId)"
    })
    // parameters.pageToken = response.nextPageToken
  }

  /**
   * @param {string} videoId
   * @return {Promise<{duration: number, viewCount: number}>}
   */
  getVideoMetaData(videoId) {
    return this[PRIVATE.apiClient].list("videos", {
      part: "contentDetails,statistics",
      id: videoId,
      fields: "items(contentDetails/duration,statistics/viewCount)"
    }).then((response) => {
      if (!response.items.length) {
        return null
      }

      let video = response.items[0]
      return {
        // TODO: parse duration, e.g. "PT7M39S" or "P1DT36M50S"
        duration: video.contentDetails.duration,
        viewCount: video.statistics.viewCount
      }
    })
  }

  /**
   * Requires authorization.
   *
   * @param {string} playlistId
   * @param {string} videoId
   * @return {Promise<undefined>}
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
}
