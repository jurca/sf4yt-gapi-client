
export function promiseIt(behavior, test) {
  it(behavior, (done) => {
    test().then(done).catch((error) => {
      fail(error)
      done()
    })
  })
}
