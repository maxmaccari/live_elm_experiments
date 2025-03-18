import { registerElm } from './hooks/ElmApp'
import { Elm } from '../src/Counter.elm';


registerElm("Counter", {
  init(opts) {
    // You can access the flags and counter from here...
    return Elm.Counter.init(opts)
  }
})