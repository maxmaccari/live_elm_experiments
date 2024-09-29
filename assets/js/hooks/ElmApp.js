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
      let snakeCaseFlagName;
      let value;

      if (flagAttributeName.startsWith("int:")) {
        snakeCaseFlagName = flagAttributeName.substring("int:".length);
        value = parseInt(attribute.value);
      } else if (flagAttributeName.startsWith("bool:")) {
        snakeCaseFlagName = flagAttributeName.substring("bool:".length);
        value = attribute.value === "true";
      } else if (flagAttributeName.startsWith("float:")) {
        snakeCaseFlagName = flagAttributeName.substring("float:".length);
        value = parseFloat(attribute.value);
      } else if (flagAttributeName.startsWith("string:")) {
        snakeCaseFlagName = flagAttributeName.substring("string:".length);
        value = attribute.value;
      } else if (flagAttributeName.startsWith("json:")) {
        snakeCaseFlagName = flagAttributeName.substring("json:".length);
        value = JSON.parse(attribute.value);
      }  else {
        snakeCaseFlagName = flagAttributeName;
        value = attribute.value;
      }
      const flagName = toCamelCase(snakeCaseFlagName);

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

function backupSlots(el) {
  const id = el.id;
  const children = el.children;

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
    const elmEl = this.el;

    const appName = elmEl.attributes.getNamedItem("elm-app")?.value;
    const slotFlags = backupSlots(elmEl);
    const flags = getFlags(elmEl, slotFlags);

    // Mount the app
    const app = mountElmComponent(appName, elmEl, flags);

    // Dispatch an event when the app is mounted
    const onMountEvent = elmEl.attributes.getNamedItem("elm-on-mount")?.value;
    if (onMountEvent) {
      window.dispatchEvent(new CustomEvent("elm:" + onMountEvent, { detail: { 
        ports: app.ports,
        liveSocket: this.liveSocket,
        el: this.el
    } }));
    }

    // Handle ports
    handlePorts(elmEl, app, this);
  },
  beforeUpdate() {
    debugger
  },
  updated() {
    debugger
  },
  destroyed() {
    debugger
  }
}
