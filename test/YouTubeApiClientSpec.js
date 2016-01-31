
import ApiClient from "../es2015/ApiClient"
import YouTubeApiClient from "../es2015/YouTubeApiClient"
import {promiseIt, KEY, DummyTokenGenerator} from "./testUtils"

fdescribe("YouTubeApiClient", () => {

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

})
