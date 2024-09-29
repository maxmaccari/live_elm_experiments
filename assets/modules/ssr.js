const jsdom = require("jsdom")
const { JSDOM } = jsdom
const compiler = require("node-elm-compiler")
const test = compiler.compileToStringSync("../src/Main.elm", {optimize: false, cwd: "../"})

module.exports = (html) => {
    return test
  }
