
import ApiClient from "../es2015/ApiClient"
import YouTubeApiClient from "../es2015/YouTubeApiClient"
import {promiseIt, KEY, DummyTokenGenerator} from "./testUtils"

describe("YouTubeApiClient", () => {

  const ACCOUNT_ID = "UC6bWFkixiTGdUHiveqcDohA"

  let apiClient = new ApiClient("youtube", 3, KEY, new DummyTokenGenerator())
  let client = new YouTubeApiClient(apiClient)

  promiseIt("should retrieve the account info", () => {
    return client.getAccountInfo(ACCOUNT_ID).then((account) => {
      expect(account).toEqual({
        id: ACCOUNT_ID,
        title: "Martin Jurča",
        playlistIds: {
          watchHistory: null,
          watchLater: null
        }
      })

      return client.getAccountInfo()
    }).then(() => {
      fail("The request should have been rejected with authorization error")
    }).catch((error) => {
      expect(error.name).toBe("GoogleApiError")
      expect(error.xhr instanceof XMLHttpRequest).toBeTruthy()
      expect(error.xhr.status).toBeGreaterThan(400)
    })
  })

  promiseIt("should retrieve the channel ID by username", () => {
    return client.getUserChannelId("DevelX666").then((channelId) => {
      expect(channelId).toBeTruthy()
      expect(typeof channelId).toBe("string")
    })
  })

  promiseIt("should retrieve channel info", () => {
    let channelId = "UC9-y-6csu5WGm29I7JiwpnA"
    return client.getChannelInfo(channelId).then((channel) => {
      expect(channel instanceof Object).toBeTruthy()
      expect(channel.id).toBe(channelId)
      expect(channel.title).toBe("Computerphile")
      expect(channel.uploadsPlaylistId).toBe("UU9-y-6csu5WGm29I7JiwpnA")
      expect(channel.thumbnails instanceof Object).toBeTruthy()
      expect(Object.keys(channel.thumbnails).length).toBeGreaterThan(0)
    })
  })

  promiseIt("should be able to retrieve subscriptions", () => {
    return client.getSubscribedChannels(ACCOUNT_ID).then((subscriptions) => {
      expect(subscriptions instanceof Array).toBeTruthy()
      expect(subscriptions.length).toBeGreaterThan(0)

      for (let subscription of subscriptions) {
        expect(subscription instanceof Object).toBeTruthy()
        expect(typeof subscription.id).toBe("string")
        expect(typeof subscription.title).toBe("string")
        expect(subscription.videoCount).toBeGreaterThan(-1)
        expect(subscription.thumbnails instanceof Object).toBeTruthy()
        expect(Object.keys(subscription.thumbnails).length).toBeGreaterThan(0)
      }

      return client.getSubscribedChannels()
    }).then(() => {
      fail("The request should have been rejected with authorization error")
    }).catch((error) => {
      expect(error.name).toBe("GoogleApiError")
      expect(error.xhr instanceof XMLHttpRequest).toBeTruthy()
      expect(error.xhr.status).toBeGreaterThan(400)
    })
  })

  promiseIt("should fetch the uploads playlist id for a channel", () => {
    let channelId = "UC9-y-6csu5WGm29I7JiwpnA"
    return client.getUploadsPlaylistId(channelId).then((uploadsPlaylistId) => {
      expect(uploadsPlaylistId).toBeTruthy()
      expect(typeof uploadsPlaylistId).toBe("string")

      return client.getUploadsPlaylistId("abcdefgjkl").then((id) => {
        expect(id).toBeNull()
      })
    })
  })

  promiseIt("should fetch the uploads playlist ids for a group of channels",
      () => {
    let channelIds = ["UC9-y-6csu5WGm29I7JiwpnA", "UCzoVCacndDCfGDf41P-z0iA"]
    return client.getUploadsPlaylistIds(channelIds).then((playlistIds) => {
      expect(playlistIds instanceof Array).toBeTruthy()
      expect(playlistIds.length).toBe(2)

      let matches = 0

      for (let playlistId of playlistIds) {
        if (channelIds.indexOf(playlistId.id) > -1) {
          matches++
        }
        expect(playlistId.uploadsPlaylistId).toBeTruthy()
        expect(typeof playlistId.uploadsPlaylistId).toBe("string")
      }

      expect(matches).toBe(2)
    })
  })

  promiseIt("should fetch playlist information", () => {
    let playlistId = "UU9-y-6csu5WGm29I7JiwpnA"
    return client.getPlaylistInfo(playlistId).then((playlist) => {
      expect(playlist instanceof Object).toBeTruthy()
      expect(playlist.id).toBe(playlistId)
      expect(typeof playlist.title).toBe("string")
      expect(typeof playlist.description).toBe("string")
      expect(typeof playlist.channelId).toBe("string")
      expect(typeof playlist.videoCount).toBe("number")
      expect(playlist.videoCount).toBeGreaterThan(-1)
      expect(playlist.thumbnails instanceof Object).toBeTruthy()
    })
  })

  promiseIt("should fetch playlist information for multiple playlists", () => {
    let playlistIds = ["UU9-y-6csu5WGm29I7JiwpnA"]
    return client.getPlaylists(playlistIds).then((playlists) => {
      expect(playlists instanceof Array).toBeTruthy()
      expect(playlists.length).toBe(1)

      for (let playlist of playlists) {
        expect(playlist instanceof Object).toBeTruthy()
        expect(playlist.id).toBe(playlistIds[0])
        expect(typeof playlist.title).toBe("string")
        expect(typeof playlist.description).toBe("string")
        expect(typeof playlist.channelId).toBe("string")
        expect(typeof playlist.videoCount).toBe("number")
        expect(playlist.videoCount).toBeGreaterThan(-1)
        expect(playlist.thumbnails instanceof Object).toBeTruthy()
      }
    })
  })

  promiseIt("should fetch video counts of a group of playlists", () => {
    let playlistIds = ["UU9-y-6csu5WGm29I7JiwpnA"]
    return client.getPlaylistVideoCounts(playlistIds).then((playlists) => {
      expect(playlists instanceof Array).toBeTruthy()
      expect(playlists.length).toBe(1)

      let playlist = playlists[0]
      expect(playlist.id).toBe(playlistIds[0])
      expect(playlist.videoCount).toBeGreaterThan(-1)
    })
  })

  promiseIt("should fetch playlist thumbnails of a group of playlists", () => {
    let playlistIds = ["UU9-y-6csu5WGm29I7JiwpnA"]
    return client.getPlaylistThumbnails(playlistIds).then((playlists) => {
      expect(playlists instanceof Array).toBeTruthy()
      let playlist = playlists[0]
      expect(playlist.id).toBe(playlistIds[0])
      expect(playlist.thumbnails instanceof Object).toBeTruthy()

      for (let quality of Object.keys(playlist.thumbnails)) {
        let thumbnail = playlist.thumbnails[quality]
        expect(typeof thumbnail.url).toBe("string")
        expect(typeof thumbnail.width).toBe("number")
        expect(typeof thumbnail.height).toBe("number")
      }
    })
  })

  promiseIt("should fetch playlist videos", () => {
    let playlistId = "UU9-y-6csu5WGm29I7JiwpnA"
    let pageLimit = 2
    return client.getPlaylistVideos(playlistId, (fetchedItems) => {
      expect(fetchedItems).toEqual(jasmine.any(Array))
      expect(fetchedItems.length).toBeGreaterThan(0)

      for (let item of fetchedItems) {
        expect(item).toEqual(jasmine.any(Object))
        expect(item.id).toEqual(jasmine.any(String))
        expect(item.title).toEqual(jasmine.any(String))
        expect(item.description).toEqual(jasmine.any(String))
        expect(item.publishedAt).toEqual(jasmine.any(Date))
        expect(item.publishedAt.valueOf()).not.toBeNaN()
        expect(item.channelId).toEqual(jasmine.any(String))
        expect(item.thumbnails).toEqual(jasmine.any(Object))

        for (let quality of Object.keys(item.thumbnails)) {
          let thumbnail = item.thumbnails[quality]
          expect(thumbnail.url).toEqual(jasmine.any(String))
          expect(thumbnail.width).toEqual(jasmine.any(Number))
          expect(thumbnail.width).toBeGreaterThan(0)
          expect(thumbnail.height).toEqual(jasmine.any(Number))
          expect(thumbnail.height).toBeGreaterThan(0)
        }
      }

      return --pageLimit
    }).then((videos) => {
      expect(videos instanceof Array).toBeTruthy()
      expect(videos.length).toBeGreaterThan(-1)

      for (let video of videos) {
        expect(video).toEqual(jasmine.any(Object))
        expect(video.id).toEqual(jasmine.any(String))
        expect(video.title).toEqual(jasmine.any(String))
        expect(video.description).toEqual(jasmine.any(String))
        expect(video.publishedAt).toEqual(jasmine.any(Date))
        expect(video.publishedAt.valueOf()).not.toBeNaN()
        expect(video.channelId).toEqual(jasmine.any(String))
        expect(video.thumbnails).toEqual(jasmine.any(Object))

        for (let quality of Object.keys(video.thumbnails)) {
          let thumbnail = video.thumbnails[quality]
          expect(thumbnail.url).toEqual(jasmine.any(String))
          expect(thumbnail.width).toEqual(jasmine.any(Number))
          expect(thumbnail.width).toBeGreaterThan(0)
          expect(thumbnail.height).toEqual(jasmine.any(Number))
          expect(thumbnail.height).toBeGreaterThan(0)
        }
      }
    })
  })

  promiseIt("should fetch video meta data", () => {
    let videoId = "5KEhhW8TOGk"
    return client.getVideoMetaData("abc fdsa dd").then((video) => {
      expect(video).toBeNull()

      return client.getVideoMetaData(videoId)
    }).then((video) => {
      expect(video).toEqual(jasmine.any(Object))
      expect(video.id).toEqual(jasmine.any(String))
      expect(video.duration).toEqual(jasmine.any(Number))
      expect(video.duration).toBeGreaterThan(0)
      expect(video.viewCount).toEqual(jasmine.any(Number))
      expect(video.viewCount).toBeGreaterThan(0)
    })
  })

  promiseIt("should fetch video meta data for a group of videos", () => {
    let videoIds = ["5KEhhW8TOGk"]
    return client.getVideosMetaData(videoIds).then((videos) => {
      expect(videos).toEqual(jasmine.any(Array))
      expect(videos.length).toBe(1)

      for (let video of videos) {
        expect(video).toEqual(jasmine.any(Object))
        expect(video.id).toEqual(jasmine.any(String))
        expect(video.duration).toEqual(jasmine.any(Number))
        expect(video.duration).toBeGreaterThan(0)
        expect(video.viewCount).toEqual(jasmine.any(Number))
        expect(video.viewCount).toBeGreaterThan(0)
      }
    })
  })

  promiseIt("should fail to add a video to a playlist due to an " +
      "authorization error", () => {
    let playlistId = "UU9-y-6csu5WGm29I7JiwpnA"
    let videoId = "5KEhhW8TOGk"
    return client.addPlaylistItem(playlistId, videoId).then(() => {
      fail("The request should have been rejected")
    }).catch((error) => {
      expect(error.name).toBe("GoogleApiError")
      expect(error.xhr instanceof XMLHttpRequest).toBeTruthy()
      expect(error.xhr.status).toBeGreaterThan(400)
    })
  })

})
