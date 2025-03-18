
function getContext() {
  if (!window.liveElm) {
    window.liveElm = {
      slots: {},
      updates: {},
      apps: {},
    }
  }

  return window.liveElm
}

function registerElm(appName, elmApp) {
  getContext().apps[appName] = elmApp;
}

if (!customElements.get("elm-slot")) {
  customElements.define("elm-slot", class extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      const slotId = this.getAttribute("slot") || "default";
      const appId = this.getAttribute("app");

      const children = getContext().slots[appId]?.[slotId] || [];

      for (let i = 0; i < children.length; i++) {
        this.appendChild(children[i]);
      }
    }
  });
}

function mountElmComponent(elmApp, element, flags) {
  const app = elmApp.init({
    node: element,
    flags
  });

  return app;
}

function getFlags(element, slotFlags) {
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

  return { ...flags, ...(slotFlags || {}) };
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
          context.pushEventTo(element, event, { value: message });
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
}

function backupSlots(id, el) {
  const children = el.lastElementChild.children;

  getContext().slots[id] = { default: children };

  return {
    appId: id,
    slotId: "default"
  }
}

function initElm(context, preconfiguredApps) {
  // Prepare the app
  const appName = context.el.attributes.getNamedItem("elm-app")?.value;
  const slotFlags = backupSlots(context.el.id, context.el);
  const flags = getFlags(context.el, slotFlags);

  // Merge the apps with types defined in window
  let apps = {}
  if (preconfiguredApps) {
    apps = { ...preconfiguredApps }
  }
  if (getContext().apps) {
    apps = { ...apps, ...getContext().apps }
  }

  // Mount the app in the first child of the main element
  const elmEl = context.el.firstElementChild;
  const elmApp = apps[appName];
  if (!elmApp) {
    throw new Error(`Unknown app: ${appName}`);
  }

  const app = mountElmComponent(elmApp, elmEl, flags);
  const mountedAppEl = context.el.firstElementChild

  // Copy all attributes from elmEl to mountedAppEl
  for (let i = 0; i < elmEl.attributes.length; i++) {
    const attr = elmEl.attributes[i];
    mountedAppEl.setAttribute(attr.name, attr.value);
  }

  // Dispatch an event when the app is mounted
  const onMountEvent = context.el.attributes.getNamedItem("elm-on-mount")?.value;
  if (onMountEvent) {
    window.dispatchEvent(new CustomEvent("elm:" + onMountEvent, {
      detail: {
        ports: app.ports,
        liveSocket: this.liveSocket,
        el: context.el
      }
    }));
  }

  // Handle ports
  handlePorts(context.el, app, context);
}

function makeElmApp(apps) {
  return {
    mounted() {
      initElm(this, apps)
    },
    beforeUpdate() {
      const slotsEl = this.el.lastElementChild;

      getContext().updates[this.el.id] = slotsEl.innerHTML;
    },
    updated() {
      let elmEl = this.el.firstElementChild;
      if (elmEl.innerHTML == "") {
        initElm(this, apps)
      }

      const id = this.el.id;
      const elmSlots = elmEl.getElementsByTagName('elm-slot')

      for (let i = 0; i < elmSlots.length; i++) {
        const slotId = elmSlots[i].getAttribute("slot");
        const children = getContext().slots[id]?.[slotId] || [];
        elmSlots[i].innerHTML = children[0].innerHTML;
        elmSlots[i].innerHTML = "";
        for (let j = 0; j < children.length; j++) {
          elmSlots[i].appendChild(children[j]);
        }
      }
      getContext().updates[id] = null;

    },
    destroyed() {
      const id = this.el.id
      getContext().updates[id] = null
      getContext().slots[id] = null
    }
  }
}

export {
  makeElmApp,
  registerElm
}