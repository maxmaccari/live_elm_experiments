import { Elm as LiveCounterElm } from '../../src/LiveCounter.elm';
import { Elm as WrapperElm } from '../../src/Wrapper.elm';
import AHook from './AHook'
import { makeElmApp } from './ElmApp'



export default {
  ElmApp: makeElmApp({
    LiveCounter: LiveCounterElm.LiveCounter,
    Wrapper: WrapperElm.Wrapper,
  }),
  AHook
}