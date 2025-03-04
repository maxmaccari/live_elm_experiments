import { Elm as CounterElm  } from '../../src/Counter.elm';
import { Elm as LiveCounterElm  } from '../../src/LiveCounter.elm';
import { Elm as WrapperElm  } from '../../src/Wrapper.elm';



customElements.define("elm-slot", class extends HTMLElement {
  constructor () {
    super();
  }

  connectedCallback() {
    const slotId = this.getAttribute("slot") || "default";
    const appId = this.getAttribute("app");

    const children = window.liveElm.slots[appId]?.[slotId] || [];

    for (let i = 0; i < children.length; i++) {
      this.appendChild(children[i]);
    }
  }
});

const apps = {
  Counter: CounterElm.Counter,
  LiveCounter: LiveCounterElm.LiveCounter,
  Wrapper: WrapperElm.Wrapper,
}

function mountElmComponent (appName, element, flags) {
  const elmApp = apps[appName];

  if (!elmApp) {
    throw new Error(`Unknown app: ${appName}`);
  }

  const app = elmApp.init({
    node: element,
    flags
  });

  return app;
}

function getFlags (element, slotFlags) {
  const flags = {};

  for (let i = 0; i < element.attributes.length; i++) {
    const attribute = element.attributes[i];
    if (attribute.name.startsWith("elm-flag:")) {
      const flagAttributeName = attribute.name.substring("elm-flag:".length);
      let value

      try {
        value = JSON.parse(attribute.value)
      } catch (e) {
        throw new Error(`Invalid flag value: ${attribute.value}`)
      }
      
      const flagName = toCamelCase(flagAttributeName);

      flags[flagName] = value;
    }
  }

  return {...flags,...(slotFlags || {})};
}

function toCamelCase(str) {
  return str.toLowerCase().replace(/([-_][a-z])/g, group =>
    group
      .toUpperCase()
      .replace('-', '')
      .replace('_', '')
  );
}

const handlePorts = (element, app, context) => {
  // Implement ports. How?
  for (let i = 0; i < element.attributes.length; i++) {
    const attribute = element.attributes[i];
    if (attribute.name.startsWith("elm-on:")) {
      const snakeEventName = attribute.name.substring("elm-on:".length);
      const eventName = toCamelCase(snakeEventName);
      const event = attribute.value;

      app.ports[eventName].subscribe(message => {
        if (event.startsWith("[")) {
          context.liveSocket.execJS(element, event);
        } else {
          context.pushEventTo(element, event, {value: message});
        }
      });
    } else if (attribute.name.startsWith("elm-handle-event")) {
      const eventName = attribute.value;
      const portName = toCamelCase(`on-${eventName}`)
      
      if (!app.ports || !app.ports[portName]) {
        throw new Error(`Unable to handle '${eventName}' because no port named ${portName}`);
      }

      context.handleEvent(eventName, (message) => {
        if (message || message.value) {
          app.ports[portName].send(message.value);
        } else {
          app.ports[portName].send();
        }
      })
    }
  }
  // From Elm to Server:
  //    this.liveSocket.execJS can execute js from the handler;
  // And how to receive events from LiveView?
  //    by attributes update:
  //      in hooks: onBeforeElUpdated
  //      elm:handle-update="port name"
  //    Phoenix.LiveView.push_event/3
  //      this.handleEvent:
  //      elm:handle-event:port-name="handle-server-pushed-event"
  //    and we can set ports in javascript by exposing the app globally, allowing to customize javascript call;
  //      window.elmApps = { Main: app }
  //      elm-expose-app="Main"
  //    or another idea:
  //      elm:on-mount="event"
  //      window.addEventListener("event", (app) => app.ports.update.send("something"))
  // So, it will have an port called update, and every time an attribute is updated, it calls the port name;
  // https://hexdocs.pm/phoenix_live_view/Phoenix.LiveView.JS.html#module-client-utility-commands
  // https://hexdocs.pm/phoenix_live_view/js-interop.html
}

function backupSlots(id, el) {
  const children = el.lastElementChild.children;

  this.liveElm.slots[id] = { default: children };

  return {
    appId: id,
    slotId: "default"
  }
}

// TODO: Make this configurable, making it able to setup the apps from main Javascript;
export default {
  mounted() {
    // Setup liveElm in window
    if (!window.liveElm) {
      window.liveElm = {
        slots: {}
      }
    }

    // Prepare the app
    const elmEl = this.el.firstElementChild;

    const appName = this.el.attributes.getNamedItem("elm-app")?.value;
    const slotFlags = backupSlots(this.el.id, this.el);
    const flags = getFlags(this.el, slotFlags);

    // Mount the app
    const app = mountElmComponent(appName, elmEl, flags);
    const mountedAppEl = this.el.firstElementChild

    // Copy all attributes from elmEl to mountedAppEl
    for (let i = 0; i < elmEl.attributes.length; i++) {
      const attr = elmEl.attributes[i];
      mountedAppEl.setAttribute(attr.name, attr.value);
    }

    // Dispatch an event when the app is mounted
    const onMountEvent = this.el.attributes.getNamedItem("elm-on-mount")?.value;
    if (onMountEvent) {
      window.dispatchEvent(new CustomEvent("elm:" + onMountEvent, { detail: { 
        ports: app.ports,
        liveSocket: this.liveSocket,
        el: this.el
    } }));
    }

    // Handle ports
    handlePorts(this.el, app, this);
  },
  beforeUpdate() {
    if (!window.liveElm.updates) {
      window.liveElm.updates = {};
    }
    const slotsEl = this.el.lastElementChild;

    window.liveElm.updates[this.el.id] = slotsEl.innerHTML;
  },
  updated() {
    let elmEl = this.el.firstElementChild;
    if (elmEl.innerHTML == "") {
      const appName = this.el.attributes.getNamedItem("elm-app")?.value;
      const slotFlags = backupSlots(this.el.id, this.el);
      const flags = getFlags(this.el, slotFlags);

      const app = mountElmComponent(appName, elmEl, flags);
      const mountedAppEl = this.el.firstElementChild;

      // Copy all attributes from elmEl to mountedAppEl
      for (let i = 0; i < elmEl.attributes.length; i++) {
        const attr = elmEl.attributes[i];
        mountedAppEl.setAttribute(attr.name, attr.value);
      }

      const onMountEvent = this.el.attributes.getNamedItem("elm-on-mount")?.value;
      if (onMountEvent) {
        window.dispatchEvent(new CustomEvent("elm:" + onMountEvent, { detail: { 
          ports: app.ports,
          liveSocket: this.liveSocket,
          el: this.el
      } }));
      }

      // Handle ports
      handlePorts(this.el, app, this);
    }
    
    
    // TODO: Cleanup the slot logic (1 slot is enough);
    const id = this.el.id;
    const elmSlots = elmEl.getElementsByTagName('elm-slot')

    for (let i = 0; i < elmSlots.length; i++) {
      const slotId = elmSlots[i].getAttribute("slot");
      const children = window.liveElm.slots[id]?.[slotId] || [];
      elmSlots[i].innerHTML = children[0].innerHTML;
      elmSlots[i].innerHTML = "";
      for (let j = 0; j < children.length; j++) {
        elmSlots[i].appendChild(children[j]);
      }
    }
    window.liveElm.updates[id] = null;
    
  },
  destroyed() {
    const id = this.el.id
    window.liveElm.updates[id] = null
    window.liveElm.slots[id] = null
  }
}
