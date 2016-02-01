
import AbstractTokenGenerator from "../es2015/AbstractOAuthTokenGenerator"

export function promiseIt(behavior, test) {
  it(behavior, (done) => {
    test().then(done).catch((error) => {
      fail(error)
      done()
    })
  })
}

export function fpromiseIt(behavior, test) {
  fit(behavior, (done) => {
    test().then(done).catch((error) => {
      fail(error)
      done()
    })
  })
}

// I really wonder how Google expects me to keep safe a *browser* API key when
// it has to be used *in* the browser
export let KEY = eval(atob(
  "KGZ1bmN0aW9uICgpIHsgdmFyIHBhcnRzPVsiYVQyWTRWamsyZURZdyIsICJRVWw2WVZONVF" +
  'YYzFjeSIsICJreU1HRmthRVZFVFMxIiwgIjFsT1cxd2FtMUpSbSJdOyByZXR1cm4gYXRvYi' +
  `hbcGFydHNbMV0sIHBhcnRzWzNdLCBwYXJ0c1syXSwgcGFydHNbMF1dLmpvaW4oIiIpKSB9K` +
  'Ckp'
))

export class DummyTokenGenerator extends AbstractTokenGenerator {
  generate() {
    return Promise.resolve("THIS IS AN INVALID TOKEN USED FOR UNIT TESTING")
  }
}
