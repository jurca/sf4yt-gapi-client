
import ApiClient from "../es2015/ApiClient"
import {promiseIt, KEY, DummyTokenGenerator} from "./testUtils"

describe("ApiClient", () => {

  let client

  beforeEach(() => {
    client = new ApiClient("youtube", 3, KEY, new DummyTokenGenerator())
  })

  promiseIt("should be able to list resources", () => {
    return client.list("playlistItems", {
      part: "snippet",
      maxResults: 5,
      playlistId: "UU9-y-6csu5WGm29I7JiwpnA",
      fields: "pageInfo,items/snippet/resourceId/videoId"
    }).then((response) => {
      expect(response instanceof Object).toBeTruthy()
      expect(response.pageInfo instanceof Object).toBeTruthy()
      expect(typeof response.pageInfo.totalResults).toBe("number")
      expect(response.pageInfo.resultsPerPage).toBe(5)
      expect(response.items instanceof Array).toBeTruthy()
      expect(response.items.length).toBeLessThan(6)

      for (let resource of response.items) {
        expect(resource instanceof Object).toBeTruthy()
        expect(resource.snippet instanceof Object).toBeTruthy()
        expect(resource.snippet.resourceId instanceof Object).toBeTruthy()
        expect(typeof resource.snippet.resourceId.videoId).toBe("string")
      }
    })
  })

  promiseIt("should be able to create resources", () => {
    return client.insert("playlistItems?part=snippet", {
      snippet: {
        playlistId: "UU9-y-6csu5WGm29I7JiwpnA",
        resourceId: {
          kind: "youtube#video",
          videoId: "vhiiia1_hC4"
        }
      }
    }, true).then(() => {
      fail("should have failed")
    }).catch((error) => {
      expect(error.name).toBe("GoogleApiError")
      expect(error.xhr instanceof XMLHttpRequest).toBeTruthy()
      let xhr = error.xhr
      expect(xhr.status).toBe(401)

      let response = JSON.parse(xhr.responseText)
      expect(response instanceof Object).toBeTruthy()
      expect(response.error instanceof Object).toBeTruthy()
      expect(response.error.errors instanceof Array).toBeTruthy()
      expect(response.error.code).toBeGreaterThan(400)
      expect(typeof response.error.message).toBe("string")
    })
  })

  promiseIt("should be able to modify resources", () => {
    return client.update("playlistItems?part=snippet", {
      snippet: {
        playlistId: "UU9-y-6csu5WGm29I7JiwpnA",
        resourceId: {
          kind: "youtube#video",
          videoId: "vhiiia1_hC4"
        }
      }
    }, true).then(() => {
      fail("should have failed")
    }).catch((error) => {
      expect(error.name).toBe("GoogleApiError")
      expect(error.xhr instanceof XMLHttpRequest).toBeTruthy()
      let xhr = error.xhr
      expect(xhr.status).toBeGreaterThan(400)

      let response = JSON.parse(xhr.responseText)
      expect(response instanceof Object).toBeTruthy()
      expect(response.error instanceof Object).toBeTruthy()
      expect(response.error.errors instanceof Array).toBeTruthy()
      expect(response.error.code).toBe(401)
      expect(typeof response.error.message).toBe("string")
    })
  })

  promiseIt("should be able to delete resources", () => {
    return client.delete("playlistItems", {
      id: "UUlNFC2CEWsBrKq8B_Su3nXYI4C1iBgVVu"
    }, true).then(() => {
      fail("should have failed")
    }).catch((error) => {
      expect(error.name).toBe("GoogleApiError")
      expect(error.xhr instanceof XMLHttpRequest).toBeTruthy()
      let xhr = error.xhr
      expect(xhr.status).toBeGreaterThan(400)

      let response = JSON.parse(xhr.responseText)
      expect(response instanceof Object).toBeTruthy()
      expect(response.error instanceof Object).toBeTruthy()
      expect(response.error.errors instanceof Array).toBeTruthy()
      expect(response.error.code).toBe(401)
      expect(typeof response.error.message).toBe("string")
    })
  })

})
