var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/tui/entry.ts
import { render } from "@opentui/solid";

// src/tui/app.tsx
import { effect as _$effect13 } from "@opentui/solid";
import { insert as _$insert15 } from "@opentui/solid";
import { setProp as _$setProp15 } from "@opentui/solid";
import { createElement as _$createElement15 } from "@opentui/solid";
import { createComponent as _$createComponent23 } from "@opentui/solid";

// node_modules/solid-js/dist/solid.js
var sharedConfig = {
  context: void 0,
  registry: void 0,
  effects: void 0,
  done: false,
  getContextId() {
    return getContextId(this.context.count);
  },
  getNextContextId() {
    return getContextId(this.context.count++);
  }
};
function getContextId(count) {
  const num = String(count), len = num.length - 1;
  return sharedConfig.context.id + (len ? String.fromCharCode(96 + len) : "") + num;
}
__name(getContextId, "getContextId");
function setHydrateContext(context) {
  sharedConfig.context = context;
}
__name(setHydrateContext, "setHydrateContext");
var IS_DEV = false;
var equalFn = /* @__PURE__ */ __name((a, b) => a === b, "equalFn");
var $PROXY = /* @__PURE__ */ Symbol("solid-proxy");
var $TRACK = /* @__PURE__ */ Symbol("solid-track");
var signalOptions = {
  equals: equalFn
};
var ERROR = null;
var runEffects = runQueue;
var STALE = 1;
var PENDING = 2;
var UNOWNED = {
  owned: null,
  cleanups: null,
  context: null,
  owner: null
};
var Owner = null;
var Transition = null;
var Scheduler = null;
var ExternalSourceConfig = null;
var Listener = null;
var Updates = null;
var Effects = null;
var ExecCount = 0;
function createRoot(fn, detachedOwner) {
  const listener = Listener, owner = Owner, unowned = fn.length === 0, current = detachedOwner === void 0 ? owner : detachedOwner, root = unowned ? UNOWNED : {
    owned: null,
    cleanups: null,
    context: current ? current.context : null,
    owner: current
  }, updateFn = unowned ? fn : () => fn(() => untrack(() => cleanNode(root)));
  Owner = root;
  Listener = null;
  try {
    return runUpdates(updateFn, true);
  } finally {
    Listener = listener;
    Owner = owner;
  }
}
__name(createRoot, "createRoot");
function createSignal(value, options) {
  options = options ? Object.assign({}, signalOptions, options) : signalOptions;
  const s = {
    value,
    observers: null,
    observerSlots: null,
    comparator: options.equals || void 0
  };
  const setter = /* @__PURE__ */ __name((value2) => {
    if (typeof value2 === "function") {
      if (Transition && Transition.running && Transition.sources.has(s)) value2 = value2(s.tValue);
      else value2 = value2(s.value);
    }
    return writeSignal(s, value2);
  }, "setter");
  return [readSignal.bind(s), setter];
}
__name(createSignal, "createSignal");
function createRenderEffect(fn, value, options) {
  const c = createComputation(fn, value, false, STALE);
  if (Scheduler && Transition && Transition.running) Updates.push(c);
  else updateComputation(c);
}
__name(createRenderEffect, "createRenderEffect");
function createEffect(fn, value, options) {
  runEffects = runUserEffects;
  const c = createComputation(fn, value, false, STALE), s = SuspenseContext && useContext(SuspenseContext);
  if (s) c.suspense = s;
  if (!options || !options.render) c.user = true;
  Effects ? Effects.push(c) : updateComputation(c);
}
__name(createEffect, "createEffect");
function createMemo(fn, value, options) {
  options = options ? Object.assign({}, signalOptions, options) : signalOptions;
  const c = createComputation(fn, value, true, 0);
  c.observers = null;
  c.observerSlots = null;
  c.comparator = options.equals || void 0;
  if (Scheduler && Transition && Transition.running) {
    c.tState = STALE;
    Updates.push(c);
  } else updateComputation(c);
  return readSignal.bind(c);
}
__name(createMemo, "createMemo");
function batch(fn) {
  return runUpdates(fn, false);
}
__name(batch, "batch");
function untrack(fn) {
  if (!ExternalSourceConfig && Listener === null) return fn();
  const listener = Listener;
  Listener = null;
  try {
    if (ExternalSourceConfig) return ExternalSourceConfig.untrack(fn);
    return fn();
  } finally {
    Listener = listener;
  }
}
__name(untrack, "untrack");
function onMount(fn) {
  createEffect(() => untrack(fn));
}
__name(onMount, "onMount");
function onCleanup(fn) {
  if (Owner === null) ;
  else if (Owner.cleanups === null) Owner.cleanups = [fn];
  else Owner.cleanups.push(fn);
  return fn;
}
__name(onCleanup, "onCleanup");
function getListener() {
  return Listener;
}
__name(getListener, "getListener");
function startTransition(fn) {
  if (Transition && Transition.running) {
    fn();
    return Transition.done;
  }
  const l = Listener;
  const o = Owner;
  return Promise.resolve().then(() => {
    Listener = l;
    Owner = o;
    let t;
    if (Scheduler || SuspenseContext) {
      t = Transition || (Transition = {
        sources: /* @__PURE__ */ new Set(),
        effects: [],
        promises: /* @__PURE__ */ new Set(),
        disposed: /* @__PURE__ */ new Set(),
        queue: /* @__PURE__ */ new Set(),
        running: true
      });
      t.done || (t.done = new Promise((res) => t.resolve = res));
      t.running = true;
    }
    runUpdates(fn, false);
    Listener = Owner = null;
    return t ? t.done : void 0;
  });
}
__name(startTransition, "startTransition");
var [transPending, setTransPending] = /* @__PURE__ */ createSignal(false);
function createContext(defaultValue, options) {
  const id = /* @__PURE__ */ Symbol("context");
  return {
    id,
    Provider: createProvider(id),
    defaultValue
  };
}
__name(createContext, "createContext");
function useContext(context) {
  let value;
  return Owner && Owner.context && (value = Owner.context[context.id]) !== void 0 ? value : context.defaultValue;
}
__name(useContext, "useContext");
function children(fn) {
  const children2 = createMemo(fn);
  const memo = createMemo(() => resolveChildren(children2()));
  memo.toArray = () => {
    const c = memo();
    return Array.isArray(c) ? c : c != null ? [c] : [];
  };
  return memo;
}
__name(children, "children");
var SuspenseContext;
function readSignal() {
  const runningTransition = Transition && Transition.running;
  if (this.sources && (runningTransition ? this.tState : this.state)) {
    if ((runningTransition ? this.tState : this.state) === STALE) updateComputation(this);
    else {
      const updates = Updates;
      Updates = null;
      runUpdates(() => lookUpstream(this), false);
      Updates = updates;
    }
  }
  if (Listener) {
    const sSlot = this.observers ? this.observers.length : 0;
    if (!Listener.sources) {
      Listener.sources = [this];
      Listener.sourceSlots = [sSlot];
    } else {
      Listener.sources.push(this);
      Listener.sourceSlots.push(sSlot);
    }
    if (!this.observers) {
      this.observers = [Listener];
      this.observerSlots = [Listener.sources.length - 1];
    } else {
      this.observers.push(Listener);
      this.observerSlots.push(Listener.sources.length - 1);
    }
  }
  if (runningTransition && Transition.sources.has(this)) return this.tValue;
  return this.value;
}
__name(readSignal, "readSignal");
function writeSignal(node, value, isComp) {
  let current = Transition && Transition.running && Transition.sources.has(node) ? node.tValue : node.value;
  if (!node.comparator || !node.comparator(current, value)) {
    if (Transition) {
      const TransitionRunning = Transition.running;
      if (TransitionRunning || !isComp && Transition.sources.has(node)) {
        Transition.sources.add(node);
        node.tValue = value;
      }
      if (!TransitionRunning) node.value = value;
    } else node.value = value;
    if (node.observers && node.observers.length) {
      runUpdates(() => {
        for (let i = 0; i < node.observers.length; i += 1) {
          const o = node.observers[i];
          const TransitionRunning = Transition && Transition.running;
          if (TransitionRunning && Transition.disposed.has(o)) continue;
          if (TransitionRunning ? !o.tState : !o.state) {
            if (o.pure) Updates.push(o);
            else Effects.push(o);
            if (o.observers) markDownstream(o);
          }
          if (!TransitionRunning) o.state = STALE;
          else o.tState = STALE;
        }
        if (Updates.length > 1e6) {
          Updates = [];
          if (IS_DEV) ;
          throw new Error();
        }
      }, false);
    }
  }
  return value;
}
__name(writeSignal, "writeSignal");
function updateComputation(node) {
  if (!node.fn) return;
  cleanNode(node);
  const time = ExecCount;
  runComputation(node, Transition && Transition.running && Transition.sources.has(node) ? node.tValue : node.value, time);
  if (Transition && !Transition.running && Transition.sources.has(node)) {
    queueMicrotask(() => {
      runUpdates(() => {
        Transition && (Transition.running = true);
        Listener = Owner = node;
        runComputation(node, node.tValue, time);
        Listener = Owner = null;
      }, false);
    });
  }
}
__name(updateComputation, "updateComputation");
function runComputation(node, value, time) {
  let nextValue;
  const owner = Owner, listener = Listener;
  Listener = Owner = node;
  try {
    nextValue = node.fn(value);
  } catch (err) {
    if (node.pure) {
      if (Transition && Transition.running) {
        node.tState = STALE;
        node.tOwned && node.tOwned.forEach(cleanNode);
        node.tOwned = void 0;
      } else {
        node.state = STALE;
        node.owned && node.owned.forEach(cleanNode);
        node.owned = null;
      }
    }
    node.updatedAt = time + 1;
    return handleError(err);
  } finally {
    Listener = listener;
    Owner = owner;
  }
  if (!node.updatedAt || node.updatedAt <= time) {
    if (node.updatedAt != null && "observers" in node) {
      writeSignal(node, nextValue, true);
    } else if (Transition && Transition.running && node.pure) {
      Transition.sources.add(node);
      node.tValue = nextValue;
    } else node.value = nextValue;
    node.updatedAt = time;
  }
}
__name(runComputation, "runComputation");
function createComputation(fn, init, pure, state = STALE, options) {
  const c = {
    fn,
    state,
    updatedAt: null,
    owned: null,
    sources: null,
    sourceSlots: null,
    cleanups: null,
    value: init,
    owner: Owner,
    context: Owner ? Owner.context : null,
    pure
  };
  if (Transition && Transition.running) {
    c.state = 0;
    c.tState = state;
  }
  if (Owner === null) ;
  else if (Owner !== UNOWNED) {
    if (Transition && Transition.running && Owner.pure) {
      if (!Owner.tOwned) Owner.tOwned = [c];
      else Owner.tOwned.push(c);
    } else {
      if (!Owner.owned) Owner.owned = [c];
      else Owner.owned.push(c);
    }
  }
  if (ExternalSourceConfig && c.fn) {
    const [track, trigger] = createSignal(void 0, {
      equals: false
    });
    const ordinary = ExternalSourceConfig.factory(c.fn, trigger);
    onCleanup(() => ordinary.dispose());
    const triggerInTransition = /* @__PURE__ */ __name(() => startTransition(trigger).then(() => inTransition.dispose()), "triggerInTransition");
    const inTransition = ExternalSourceConfig.factory(c.fn, triggerInTransition);
    c.fn = (x) => {
      track();
      return Transition && Transition.running ? inTransition.track(x) : ordinary.track(x);
    };
  }
  return c;
}
__name(createComputation, "createComputation");
function runTop(node) {
  const runningTransition = Transition && Transition.running;
  if ((runningTransition ? node.tState : node.state) === 0) return;
  if ((runningTransition ? node.tState : node.state) === PENDING) return lookUpstream(node);
  if (node.suspense && untrack(node.suspense.inFallback)) return node.suspense.effects.push(node);
  const ancestors = [node];
  while ((node = node.owner) && (!node.updatedAt || node.updatedAt < ExecCount)) {
    if (runningTransition && Transition.disposed.has(node)) return;
    if (runningTransition ? node.tState : node.state) ancestors.push(node);
  }
  for (let i = ancestors.length - 1; i >= 0; i--) {
    node = ancestors[i];
    if (runningTransition) {
      let top = node, prev = ancestors[i + 1];
      while ((top = top.owner) && top !== prev) {
        if (Transition.disposed.has(top)) return;
      }
    }
    if ((runningTransition ? node.tState : node.state) === STALE) {
      updateComputation(node);
    } else if ((runningTransition ? node.tState : node.state) === PENDING) {
      const updates = Updates;
      Updates = null;
      runUpdates(() => lookUpstream(node, ancestors[0]), false);
      Updates = updates;
    }
  }
}
__name(runTop, "runTop");
function runUpdates(fn, init) {
  if (Updates) return fn();
  let wait = false;
  if (!init) Updates = [];
  if (Effects) wait = true;
  else Effects = [];
  ExecCount++;
  try {
    const res = fn();
    completeUpdates(wait);
    return res;
  } catch (err) {
    if (!wait) Effects = null;
    Updates = null;
    handleError(err);
  }
}
__name(runUpdates, "runUpdates");
function completeUpdates(wait) {
  if (Updates) {
    if (Scheduler && Transition && Transition.running) scheduleQueue(Updates);
    else runQueue(Updates);
    Updates = null;
  }
  if (wait) return;
  let res;
  if (Transition) {
    if (!Transition.promises.size && !Transition.queue.size) {
      const sources = Transition.sources;
      const disposed = Transition.disposed;
      Effects.push.apply(Effects, Transition.effects);
      res = Transition.resolve;
      for (const e2 of Effects) {
        "tState" in e2 && (e2.state = e2.tState);
        delete e2.tState;
      }
      Transition = null;
      runUpdates(() => {
        for (const d of disposed) cleanNode(d);
        for (const v of sources) {
          v.value = v.tValue;
          if (v.owned) {
            for (let i = 0, len = v.owned.length; i < len; i++) cleanNode(v.owned[i]);
          }
          if (v.tOwned) v.owned = v.tOwned;
          delete v.tValue;
          delete v.tOwned;
          v.tState = 0;
        }
        setTransPending(false);
      }, false);
    } else if (Transition.running) {
      Transition.running = false;
      Transition.effects.push.apply(Transition.effects, Effects);
      Effects = null;
      setTransPending(true);
      return;
    }
  }
  const e = Effects;
  Effects = null;
  if (e.length) runUpdates(() => runEffects(e), false);
  if (res) res();
}
__name(completeUpdates, "completeUpdates");
function runQueue(queue) {
  for (let i = 0; i < queue.length; i++) runTop(queue[i]);
}
__name(runQueue, "runQueue");
function scheduleQueue(queue) {
  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    const tasks = Transition.queue;
    if (!tasks.has(item)) {
      tasks.add(item);
      Scheduler(() => {
        tasks.delete(item);
        runUpdates(() => {
          Transition.running = true;
          runTop(item);
        }, false);
        Transition && (Transition.running = false);
      });
    }
  }
}
__name(scheduleQueue, "scheduleQueue");
function runUserEffects(queue) {
  let i, userLength = 0;
  for (i = 0; i < queue.length; i++) {
    const e = queue[i];
    if (!e.user) runTop(e);
    else queue[userLength++] = e;
  }
  if (sharedConfig.context) {
    if (sharedConfig.count) {
      sharedConfig.effects || (sharedConfig.effects = []);
      sharedConfig.effects.push(...queue.slice(0, userLength));
      return;
    }
    setHydrateContext();
  }
  if (sharedConfig.effects && (sharedConfig.done || !sharedConfig.count)) {
    queue = [...sharedConfig.effects, ...queue];
    userLength += sharedConfig.effects.length;
    delete sharedConfig.effects;
  }
  for (i = 0; i < userLength; i++) runTop(queue[i]);
}
__name(runUserEffects, "runUserEffects");
function lookUpstream(node, ignore) {
  const runningTransition = Transition && Transition.running;
  if (runningTransition) node.tState = 0;
  else node.state = 0;
  for (let i = 0; i < node.sources.length; i += 1) {
    const source = node.sources[i];
    if (source.sources) {
      const state = runningTransition ? source.tState : source.state;
      if (state === STALE) {
        if (source !== ignore && (!source.updatedAt || source.updatedAt < ExecCount)) runTop(source);
      } else if (state === PENDING) lookUpstream(source, ignore);
    }
  }
}
__name(lookUpstream, "lookUpstream");
function markDownstream(node) {
  const runningTransition = Transition && Transition.running;
  for (let i = 0; i < node.observers.length; i += 1) {
    const o = node.observers[i];
    if (runningTransition ? !o.tState : !o.state) {
      if (runningTransition) o.tState = PENDING;
      else o.state = PENDING;
      if (o.pure) Updates.push(o);
      else Effects.push(o);
      o.observers && markDownstream(o);
    }
  }
}
__name(markDownstream, "markDownstream");
function cleanNode(node) {
  let i;
  if (node.sources) {
    while (node.sources.length) {
      const source = node.sources.pop(), index = node.sourceSlots.pop(), obs = source.observers;
      if (obs && obs.length) {
        const n = obs.pop(), s = source.observerSlots.pop();
        if (index < obs.length) {
          n.sourceSlots[s] = index;
          obs[index] = n;
          source.observerSlots[index] = s;
        }
      }
    }
  }
  if (node.tOwned) {
    for (i = node.tOwned.length - 1; i >= 0; i--) cleanNode(node.tOwned[i]);
    delete node.tOwned;
  }
  if (Transition && Transition.running && node.pure) {
    reset(node, true);
  } else if (node.owned) {
    for (i = node.owned.length - 1; i >= 0; i--) cleanNode(node.owned[i]);
    node.owned = null;
  }
  if (node.cleanups) {
    for (i = node.cleanups.length - 1; i >= 0; i--) node.cleanups[i]();
    node.cleanups = null;
  }
  if (Transition && Transition.running) node.tState = 0;
  else node.state = 0;
}
__name(cleanNode, "cleanNode");
function reset(node, top) {
  if (!top) {
    node.tState = 0;
    Transition.disposed.add(node);
  }
  if (node.owned) {
    for (let i = 0; i < node.owned.length; i++) reset(node.owned[i]);
  }
}
__name(reset, "reset");
function castError(err) {
  if (err instanceof Error) return err;
  return new Error(typeof err === "string" ? err : "Unknown error", {
    cause: err
  });
}
__name(castError, "castError");
function runErrors(err, fns, owner) {
  try {
    for (const f of fns) f(err);
  } catch (e) {
    handleError(e, owner && owner.owner || null);
  }
}
__name(runErrors, "runErrors");
function handleError(err, owner = Owner) {
  const fns = ERROR && owner && owner.context && owner.context[ERROR];
  const error = castError(err);
  if (!fns) throw error;
  if (Effects) Effects.push({
    fn() {
      runErrors(error, fns, owner);
    },
    state: STALE
  });
  else runErrors(error, fns, owner);
}
__name(handleError, "handleError");
function resolveChildren(children2) {
  if (typeof children2 === "function" && !children2.length) return resolveChildren(children2());
  if (Array.isArray(children2)) {
    const results = [];
    for (let i = 0; i < children2.length; i++) {
      const result = resolveChildren(children2[i]);
      Array.isArray(result) ? results.push.apply(results, result) : results.push(result);
    }
    return results;
  }
  return children2;
}
__name(resolveChildren, "resolveChildren");
function createProvider(id, options) {
  return /* @__PURE__ */ __name(function provider(props) {
    let res;
    createRenderEffect(() => res = untrack(() => {
      Owner.context = {
        ...Owner.context,
        [id]: props.value
      };
      return children(() => props.children);
    }), void 0);
    return res;
  }, "provider");
}
__name(createProvider, "createProvider");
var FALLBACK = /* @__PURE__ */ Symbol("fallback");
function dispose(d) {
  for (let i = 0; i < d.length; i++) d[i]();
}
__name(dispose, "dispose");
function mapArray(list, mapFn, options = {}) {
  let items = [], mapped = [], disposers = [], len = 0, indexes = mapFn.length > 1 ? [] : null;
  onCleanup(() => dispose(disposers));
  return () => {
    let newItems = list() || [], newLen = newItems.length, i, j;
    newItems[$TRACK];
    return untrack(() => {
      let newIndices, newIndicesNext, temp, tempdisposers, tempIndexes, start, end, newEnd, item;
      if (newLen === 0) {
        if (len !== 0) {
          dispose(disposers);
          disposers = [];
          items = [];
          mapped = [];
          len = 0;
          indexes && (indexes = []);
        }
        if (options.fallback) {
          items = [FALLBACK];
          mapped[0] = createRoot((disposer) => {
            disposers[0] = disposer;
            return options.fallback();
          });
          len = 1;
        }
      } else if (len === 0) {
        mapped = new Array(newLen);
        for (j = 0; j < newLen; j++) {
          items[j] = newItems[j];
          mapped[j] = createRoot(mapper);
        }
        len = newLen;
      } else {
        temp = new Array(newLen);
        tempdisposers = new Array(newLen);
        indexes && (tempIndexes = new Array(newLen));
        for (start = 0, end = Math.min(len, newLen); start < end && items[start] === newItems[start]; start++) ;
        for (end = len - 1, newEnd = newLen - 1; end >= start && newEnd >= start && items[end] === newItems[newEnd]; end--, newEnd--) {
          temp[newEnd] = mapped[end];
          tempdisposers[newEnd] = disposers[end];
          indexes && (tempIndexes[newEnd] = indexes[end]);
        }
        newIndices = /* @__PURE__ */ new Map();
        newIndicesNext = new Array(newEnd + 1);
        for (j = newEnd; j >= start; j--) {
          item = newItems[j];
          i = newIndices.get(item);
          newIndicesNext[j] = i === void 0 ? -1 : i;
          newIndices.set(item, j);
        }
        for (i = start; i <= end; i++) {
          item = items[i];
          j = newIndices.get(item);
          if (j !== void 0 && j !== -1) {
            temp[j] = mapped[i];
            tempdisposers[j] = disposers[i];
            indexes && (tempIndexes[j] = indexes[i]);
            j = newIndicesNext[j];
            newIndices.set(item, j);
          } else disposers[i]();
        }
        for (j = start; j < newLen; j++) {
          if (j in temp) {
            mapped[j] = temp[j];
            disposers[j] = tempdisposers[j];
            if (indexes) {
              indexes[j] = tempIndexes[j];
              indexes[j](j);
            }
          } else mapped[j] = createRoot(mapper);
        }
        mapped = mapped.slice(0, len = newLen);
        items = newItems.slice(0);
      }
      return mapped;
    });
    function mapper(disposer) {
      disposers[j] = disposer;
      if (indexes) {
        const [s, set] = createSignal(j);
        indexes[j] = set;
        return mapFn(newItems[j], s);
      }
      return mapFn(newItems[j]);
    }
    __name(mapper, "mapper");
  };
}
__name(mapArray, "mapArray");
var narrowedError = /* @__PURE__ */ __name((name) => `Stale read from <${name}>.`, "narrowedError");
function For(props) {
  const fallback = "fallback" in props && {
    fallback: /* @__PURE__ */ __name(() => props.fallback, "fallback")
  };
  return createMemo(mapArray(() => props.each, props.children, fallback || void 0));
}
__name(For, "For");
function Show(props) {
  const keyed = props.keyed;
  const conditionValue = createMemo(() => props.when, void 0, void 0);
  const condition = keyed ? conditionValue : createMemo(conditionValue, void 0, {
    equals: /* @__PURE__ */ __name((a, b) => !a === !b, "equals")
  });
  return createMemo(() => {
    const c = condition();
    if (c) {
      const child = props.children;
      const fn = typeof child === "function" && child.length > 0;
      return fn ? untrack(() => child(keyed ? c : () => {
        if (!untrack(condition)) throw narrowedError("Show");
        return conditionValue();
      })) : child;
    }
    return props.fallback;
  }, void 0, void 0);
}
__name(Show, "Show");
function Switch(props) {
  const chs = children(() => props.children);
  const switchFunc = createMemo(() => {
    const ch = chs();
    const mps = Array.isArray(ch) ? ch : [ch];
    let func = /* @__PURE__ */ __name(() => void 0, "func");
    for (let i = 0; i < mps.length; i++) {
      const index = i;
      const mp = mps[i];
      const prevFunc = func;
      const conditionValue = createMemo(() => prevFunc() ? void 0 : mp.when, void 0, void 0);
      const condition = mp.keyed ? conditionValue : createMemo(conditionValue, void 0, {
        equals: /* @__PURE__ */ __name((a, b) => !a === !b, "equals")
      });
      func = /* @__PURE__ */ __name(() => prevFunc() || (condition() ? [index, conditionValue, mp] : void 0), "func");
    }
    return func;
  });
  return createMemo(() => {
    const sel = switchFunc()();
    if (!sel) return props.fallback;
    const [index, conditionValue, mp] = sel;
    const child = mp.children;
    const fn = typeof child === "function" && child.length > 0;
    return fn ? untrack(() => child(mp.keyed ? conditionValue() : () => {
      if (untrack(switchFunc)()?.[0] !== index) throw narrowedError("Match");
      return conditionValue();
    })) : child;
  }, void 0, void 0);
}
__name(Switch, "Switch");
function Match(props) {
  return props;
}
__name(Match, "Match");

// src/tui/app.tsx
import { useTerminalDimensions, useRenderer as useRenderer2 } from "@opentui/solid";

// src/tui/context/exit.tsx
import { createComponent as _$createComponent } from "@opentui/solid";
import { useRenderer } from "@opentui/solid";
var ExitContext = createContext();
function ExitProvider(props) {
  const [isExiting, setIsExiting] = createSignal(false);
  const renderer = useRenderer();
  const exit = /* @__PURE__ */ __name((code = 0) => {
    if (isExiting()) return;
    setIsExiting(true);
    renderer.destroy();
    props.onExit?.();
    process.exit(code);
  }, "exit");
  return _$createComponent(ExitContext.Provider, {
    value: {
      exit,
      isExiting
    },
    get children() {
      return props.children;
    }
  });
}
__name(ExitProvider, "ExitProvider");
function useExit() {
  const context = useContext(ExitContext);
  if (!context) {
    throw new Error("useExit must be used within ExitProvider");
  }
  return context;
}
__name(useExit, "useExit");

// src/tui/context/theme.tsx
import { createComponent as _$createComponent2 } from "@opentui/solid";
var darkTheme = {
  name: "default-dark",
  mode: "dark",
  colors: {
    primary: "#5FAFFF",
    accent: "#87AFFF",
    background: "#1a1a1a",
    foreground: "#ffffff",
    muted: "#808080",
    border: "#404040",
    success: "#00FF00",
    warning: "#FFFF00",
    error: "#FF0000",
    info: "#00FFFF"
  },
  icons: {
    success: "\u2713",
    error: "\u2717",
    warning: "!",
    info: "i",
    pending: "\u25CB",
    active: "\u25CF",
    completed: "\u25CF",
    arrow: "\u2192",
    bullet: "\xB7",
    pipe: "\u2502",
    command: "/",
    file: "@",
    shell: "$"
  }
};
var lightTheme = {
  ...darkTheme,
  name: "default-light",
  mode: "light",
  colors: {
    ...darkTheme.colors,
    background: "#ffffff",
    foreground: "#1a1a1a",
    muted: "#606060",
    border: "#d0d0d0"
  }
};
var ThemeContext = createContext();
function ThemeProvider(props) {
  const [isDark, setIsDark] = createSignal(props.isDarkMode);
  const [theme, setThemeState] = createSignal(props.isDarkMode ? darkTheme : lightTheme);
  const toggleTheme = /* @__PURE__ */ __name(() => {
    const newIsDark = !isDark();
    setIsDark(newIsDark);
    setThemeState(newIsDark ? darkTheme : lightTheme);
  }, "toggleTheme");
  const setTheme = /* @__PURE__ */ __name((name) => {
    if (name.includes("light")) {
      setIsDark(false);
      setThemeState(lightTheme);
    } else {
      setIsDark(true);
      setThemeState(darkTheme);
    }
  }, "setTheme");
  return _$createComponent2(ThemeContext.Provider, {
    value: {
      theme,
      isDarkMode: isDark,
      toggleTheme,
      setTheme
    },
    get children() {
      return props.children;
    }
  });
}
__name(ThemeProvider, "ThemeProvider");
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
__name(useTheme, "useTheme");

// src/tui/context/agent.tsx
import { createComponent as _$createComponent3 } from "@opentui/solid";
var AgentContext = createContext();
function AgentProvider(props) {
  const {
    agent
  } = props;
  const processInput = /* @__PURE__ */ __name(async (input) => {
    if (!input.trim()) return;
    await agent.processUserInput(input);
  }, "processInput");
  const getModel = /* @__PURE__ */ __name(() => agent.getModel(), "getModel");
  const setModel = /* @__PURE__ */ __name((model) => {
    if (typeof agent.setModel === "function") {
      agent.setModel(model);
    }
  }, "setModel");
  const getTodos = /* @__PURE__ */ __name(() => agent.getTodos(), "getTodos");
  const getPlanState = /* @__PURE__ */ __name(() => agent.getPlanState(), "getPlanState");
  return _$createComponent3(AgentContext.Provider, {
    value: {
      agent,
      processInput,
      getModel,
      setModel,
      getTodos,
      getPlanState
    },
    get children() {
      return props.children;
    }
  });
}
__name(AgentProvider, "AgentProvider");
function useAgent() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error("useAgent must be used within AgentProvider");
  }
  return context;
}
__name(useAgent, "useAgent");

// src/tui/context/sync.tsx
import { createComponent as _$createComponent4 } from "@opentui/solid";

// node_modules/solid-js/store/dist/store.js
var $RAW = /* @__PURE__ */ Symbol("store-raw");
var $NODE = /* @__PURE__ */ Symbol("store-node");
var $HAS = /* @__PURE__ */ Symbol("store-has");
var $SELF = /* @__PURE__ */ Symbol("store-self");
function wrap$1(value) {
  let p = value[$PROXY];
  if (!p) {
    Object.defineProperty(value, $PROXY, {
      value: p = new Proxy(value, proxyTraps$1)
    });
    if (!Array.isArray(value)) {
      const keys = Object.keys(value), desc = Object.getOwnPropertyDescriptors(value);
      for (let i = 0, l = keys.length; i < l; i++) {
        const prop = keys[i];
        if (desc[prop].get) {
          Object.defineProperty(value, prop, {
            enumerable: desc[prop].enumerable,
            get: desc[prop].get.bind(p)
          });
        }
      }
    }
  }
  return p;
}
__name(wrap$1, "wrap$1");
function isWrappable(obj) {
  let proto;
  return obj != null && typeof obj === "object" && (obj[$PROXY] || !(proto = Object.getPrototypeOf(obj)) || proto === Object.prototype || Array.isArray(obj));
}
__name(isWrappable, "isWrappable");
function unwrap(item, set = /* @__PURE__ */ new Set()) {
  let result, unwrapped, v, prop;
  if (result = item != null && item[$RAW]) return result;
  if (!isWrappable(item) || set.has(item)) return item;
  if (Array.isArray(item)) {
    if (Object.isFrozen(item)) item = item.slice(0);
    else set.add(item);
    for (let i = 0, l = item.length; i < l; i++) {
      v = item[i];
      if ((unwrapped = unwrap(v, set)) !== v) item[i] = unwrapped;
    }
  } else {
    if (Object.isFrozen(item)) item = Object.assign({}, item);
    else set.add(item);
    const keys = Object.keys(item), desc = Object.getOwnPropertyDescriptors(item);
    for (let i = 0, l = keys.length; i < l; i++) {
      prop = keys[i];
      if (desc[prop].get) continue;
      v = item[prop];
      if ((unwrapped = unwrap(v, set)) !== v) item[prop] = unwrapped;
    }
  }
  return item;
}
__name(unwrap, "unwrap");
function getNodes(target, symbol) {
  let nodes = target[symbol];
  if (!nodes) Object.defineProperty(target, symbol, {
    value: nodes = /* @__PURE__ */ Object.create(null)
  });
  return nodes;
}
__name(getNodes, "getNodes");
function getNode(nodes, property, value) {
  if (nodes[property]) return nodes[property];
  const [s, set] = createSignal(value, {
    equals: false,
    internal: true
  });
  s.$ = set;
  return nodes[property] = s;
}
__name(getNode, "getNode");
function proxyDescriptor$1(target, property) {
  const desc = Reflect.getOwnPropertyDescriptor(target, property);
  if (!desc || desc.get || !desc.configurable || property === $PROXY || property === $NODE) return desc;
  delete desc.value;
  delete desc.writable;
  desc.get = () => target[$PROXY][property];
  return desc;
}
__name(proxyDescriptor$1, "proxyDescriptor$1");
function trackSelf(target) {
  getListener() && getNode(getNodes(target, $NODE), $SELF)();
}
__name(trackSelf, "trackSelf");
function ownKeys(target) {
  trackSelf(target);
  return Reflect.ownKeys(target);
}
__name(ownKeys, "ownKeys");
var proxyTraps$1 = {
  get(target, property, receiver) {
    if (property === $RAW) return target;
    if (property === $PROXY) return receiver;
    if (property === $TRACK) {
      trackSelf(target);
      return receiver;
    }
    const nodes = getNodes(target, $NODE);
    const tracked = nodes[property];
    let value = tracked ? tracked() : target[property];
    if (property === $NODE || property === $HAS || property === "__proto__") return value;
    if (!tracked) {
      const desc = Object.getOwnPropertyDescriptor(target, property);
      if (getListener() && (typeof value !== "function" || target.hasOwnProperty(property)) && !(desc && desc.get)) value = getNode(nodes, property, value)();
    }
    return isWrappable(value) ? wrap$1(value) : value;
  },
  has(target, property) {
    if (property === $RAW || property === $PROXY || property === $TRACK || property === $NODE || property === $HAS || property === "__proto__") return true;
    getListener() && getNode(getNodes(target, $HAS), property)();
    return property in target;
  },
  set() {
    return true;
  },
  deleteProperty() {
    return true;
  },
  ownKeys,
  getOwnPropertyDescriptor: proxyDescriptor$1
};
function setProperty(state, property, value, deleting = false) {
  if (!deleting && state[property] === value) return;
  const prev = state[property], len = state.length;
  if (value === void 0) {
    delete state[property];
    if (state[$HAS] && state[$HAS][property] && prev !== void 0) state[$HAS][property].$();
  } else {
    state[property] = value;
    if (state[$HAS] && state[$HAS][property] && prev === void 0) state[$HAS][property].$();
  }
  let nodes = getNodes(state, $NODE), node;
  if (node = getNode(nodes, property, prev)) node.$(() => value);
  if (Array.isArray(state) && state.length !== len) {
    for (let i = state.length; i < len; i++) (node = nodes[i]) && node.$();
    (node = getNode(nodes, "length", len)) && node.$(state.length);
  }
  (node = nodes[$SELF]) && node.$();
}
__name(setProperty, "setProperty");
function mergeStoreNode(state, value) {
  const keys = Object.keys(value);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    setProperty(state, key, value[key]);
  }
}
__name(mergeStoreNode, "mergeStoreNode");
function updateArray(current, next) {
  if (typeof next === "function") next = next(current);
  next = unwrap(next);
  if (Array.isArray(next)) {
    if (current === next) return;
    let i = 0, len = next.length;
    for (; i < len; i++) {
      const value = next[i];
      if (current[i] !== value) setProperty(current, i, value);
    }
    setProperty(current, "length", len);
  } else mergeStoreNode(current, next);
}
__name(updateArray, "updateArray");
function updatePath(current, path, traversed = []) {
  let part, prev = current;
  if (path.length > 1) {
    part = path.shift();
    const partType = typeof part, isArray = Array.isArray(current);
    if (Array.isArray(part)) {
      for (let i = 0; i < part.length; i++) {
        updatePath(current, [part[i]].concat(path), traversed);
      }
      return;
    } else if (isArray && partType === "function") {
      for (let i = 0; i < current.length; i++) {
        if (part(current[i], i)) updatePath(current, [i].concat(path), traversed);
      }
      return;
    } else if (isArray && partType === "object") {
      const {
        from = 0,
        to = current.length - 1,
        by = 1
      } = part;
      for (let i = from; i <= to; i += by) {
        updatePath(current, [i].concat(path), traversed);
      }
      return;
    } else if (path.length > 1) {
      updatePath(current[part], path, [part].concat(traversed));
      return;
    }
    prev = current[part];
    traversed = [part].concat(traversed);
  }
  let value = path[0];
  if (typeof value === "function") {
    value = value(prev, traversed);
    if (value === prev) return;
  }
  if (part === void 0 && value == void 0) return;
  value = unwrap(value);
  if (part === void 0 || isWrappable(prev) && isWrappable(value) && !Array.isArray(value)) {
    mergeStoreNode(prev, value);
  } else setProperty(current, part, value);
}
__name(updatePath, "updatePath");
function createStore(...[store, options]) {
  const unwrappedStore = unwrap(store || {});
  const isArray = Array.isArray(unwrappedStore);
  const wrappedStore = wrap$1(unwrappedStore);
  function setStore(...args) {
    batch(() => {
      isArray && args.length === 1 ? updateArray(unwrappedStore, args[0]) : updatePath(unwrappedStore, args);
    });
  }
  __name(setStore, "setStore");
  return [wrappedStore, setStore];
}
__name(createStore, "createStore");
var producers = /* @__PURE__ */ new WeakMap();
var setterTraps = {
  get(target, property) {
    if (property === $RAW) return target;
    const value = target[property];
    let proxy;
    return isWrappable(value) ? producers.get(value) || (producers.set(value, proxy = new Proxy(value, setterTraps)), proxy) : value;
  },
  set(target, property, value) {
    setProperty(target, property, unwrap(value));
    return true;
  },
  deleteProperty(target, property) {
    setProperty(target, property, void 0, true);
    return true;
  }
};
function produce(fn) {
  return (state) => {
    if (isWrappable(state)) {
      let proxy;
      if (!(proxy = producers.get(state))) {
        producers.set(state, proxy = new Proxy(state, setterTraps));
      }
      fn(proxy);
    }
    return state;
  };
}
__name(produce, "produce");

// src/tui/context/sync.tsx
import { onStatus, getStatus } from "../core/status.js";
import { onToolOutput, getRecentOutputs } from "../core/output.js";
var SyncContext = createContext();
function SyncProvider(props) {
  const {
    agent,
    getTodos,
    getPlanState
  } = useAgent();
  const [state, setState] = createStore({
    status: {
      phase: "idle",
      message: getStatus().message || ""
    },
    todos: [],
    outputs: getRecentOutputs(),
    plan: {
      status: "none",
      plan: null
    },
    isProcessing: false,
    processingStartTime: null
  });
  createEffect(() => {
    const unsubscribe = onStatus((s) => {
      const isProcessing = s.phase !== "idle" && !!s.message;
      setState("status", {
        phase: isProcessing ? "processing" : "idle",
        message: s.message || ""
      });
      setState("isProcessing", isProcessing);
      if (isProcessing && !state.processingStartTime) {
        setState("processingStartTime", Date.now());
      } else if (!isProcessing) {
        setState("processingStartTime", null);
      }
    });
    onCleanup(unsubscribe);
  });
  createEffect(() => {
    const unsubscribe = onToolOutput((output) => {
      setState("outputs", produce((outputs) => {
        outputs.push(output);
        if (outputs.length > 100) {
          outputs.shift();
        }
      }));
    });
    onCleanup(unsubscribe);
  });
  createEffect(() => {
    const interval = setInterval(() => {
      try {
        const todoState = getTodos();
        setState("todos", todoState.todos || []);
        const planState = getPlanState();
        if (planState.status === "pending_approval" && planState.plan) {
          setState("plan", {
            status: "pending_approval",
            plan: planState.plan
          });
          setState("isProcessing", false);
        } else {
          setState("plan", {
            status: planState.status === "approved" ? "approved" : "none",
            plan: null
          });
        }
      } catch {
      }
    }, 500);
    onCleanup(() => clearInterval(interval));
  });
  const clearOutputs = /* @__PURE__ */ __name(() => {
    setState("outputs", []);
  }, "clearOutputs");
  const getOutputById = /* @__PURE__ */ __name((id) => {
    return state.outputs.find((o) => o.id === id);
  }, "getOutputById");
  return _$createComponent4(SyncContext.Provider, {
    value: {
      state,
      clearOutputs,
      getOutputById
    },
    get children() {
      return props.children;
    }
  });
}
__name(SyncProvider, "SyncProvider");
function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within SyncProvider");
  }
  return context;
}
__name(useSync, "useSync");

// src/tui/context/route.tsx
import { createComponent as _$createComponent5 } from "@opentui/solid";
var RouteContext = createContext();
function RouteProvider(props) {
  const [current, setCurrent] = createSignal("session");
  const [params, setParams] = createSignal({});
  const navigate = /* @__PURE__ */ __name((route) => {
    setCurrent(route);
  }, "navigate");
  return _$createComponent5(RouteContext.Provider, {
    value: {
      current,
      navigate,
      params,
      setParams
    },
    get children() {
      return props.children;
    }
  });
}
__name(RouteProvider, "RouteProvider");
function useRoute() {
  const context = useContext(RouteContext);
  if (!context) {
    throw new Error("useRoute must be used within RouteProvider");
  }
  return context;
}
__name(useRoute, "useRoute");

// src/tui/context/dialog.tsx
import { createComponent as _$createComponent6 } from "@opentui/solid";
var DialogContext = createContext();
function DialogProvider(props) {
  const [dialogStack, setDialogStack] = createSignal([]);
  const current = /* @__PURE__ */ __name(() => {
    const stack = dialogStack();
    return stack.length > 0 ? stack[stack.length - 1] : null;
  }, "current");
  const isOpen = /* @__PURE__ */ __name(() => dialogStack().length > 0, "isOpen");
  const open = /* @__PURE__ */ __name((config) => {
    setDialogStack((stack) => [...stack, config]);
  }, "open");
  const close = /* @__PURE__ */ __name(() => {
    setDialogStack((stack) => stack.slice(0, -1));
  }, "close");
  const confirm = /* @__PURE__ */ __name((message) => {
    return new Promise((resolve) => {
      open({
        type: "confirm",
        message,
        onConfirm: /* @__PURE__ */ __name(() => {
          close();
          resolve(true);
        }, "onConfirm"),
        onCancel: /* @__PURE__ */ __name(() => {
          close();
          resolve(false);
        }, "onCancel")
      });
    });
  }, "confirm");
  const alert = /* @__PURE__ */ __name((message) => {
    return new Promise((resolve) => {
      open({
        type: "alert",
        message,
        onConfirm: /* @__PURE__ */ __name(() => {
          close();
          resolve();
        }, "onConfirm")
      });
    });
  }, "alert");
  const prompt = /* @__PURE__ */ __name((message, defaultValue) => {
    return new Promise((resolve) => {
      open({
        type: "prompt",
        message,
        defaultValue,
        onConfirm: /* @__PURE__ */ __name((value) => {
          close();
          resolve(value || null);
        }, "onConfirm"),
        onCancel: /* @__PURE__ */ __name(() => {
          close();
          resolve(null);
        }, "onCancel")
      });
    });
  }, "prompt");
  const select = /* @__PURE__ */ __name((message, options) => {
    return new Promise((resolve) => {
      open({
        type: "select",
        message,
        options,
        onConfirm: /* @__PURE__ */ __name((value) => {
          close();
          resolve(value);
        }, "onConfirm"),
        onCancel: /* @__PURE__ */ __name(() => {
          close();
          resolve(null);
        }, "onCancel")
      });
    });
  }, "select");
  return _$createComponent6(DialogContext.Provider, {
    value: {
      current,
      isOpen,
      open,
      close,
      confirm,
      alert,
      prompt,
      select
    },
    get children() {
      return props.children;
    }
  });
}
__name(DialogProvider, "DialogProvider");
function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within DialogProvider");
  }
  return context;
}
__name(useDialog, "useDialog");

// src/tui/context/command.tsx
import { createComponent as _$createComponent7 } from "@opentui/solid";
var CommandContext = createContext();
function CommandProvider(props) {
  const [commands, setCommands] = createSignal([]);
  const [isOpen, setIsOpen] = createSignal(false);
  const register = /* @__PURE__ */ __name((command) => {
    setCommands((prev) => {
      const exists = prev.findIndex((c) => c.name === command.name);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = command;
        return updated;
      }
      return [...prev, command];
    });
  }, "register");
  const unregister = /* @__PURE__ */ __name((name) => {
    setCommands((prev) => prev.filter((c) => c.name !== name));
  }, "unregister");
  const execute = /* @__PURE__ */ __name(async (name) => {
    const command = commands().find((c) => c.name === name);
    if (command) {
      await command.action();
    }
  }, "execute");
  const search = /* @__PURE__ */ __name((query) => {
    if (!query) return commands();
    const lowerQuery = query.toLowerCase();
    return commands().filter((c) => c.name.toLowerCase().includes(lowerQuery) || c.label.toLowerCase().includes(lowerQuery) || c.description?.toLowerCase().includes(lowerQuery)).sort((a, b) => {
      const aExact = a.name.toLowerCase() === lowerQuery || a.label.toLowerCase() === lowerQuery;
      const bExact = b.name.toLowerCase() === lowerQuery || b.label.toLowerCase() === lowerQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });
  }, "search");
  const open = /* @__PURE__ */ __name(() => setIsOpen(true), "open");
  const close = /* @__PURE__ */ __name(() => setIsOpen(false), "close");
  return _$createComponent7(CommandContext.Provider, {
    value: {
      commands,
      register,
      unregister,
      execute,
      search,
      isOpen,
      open,
      close
    },
    get children() {
      return props.children;
    }
  });
}
__name(CommandProvider, "CommandProvider");

// src/tui/context/toast.tsx
import { createComponent as _$createComponent8 } from "@opentui/solid";
var ToastContext = createContext();
var toastId = 0;
function ToastProvider(props) {
  const [toasts, setToasts] = createSignal([]);
  const show = /* @__PURE__ */ __name((toast) => {
    const id = `toast-${++toastId}`;
    const duration = toast.duration ?? 3e3;
    setToasts((prev) => [...prev, {
      ...toast,
      id
    }]);
    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
    return id;
  }, "show");
  const dismiss = /* @__PURE__ */ __name((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, "dismiss");
  const dismissAll = /* @__PURE__ */ __name(() => {
    setToasts([]);
  }, "dismissAll");
  const info = /* @__PURE__ */ __name((message, duration) => show({
    type: "info",
    message,
    duration
  }), "info");
  const success = /* @__PURE__ */ __name((message, duration) => show({
    type: "success",
    message,
    duration
  }), "success");
  const warning = /* @__PURE__ */ __name((message, duration) => show({
    type: "warning",
    message,
    duration
  }), "warning");
  const error = /* @__PURE__ */ __name((message, duration) => show({
    type: "error",
    message,
    duration
  }), "error");
  return _$createComponent8(ToastContext.Provider, {
    value: {
      toasts,
      show,
      dismiss,
      dismissAll,
      info,
      success,
      warning,
      error
    },
    get children() {
      return props.children;
    }
  });
}
__name(ToastProvider, "ToastProvider");
function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
__name(useToast, "useToast");

// src/tui/context/prompt.tsx
import { createComponent as _$createComponent9 } from "@opentui/solid";
var PromptContext = createContext();
var MAX_HISTORY = 100;
function PromptProvider(props) {
  const [value, setValue] = createSignal("");
  const [history, setHistory] = createSignal([]);
  const [historyIndex, setHistoryIndex] = createSignal(-1);
  const [stash, setStash] = createSignal(null);
  const [isFocused, setIsFocused] = createSignal(true);
  const [tempValue, setTempValue] = createSignal("");
  const mode = /* @__PURE__ */ __name(() => {
    const v = value();
    if (v.startsWith("/")) return "command";
    if (v.startsWith("@")) return "file";
    if (v.startsWith("!")) return "shell";
    return "default";
  }, "mode");
  const clear = /* @__PURE__ */ __name(() => {
    setValue("");
    setHistoryIndex(-1);
  }, "clear");
  const addToHistory = /* @__PURE__ */ __name((input) => {
    if (!input.trim()) return;
    setHistory((prev) => {
      if (prev[0] === input) return prev;
      const updated = [input, ...prev];
      return updated.slice(0, MAX_HISTORY);
    });
    setHistoryIndex(-1);
  }, "addToHistory");
  const navigateHistory = /* @__PURE__ */ __name((direction) => {
    const hist = history();
    if (hist.length === 0) return;
    const currentIndex = historyIndex();
    if (direction === "up") {
      if (currentIndex === -1) {
        setTempValue(value());
        setHistoryIndex(0);
        setValue(hist[0]);
      } else if (currentIndex < hist.length - 1) {
        const newIndex = currentIndex + 1;
        setHistoryIndex(newIndex);
        setValue(hist[newIndex]);
      }
    } else {
      if (currentIndex > 0) {
        const newIndex = currentIndex - 1;
        setHistoryIndex(newIndex);
        setValue(hist[newIndex]);
      } else if (currentIndex === 0) {
        setHistoryIndex(-1);
        setValue(tempValue());
      }
    }
  }, "navigateHistory");
  const saveToStash = /* @__PURE__ */ __name(() => {
    const v = value();
    if (v.trim()) {
      setStash(v);
      clear();
    }
  }, "saveToStash");
  const restoreFromStash = /* @__PURE__ */ __name(() => {
    const s = stash();
    if (s) {
      setValue(s);
      setStash(null);
    }
  }, "restoreFromStash");
  const focus = /* @__PURE__ */ __name(() => setIsFocused(true), "focus");
  const blur = /* @__PURE__ */ __name(() => setIsFocused(false), "blur");
  return _$createComponent9(PromptContext.Provider, {
    value: {
      value,
      setValue,
      clear,
      mode,
      history,
      historyIndex,
      addToHistory,
      navigateHistory,
      stash,
      saveToStash,
      restoreFromStash,
      isFocused,
      focus,
      blur
    },
    get children() {
      return props.children;
    }
  });
}
__name(PromptProvider, "PromptProvider");
function usePrompt() {
  const context = useContext(PromptContext);
  if (!context) {
    throw new Error("usePrompt must be used within PromptProvider");
  }
  return context;
}
__name(usePrompt, "usePrompt");

// src/tui/context/keybind.tsx
import { createComponent as _$createComponent10 } from "@opentui/solid";
var KeybindContext = createContext();
var defaultBindings = [{
  key: "c",
  ctrl: true,
  action: "exit"
}, {
  key: "p",
  ctrl: true,
  action: "command.open"
}, {
  key: "m",
  ctrl: true,
  action: "model.switch"
}, {
  key: "t",
  ctrl: true,
  action: "theme.toggle"
}, {
  key: "l",
  ctrl: true,
  action: "prompt.clear"
}, {
  key: "s",
  ctrl: true,
  action: "session.list"
}, {
  key: "o",
  ctrl: true,
  action: "output.expand"
}, {
  key: "n",
  ctrl: true,
  action: "session.new"
}];
function KeybindProvider(props) {
  const [bindings, setBindings] = createSignal(defaultBindings);
  const register = /* @__PURE__ */ __name((keybind) => {
    setBindings((prev) => {
      const exists = prev.findIndex((b) => b.action === keybind.action);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = keybind;
        return updated;
      }
      return [...prev, keybind];
    });
  }, "register");
  const unregister = /* @__PURE__ */ __name((action) => {
    setBindings((prev) => prev.filter((b) => b.action !== action));
  }, "unregister");
  const matchEvent = /* @__PURE__ */ __name((binding, event) => {
    const eventName = (event.name || "").toLowerCase();
    const bindingKey = binding.key.toLowerCase();
    if (bindingKey !== eventName) return false;
    if (!!binding.ctrl !== !!event.ctrl) return false;
    if (!!binding.alt !== !!(event.alt || event.option)) return false;
    if (!!binding.shift !== !!event.shift) return false;
    if (!!binding.meta !== !!event.meta) return false;
    return true;
  }, "matchEvent");
  const match = /* @__PURE__ */ __name((action, event) => {
    const binding = bindings().find((b) => b.action === action);
    if (!binding) return false;
    return matchEvent(binding, event);
  }, "match");
  const getBindingForAction = /* @__PURE__ */ __name((action) => {
    return bindings().find((b) => b.action === action);
  }, "getBindingForAction");
  const formatKeybind = /* @__PURE__ */ __name((keybind) => {
    const parts = [];
    if (keybind.ctrl) parts.push("^");
    if (keybind.alt) parts.push("Alt+");
    if (keybind.shift) parts.push("Shift+");
    if (keybind.meta) parts.push("Cmd+");
    parts.push(keybind.key.toUpperCase());
    return parts.join("");
  }, "formatKeybind");
  return _$createComponent10(KeybindContext.Provider, {
    value: {
      bindings,
      register,
      unregister,
      match,
      getBindingForAction,
      formatKeybind
    },
    get children() {
      return props.children;
    }
  });
}
__name(KeybindProvider, "KeybindProvider");
function useKeybind() {
  const context = useContext(KeybindContext);
  if (!context) {
    throw new Error("useKeybind must be used within KeybindProvider");
  }
  return context;
}
__name(useKeybind, "useKeybind");

// src/tui/routes/home.tsx
import { memo as _$memo } from "@opentui/solid";
import { effect as _$effect } from "@opentui/solid";
import { insert as _$insert } from "@opentui/solid";
import { createComponent as _$createComponent11 } from "@opentui/solid";
import { createTextNode as _$createTextNode } from "@opentui/solid";
import { insertNode as _$insertNode } from "@opentui/solid";
import { setProp as _$setProp } from "@opentui/solid";
import { createElement as _$createElement } from "@opentui/solid";
function Home() {
  const route = useRoute();
  const {
    theme
  } = useTheme();
  const {
    formatKeybind,
    getBindingForAction
  } = useKeybind();
  const shortcuts = [{
    action: "session.new",
    label: "New Session"
  }, {
    action: "session.list",
    label: "Session List"
  }, {
    action: "command.open",
    label: "Command Palette"
  }, {
    action: "theme.toggle",
    label: "Toggle Theme"
  }];
  return (() => {
    var _el$ = _$createElement("box"), _el$2 = _$createElement("box"), _el$3 = _$createElement("text"), _el$5 = _$createElement("text"), _el$7 = _$createElement("box"), _el$8 = _$createElement("text"), _el$0 = _$createElement("box"), _el$1 = _$createElement("text");
    _$insertNode(_el$, _el$2);
    _$insertNode(_el$, _el$5);
    _$insertNode(_el$, _el$7);
    _$insertNode(_el$, _el$0);
    _$setProp(_el$, "flexDirection", "column");
    _$setProp(_el$, "padding", 1);
    _$insertNode(_el$2, _el$3);
    _$setProp(_el$2, "marginBottom", 1);
    _$insertNode(_el$3, _$createTextNode(`
    ____              __       __
   / __ )____  ____  / /______/ /__________ _____
  / __  / __ \\/ __ \\/ __/ ___/ __/ ___/ __ '/ __ \\
 / /_/ / /_/ / /_/ / /_(__  ) /_/ /  / /_/ / /_/ /
/_____/\\____/\\____/\\__/____/\\__/_/   \\__,_/ .___/
                                         /_/
          `));
    _$setProp(_el$3, "bold", true);
    _$insertNode(_el$5, _$createTextNode(`AI-powered coding agent`));
    _$insertNode(_el$7, _el$8);
    _$setProp(_el$7, "marginTop", 2);
    _$setProp(_el$7, "flexDirection", "column");
    _$insertNode(_el$8, _$createTextNode(`Quick Actions`));
    _$setProp(_el$8, "bold", true);
    _$setProp(_el$8, "marginBottom", 1);
    _$insert(_el$7, _$createComponent11(For, {
      each: shortcuts,
      children: /* @__PURE__ */ __name((shortcut) => {
        const binding = getBindingForAction(shortcut.action);
        return (() => {
          var _el$11 = _$createElement("box"), _el$12 = _$createElement("text"), _el$13 = _$createElement("text"), _el$14 = _$createTextNode(` `);
          _$insertNode(_el$11, _el$12);
          _$insertNode(_el$11, _el$13);
          _$insert(_el$12, () => binding ? formatKeybind(binding) : "");
          _$insertNode(_el$13, _el$14);
          _$insert(_el$13, () => shortcut.label, null);
          _$effect((_$p) => _$setProp(_el$12, "color", theme().colors.accent, _$p));
          return _el$11;
        })();
      }, "children")
    }), null);
    _$insertNode(_el$0, _el$1);
    _$setProp(_el$0, "marginTop", 2);
    _$insertNode(_el$1, _$createTextNode(`Press Enter or start typing to begin a new session...`));
    _$effect((_p$) => {
      var _v$ = theme().colors.primary, _v$2 = theme().colors.muted, _v$3 = theme().colors.muted;
      _v$ !== _p$.e && (_p$.e = _$setProp(_el$3, "color", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp(_el$5, "color", _v$2, _p$.t));
      _v$3 !== _p$.a && (_p$.a = _$setProp(_el$1, "color", _v$3, _p$.a));
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    });
    return _el$;
  })();
}
__name(Home, "Home");

// src/tui/routes/session/index.tsx
import { insertNode as _$insertNode14 } from "@opentui/solid";
import { insert as _$insert14 } from "@opentui/solid";
import { createComponent as _$createComponent22 } from "@opentui/solid";
import { setProp as _$setProp14 } from "@opentui/solid";
import { createElement as _$createElement14 } from "@opentui/solid";

// src/tui/routes/session/header.tsx
import { effect as _$effect2 } from "@opentui/solid";
import { insert as _$insert2 } from "@opentui/solid";
import { createTextNode as _$createTextNode2 } from "@opentui/solid";
import { insertNode as _$insertNode2 } from "@opentui/solid";
import { setProp as _$setProp2 } from "@opentui/solid";
import { createElement as _$createElement2 } from "@opentui/solid";
function Header() {
  const {
    theme
  } = useTheme();
  const {
    getModel
  } = useAgent();
  const {
    formatKeybind,
    getBindingForAction
  } = useKeybind();
  const modelDisplay = createMemo(() => {
    const model = getModel();
    if (model.includes("claude")) {
      if (model.includes("opus")) return "claude-opus";
      if (model.includes("sonnet")) return "claude-sonnet";
      if (model.includes("haiku")) return "claude-haiku";
    }
    return model.split("/").pop() || model;
  });
  const shortcuts = createMemo(() => {
    const bindings = [{
      action: "exit",
      label: "quit"
    }, {
      action: "command.open",
      label: "cmds"
    }, {
      action: "output.expand",
      label: "output"
    }];
    return bindings.map((b) => {
      const binding = getBindingForAction(b.action);
      return binding ? `${formatKeybind(binding)} ${b.label}` : null;
    }).filter(Boolean);
  });
  return (() => {
    var _el$ = _$createElement2("box"), _el$2 = _$createElement2("box"), _el$3 = _$createElement2("text"), _el$5 = _$createElement2("text"), _el$7 = _$createElement2("text"), _el$8 = _$createElement2("box");
    _$insertNode2(_el$, _el$2);
    _$insertNode2(_el$, _el$8);
    _$setProp2(_el$, "borderStyle", "single");
    _$setProp2(_el$, "borderBottom", true);
    _$setProp2(_el$, "paddingX", 1);
    _$setProp2(_el$, "flexDirection", "row");
    _$setProp2(_el$, "justifyContent", "space-between");
    _$insertNode2(_el$2, _el$3);
    _$insertNode2(_el$2, _el$5);
    _$insertNode2(_el$2, _el$7);
    _$setProp2(_el$2, "flexDirection", "row");
    _$setProp2(_el$2, "gap", 2);
    _$insertNode2(_el$3, _$createTextNode2(`Bootstrap`));
    _$setProp2(_el$3, "bold", true);
    _$insertNode2(_el$5, _$createTextNode2(`|`));
    _$insert2(_el$7, modelDisplay);
    _$setProp2(_el$8, "flexDirection", "row");
    _$setProp2(_el$8, "gap", 2);
    _$insert2(_el$8, () => shortcuts().map((shortcut) => (() => {
      var _el$9 = _$createElement2("text");
      _$insert2(_el$9, shortcut);
      _$effect2((_$p) => _$setProp2(_el$9, "color", theme().colors.muted, _$p));
      return _el$9;
    })()));
    _$effect2((_p$) => {
      var _v$ = theme().colors.primary, _v$2 = theme().colors.muted, _v$3 = theme().colors.accent;
      _v$ !== _p$.e && (_p$.e = _$setProp2(_el$3, "color", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp2(_el$5, "color", _v$2, _p$.t));
      _v$3 !== _p$.a && (_p$.a = _$setProp2(_el$7, "color", _v$3, _p$.a));
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    });
    return _el$;
  })();
}
__name(Header, "Header");

// src/tui/routes/session/footer.tsx
import { createComponent as _$createComponent12 } from "@opentui/solid";
import { effect as _$effect3 } from "@opentui/solid";
import { createTextNode as _$createTextNode3 } from "@opentui/solid";
import { insertNode as _$insertNode3 } from "@opentui/solid";
import { insert as _$insert3 } from "@opentui/solid";
import { memo as _$memo2 } from "@opentui/solid";
import { setProp as _$setProp3 } from "@opentui/solid";
import { createElement as _$createElement3 } from "@opentui/solid";
function Footer() {
  const {
    theme
  } = useTheme();
  const {
    state
  } = useSync();
  const {
    mode
  } = usePrompt();
  const [elapsed, setElapsed] = createSignal(0);
  createEffect(() => {
    if (state.isProcessing && state.processingStartTime) {
      const interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - state.processingStartTime) / 1e3));
      }, 1e3);
      onCleanup(() => clearInterval(interval));
    } else {
      setElapsed(0);
    }
  });
  const formatElapsed = /* @__PURE__ */ __name((seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }, "formatElapsed");
  const modeIndicator = createMemo(() => {
    const m = mode();
    switch (m) {
      case "command":
        return {
          label: "CMD",
          color: theme().colors.accent
        };
      case "file":
        return {
          label: "FILE",
          color: theme().colors.info
        };
      case "shell":
        return {
          label: "SHELL",
          color: theme().colors.warning
        };
      default:
        return null;
    }
  });
  const spinnerFrames = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];
  const [spinnerIndex, setSpinnerIndex] = createSignal(0);
  createEffect(() => {
    if (state.isProcessing) {
      const interval = setInterval(() => {
        setSpinnerIndex((i) => (i + 1) % spinnerFrames.length);
      }, 80);
      onCleanup(() => clearInterval(interval));
    }
  });
  return (() => {
    var _el$ = _$createElement3("box"), _el$2 = _$createElement3("box"), _el$0 = _$createElement3("box"), _el$1 = _$createElement3("text");
    _$insertNode3(_el$, _el$2);
    _$insertNode3(_el$, _el$0);
    _$setProp3(_el$, "borderStyle", "single");
    _$setProp3(_el$, "borderTop", true);
    _$setProp3(_el$, "paddingX", 1);
    _$setProp3(_el$, "flexDirection", "row");
    _$setProp3(_el$, "justifyContent", "space-between");
    _$setProp3(_el$2, "flexDirection", "row");
    _$setProp3(_el$2, "gap", 2);
    _$insert3(_el$2, _$createComponent12(Show, {
      get when() {
        return state.isProcessing;
      },
      get children() {
        return [(() => {
          var _el$3 = _$createElement3("text"), _el$4 = _$createTextNode3(` `);
          _$insertNode3(_el$3, _el$4);
          _$insert3(_el$3, () => spinnerFrames[spinnerIndex()], _el$4);
          _$insert3(_el$3, () => state.status.message || "Processing...", null);
          _$effect3((_$p) => _$setProp3(_el$3, "color", theme().colors.primary, _$p));
          return _el$3;
        })(), (() => {
          var _el$5 = _$createElement3("text"), _el$6 = _$createTextNode3(`(`), _el$7 = _$createTextNode3(`)`);
          _$insertNode3(_el$5, _el$6);
          _$insertNode3(_el$5, _el$7);
          _$insert3(_el$5, () => formatElapsed(elapsed()), _el$7);
          _$effect3((_$p) => _$setProp3(_el$5, "color", theme().colors.muted, _$p));
          return _el$5;
        })()];
      }
    }), null);
    _$insert3(_el$2, _$createComponent12(Show, {
      get when() {
        return !state.isProcessing;
      },
      get children() {
        var _el$8 = _$createElement3("text"), _el$9 = _$createTextNode3(` Ready`);
        _$insertNode3(_el$8, _el$9);
        _$insert3(_el$8, () => theme().icons.success, _el$9);
        _$effect3((_$p) => _$setProp3(_el$8, "color", theme().colors.success, _$p));
        return _el$8;
      }
    }), null);
    _$insert3(_el$2, _$createComponent12(Show, {
      get when() {
        return modeIndicator();
      },
      children: /* @__PURE__ */ __name((indicator) => (() => {
        var _el$11 = _$createElement3("text"), _el$12 = _$createTextNode3(`[`), _el$13 = _$createTextNode3(`]`);
        _$insertNode3(_el$11, _el$12);
        _$insertNode3(_el$11, _el$13);
        _$setProp3(_el$11, "bold", true);
        _$insert3(_el$11, () => indicator().label, _el$13);
        _$effect3((_$p) => _$setProp3(_el$11, "color", indicator().color, _$p));
        return _el$11;
      })(), "children")
    }), null);
    _$insertNode3(_el$0, _el$1);
    _$setProp3(_el$0, "flexDirection", "row");
    _$setProp3(_el$0, "gap", 2);
    _$insertNode3(_el$1, _$createTextNode3(`/ command | @ file | ! shell`));
    _$effect3((_$p) => _$setProp3(_el$1, "color", theme().colors.muted, _$p));
    return _el$;
  })();
}
__name(Footer, "Footer");

// src/tui/routes/session/sidebar.tsx
import { memo as _$memo3 } from "@opentui/solid";
import { effect as _$effect4 } from "@opentui/solid";
import { createComponent as _$createComponent13 } from "@opentui/solid";
import { insert as _$insert4 } from "@opentui/solid";
import { createTextNode as _$createTextNode4 } from "@opentui/solid";
import { insertNode as _$insertNode4 } from "@opentui/solid";
import { setProp as _$setProp4 } from "@opentui/solid";
import { createElement as _$createElement4 } from "@opentui/solid";
function Sidebar() {
  const {
    theme
  } = useTheme();
  const {
    state
  } = useSync();
  const {
    getModel
  } = useAgent();
  const activeTodos = createMemo(() => state.todos.filter((t) => t.status === "in_progress"));
  const pendingTodos = createMemo(() => state.todos.filter((t) => t.status === "pending"));
  const completedTodos = createMemo(() => state.todos.filter((t) => t.status === "completed"));
  const todoProgress = createMemo(() => {
    const total = state.todos.length;
    if (total === 0) return 0;
    return Math.round(completedTodos().length / total * 100);
  });
  return (() => {
    var _el$ = _$createElement4("box"), _el$2 = _$createElement4("box"), _el$3 = _$createElement4("text"), _el$5 = _$createElement4("text"), _el$6 = _$createTextNode4(`Model: `), _el$7 = _$createElement4("text"), _el$26 = _$createElement4("box"), _el$27 = _$createElement4("text"), _el$31 = _$createElement4("box"), _el$32 = _$createElement4("text");
    _$insertNode4(_el$, _el$2);
    _$insertNode4(_el$, _el$7);
    _$insertNode4(_el$, _el$26);
    _$insertNode4(_el$, _el$31);
    _$insertNode4(_el$, _el$32);
    _$setProp4(_el$, "width", 30);
    _$setProp4(_el$, "borderStyle", "single");
    _$setProp4(_el$, "borderLeft", true);
    _$setProp4(_el$, "flexDirection", "column");
    _$setProp4(_el$, "padding", 1);
    _$insertNode4(_el$2, _el$3);
    _$insertNode4(_el$2, _el$5);
    _$setProp4(_el$2, "flexDirection", "column");
    _$setProp4(_el$2, "marginBottom", 1);
    _$insertNode4(_el$3, _$createTextNode4(`Session`));
    _$setProp4(_el$3, "bold", true);
    _$insertNode4(_el$5, _el$6);
    _$setProp4(_el$5, "wrap", "truncate");
    _$insert4(_el$5, () => getModel().split("/").pop(), null);
    _$insertNode4(_el$7, _$createTextNode4(`\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`));
    _$insert4(_el$, _$createComponent13(Show, {
      get when() {
        return state.todos.length > 0;
      },
      get children() {
        return [(() => {
          var _el$9 = _$createElement4("box"), _el$0 = _$createElement4("box"), _el$1 = _$createElement4("text"), _el$11 = _$createElement4("text"), _el$12 = _$createTextNode4(`/`), _el$13 = _$createElement4("box"), _el$14 = _$createElement4("text"), _el$16 = _$createElement4("text"), _el$17 = _$createElement4("text"), _el$18 = _$createElement4("text"), _el$19 = _$createTextNode4(`] `), _el$20 = _$createTextNode4(`%`);
          _$insertNode4(_el$9, _el$0);
          _$insertNode4(_el$9, _el$13);
          _$setProp4(_el$9, "flexDirection", "column");
          _$setProp4(_el$9, "marginY", 1);
          _$insertNode4(_el$0, _el$1);
          _$insertNode4(_el$0, _el$11);
          _$setProp4(_el$0, "flexDirection", "row");
          _$setProp4(_el$0, "justifyContent", "space-between");
          _$insertNode4(_el$1, _$createTextNode4(`Tasks`));
          _$setProp4(_el$1, "bold", true);
          _$insertNode4(_el$11, _el$12);
          _$insert4(_el$11, () => completedTodos().length, _el$12);
          _$insert4(_el$11, () => state.todos.length, null);
          _$insertNode4(_el$13, _el$14);
          _$insertNode4(_el$13, _el$16);
          _$insertNode4(_el$13, _el$17);
          _$insertNode4(_el$13, _el$18);
          _$setProp4(_el$13, "marginY", 1);
          _$insertNode4(_el$14, _$createTextNode4(`[`));
          _$insert4(_el$16, () => "\u2588".repeat(Math.floor(todoProgress() / 5)));
          _$insert4(_el$17, () => "\u2591".repeat(20 - Math.floor(todoProgress() / 5)));
          _$insertNode4(_el$18, _el$19);
          _$insertNode4(_el$18, _el$20);
          _$insert4(_el$18, todoProgress, _el$20);
          _$insert4(_el$9, _$createComponent13(Show, {
            get when() {
              return activeTodos().length > 0;
            },
            get children() {
              return _$createComponent13(For, {
                get each() {
                  return activeTodos();
                },
                children: /* @__PURE__ */ __name((todo) => (() => {
                  var _el$34 = _$createElement4("box"), _el$35 = _$createElement4("text"), _el$36 = _$createTextNode4(` `), _el$37 = _$createElement4("text");
                  _$insertNode4(_el$34, _el$35);
                  _$insertNode4(_el$34, _el$37);
                  _$insertNode4(_el$35, _el$36);
                  _$insert4(_el$35, () => theme().icons.active, _el$36);
                  _$setProp4(_el$37, "wrap", "truncate");
                  _$insert4(_el$37, () => todo.activeForm || todo.content);
                  _$effect4((_$p) => _$setProp4(_el$35, "color", theme().colors.warning, _$p));
                  return _el$34;
                })(), "children")
              });
            }
          }), null);
          _$insert4(_el$9, _$createComponent13(Show, {
            get when() {
              return pendingTodos().length > 0;
            },
            get children() {
              return [_$createComponent13(For, {
                get each() {
                  return pendingTodos().slice(0, 3);
                },
                children: /* @__PURE__ */ __name((todo) => (() => {
                  var _el$38 = _$createElement4("box"), _el$39 = _$createElement4("text"), _el$40 = _$createTextNode4(` `), _el$41 = _$createElement4("text");
                  _$insertNode4(_el$38, _el$39);
                  _$insertNode4(_el$38, _el$41);
                  _$insertNode4(_el$39, _el$40);
                  _$insert4(_el$39, () => theme().icons.pending, _el$40);
                  _$setProp4(_el$41, "wrap", "truncate");
                  _$insert4(_el$41, () => todo.content);
                  _$effect4((_p$) => {
                    var _v$0 = theme().colors.muted, _v$1 = theme().colors.muted;
                    _v$0 !== _p$.e && (_p$.e = _$setProp4(_el$39, "color", _v$0, _p$.e));
                    _v$1 !== _p$.t && (_p$.t = _$setProp4(_el$41, "color", _v$1, _p$.t));
                    return _p$;
                  }, {
                    e: void 0,
                    t: void 0
                  });
                  return _el$38;
                })(), "children")
              }), _$createComponent13(Show, {
                get when() {
                  return pendingTodos().length > 3;
                },
                get children() {
                  var _el$21 = _$createElement4("text"), _el$22 = _$createTextNode4(`+`), _el$23 = _$createTextNode4(` more...`);
                  _$insertNode4(_el$21, _el$22);
                  _$insertNode4(_el$21, _el$23);
                  _$insert4(_el$21, () => pendingTodos().length - 3, _el$23);
                  _$effect4((_$p) => _$setProp4(_el$21, "color", theme().colors.muted, _$p));
                  return _el$21;
                }
              })];
            }
          }), null);
          _$effect4((_p$) => {
            var _v$ = theme().colors.muted, _v$2 = theme().colors.muted, _v$3 = theme().colors.success, _v$4 = theme().colors.border, _v$5 = theme().colors.muted;
            _v$ !== _p$.e && (_p$.e = _$setProp4(_el$11, "color", _v$, _p$.e));
            _v$2 !== _p$.t && (_p$.t = _$setProp4(_el$14, "color", _v$2, _p$.t));
            _v$3 !== _p$.a && (_p$.a = _$setProp4(_el$16, "color", _v$3, _p$.a));
            _v$4 !== _p$.o && (_p$.o = _$setProp4(_el$17, "color", _v$4, _p$.o));
            _v$5 !== _p$.i && (_p$.i = _$setProp4(_el$18, "color", _v$5, _p$.i));
            return _p$;
          }, {
            e: void 0,
            t: void 0,
            a: void 0,
            o: void 0,
            i: void 0
          });
          return _el$9;
        })(), (() => {
          var _el$24 = _$createElement4("text");
          _$insertNode4(_el$24, _$createTextNode4(`\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`));
          _$effect4((_$p) => _$setProp4(_el$24, "color", theme().colors.border, _$p));
          return _el$24;
        })()];
      }
    }), _el$26);
    _$insertNode4(_el$26, _el$27);
    _$setProp4(_el$26, "flexDirection", "column");
    _$setProp4(_el$26, "marginY", 1);
    _$insertNode4(_el$27, _$createTextNode4(`Status`));
    _$setProp4(_el$27, "bold", true);
    _$insert4(_el$26, _$createComponent13(Show, {
      get when() {
        return state.isProcessing;
      },
      get fallback() {
        return (() => {
          var _el$42 = _$createElement4("text"), _el$43 = _$createTextNode4(` Idle`);
          _$insertNode4(_el$42, _el$43);
          _$insert4(_el$42, () => theme().icons.success, _el$43);
          _$effect4((_$p) => _$setProp4(_el$42, "color", theme().colors.success, _$p));
          return _el$42;
        })();
      },
      get children() {
        var _el$29 = _$createElement4("text"), _el$30 = _$createTextNode4(` Processing`);
        _$insertNode4(_el$29, _el$30);
        _$insert4(_el$29, () => theme().icons.active, _el$30);
        _$effect4((_$p) => _$setProp4(_el$29, "color", theme().colors.warning, _$p));
        return _el$29;
      }
    }), null);
    _$setProp4(_el$31, "flexGrow", 1);
    _$insertNode4(_el$32, _$createTextNode4(`^P command palette`));
    _$setProp4(_el$32, "wrap", "wrap");
    _$effect4((_p$) => {
      var _v$6 = theme().colors.primary, _v$7 = theme().colors.muted, _v$8 = theme().colors.border, _v$9 = theme().colors.muted;
      _v$6 !== _p$.e && (_p$.e = _$setProp4(_el$3, "color", _v$6, _p$.e));
      _v$7 !== _p$.t && (_p$.t = _$setProp4(_el$5, "color", _v$7, _p$.t));
      _v$8 !== _p$.a && (_p$.a = _$setProp4(_el$7, "color", _v$8, _p$.a));
      _v$9 !== _p$.o && (_p$.o = _$setProp4(_el$32, "color", _v$9, _p$.o));
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0
    });
    return _el$;
  })();
}
__name(Sidebar, "Sidebar");

// src/tui/routes/session/messages.tsx
import { insert as _$insert9 } from "@opentui/solid";
import { memo as _$memo7 } from "@opentui/solid";
import { createComponent as _$createComponent17 } from "@opentui/solid";
import { effect as _$effect8 } from "@opentui/solid";
import { createTextNode as _$createTextNode8 } from "@opentui/solid";
import { insertNode as _$insertNode9 } from "@opentui/solid";
import { setProp as _$setProp9 } from "@opentui/solid";
import { createElement as _$createElement9 } from "@opentui/solid";

// src/tui/component/message/assistant-message.tsx
import { memo as _$memo6 } from "@opentui/solid";
import { createComponent as _$createComponent16 } from "@opentui/solid";
import { effect as _$effect7 } from "@opentui/solid";
import { insert as _$insert8 } from "@opentui/solid";
import { createTextNode as _$createTextNode7 } from "@opentui/solid";
import { insertNode as _$insertNode8 } from "@opentui/solid";
import { setProp as _$setProp8 } from "@opentui/solid";
import { createElement as _$createElement8 } from "@opentui/solid";

// src/tui/component/message/text-part.tsx
import { insertNode as _$insertNode5 } from "@opentui/solid";
import { insert as _$insert5 } from "@opentui/solid";
import { setProp as _$setProp5 } from "@opentui/solid";
import { createElement as _$createElement5 } from "@opentui/solid";
import { renderMarkdownToAnsi } from "../utils/markdown.js";
function TextPart(props) {
  const {
    theme
  } = useTheme();
  const renderedContent = createMemo(() => {
    try {
      return renderMarkdownToAnsi(props.content);
    } catch {
      return props.content;
    }
  });
  return (() => {
    var _el$ = _$createElement5("box"), _el$2 = _$createElement5("text");
    _$insertNode5(_el$, _el$2);
    _$setProp5(_el$, "flexDirection", "column");
    _$setProp5(_el$2, "wrap", "wrap");
    _$insert5(_el$2, renderedContent);
    return _el$;
  })();
}
__name(TextPart, "TextPart");

// src/tui/component/message/tool-part.tsx
import { createComponent as _$createComponent14 } from "@opentui/solid";
import { effect as _$effect5 } from "@opentui/solid";
import { createTextNode as _$createTextNode5 } from "@opentui/solid";
import { insertNode as _$insertNode6 } from "@opentui/solid";
import { memo as _$memo4 } from "@opentui/solid";
import { insert as _$insert6 } from "@opentui/solid";
import { setProp as _$setProp6 } from "@opentui/solid";
import { createElement as _$createElement6 } from "@opentui/solid";
var MAX_COLLAPSED_LINES = 10;
var MAX_LINE_LENGTH = 200;
function ToolPart(props) {
  const {
    theme
  } = useTheme();
  const [localExpanded, setLocalExpanded] = createSignal(false);
  const isExpanded = /* @__PURE__ */ __name(() => props.isExpanded || localExpanded(), "isExpanded");
  const processedContent = createMemo(() => {
    const content = props.output.displayedResult || props.output.result || "";
    const lines = content.split("\n");
    const needsTruncation = lines.length > MAX_COLLAPSED_LINES;
    const displayLines = isExpanded() ? lines : lines.slice(0, MAX_COLLAPSED_LINES);
    const processed = displayLines.map((line, index) => {
      if (line.length > MAX_LINE_LENGTH && !isExpanded()) {
        return `${line.slice(0, MAX_LINE_LENGTH)}...`;
      }
      return line;
    });
    return {
      lines: processed,
      totalLines: lines.length,
      needsTruncation,
      hiddenLines: lines.length - MAX_COLLAPSED_LINES
    };
  });
  const getToolIcon = /* @__PURE__ */ __name(() => {
    const toolName = props.output.toolName?.toLowerCase() || "";
    if (toolName.includes("read") || toolName.includes("file")) {
      return "\u{1F4C4}";
    }
    if (toolName.includes("write") || toolName.includes("edit")) {
      return "\u270F";
    }
    if (toolName.includes("bash") || toolName.includes("shell")) {
      return "\u{1F4BB}";
    }
    if (toolName.includes("search") || toolName.includes("grep")) {
      return "\u{1F50D}";
    }
    return "\u2699";
  }, "getToolIcon");
  const getStatusColor = /* @__PURE__ */ __name(() => {
    const result = props.output.result || "";
    if (result.toLowerCase().includes("error")) return theme().colors.error;
    return theme().colors.success;
  }, "getStatusColor");
  return (() => {
    var _el$ = _$createElement6("box"), _el$2 = _$createElement6("box"), _el$3 = _$createElement6("box"), _el$4 = _$createElement6("text"), _el$5 = _$createElement6("text"), _el$6 = _$createElement6("text"), _el$7 = _$createElement6("box");
    _$insertNode6(_el$, _el$2);
    _$insertNode6(_el$, _el$7);
    _$setProp6(_el$, "flexDirection", "column");
    _$setProp6(_el$, "borderStyle", "single");
    _$setProp6(_el$, "padding", 1);
    _$insertNode6(_el$2, _el$3);
    _$insertNode6(_el$2, _el$6);
    _$setProp6(_el$2, "flexDirection", "row");
    _$setProp6(_el$2, "justifyContent", "space-between");
    _$setProp6(_el$2, "marginBottom", 1);
    _$insertNode6(_el$3, _el$4);
    _$insertNode6(_el$3, _el$5);
    _$setProp6(_el$3, "flexDirection", "row");
    _$setProp6(_el$3, "gap", 1);
    _$insert6(_el$4, getToolIcon);
    _$setProp6(_el$5, "bold", true);
    _$insert6(_el$5, () => props.output.toolName || "Tool");
    _$insert6(_el$6, (() => {
      var _c$ = _$memo4(() => !!props.output.result?.toLowerCase().includes("error"));
      return () => _c$() ? theme().icons.error : theme().icons.success;
    })());
    _$setProp6(_el$7, "flexDirection", "column");
    _$insert6(_el$7, () => processedContent().lines.map((line, index) => (() => {
      var _el$13 = _$createElement6("box"), _el$14 = _$createElement6("text"), _el$15 = _$createTextNode5(` `), _el$16 = _$createTextNode5(` `), _el$17 = _$createElement6("text");
      _$insertNode6(_el$13, _el$14);
      _$insertNode6(_el$13, _el$17);
      _$setProp6(_el$13, "flexDirection", "row");
      _$insertNode6(_el$14, _el$15);
      _$insertNode6(_el$14, _el$16);
      _$setProp6(_el$14, "dimColor", true);
      _$insert6(_el$14, () => String(index + 1).padStart(4, " "), _el$15);
      _$insert6(_el$14, () => theme().icons.pipe, _el$16);
      _$setProp6(_el$17, "wrap", "truncate");
      _$insert6(_el$17, line);
      _$effect5((_$p) => _$setProp6(_el$14, "color", theme().colors.muted, _$p));
      return _el$13;
    })()));
    _$insert6(_el$, _$createComponent14(Show, {
      get when() {
        return _$memo4(() => !!processedContent().needsTruncation)() && !isExpanded();
      },
      get children() {
        var _el$8 = _$createElement6("box"), _el$9 = _$createElement6("text"), _el$0 = _$createTextNode5(`... `), _el$1 = _$createTextNode5(` more lines (^O to expand)`);
        _$insertNode6(_el$8, _el$9);
        _$setProp6(_el$8, "marginTop", 1);
        _$insertNode6(_el$9, _el$0);
        _$insertNode6(_el$9, _el$1);
        _$insert6(_el$9, () => processedContent().hiddenLines, _el$1);
        _$effect5((_$p) => _$setProp6(_el$9, "color", theme().colors.muted, _$p));
        return _el$8;
      }
    }), null);
    _$insert6(_el$, _$createComponent14(Show, {
      get when() {
        return _$memo4(() => !!isExpanded())() && processedContent().needsTruncation;
      },
      get children() {
        var _el$10 = _$createElement6("box"), _el$11 = _$createElement6("text"), _el$12 = _$createTextNode5(` lines total (^O to collapse)`);
        _$insertNode6(_el$10, _el$11);
        _$setProp6(_el$10, "marginTop", 1);
        _$insertNode6(_el$11, _el$12);
        _$insert6(_el$11, () => processedContent().totalLines, _el$12);
        _$effect5((_$p) => _$setProp6(_el$11, "color", theme().colors.muted, _$p));
        return _el$10;
      }
    }), null);
    _$effect5((_p$) => {
      var _v$ = theme().colors.accent, _v$2 = getStatusColor();
      _v$ !== _p$.e && (_p$.e = _$setProp6(_el$5, "color", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp6(_el$6, "color", _v$2, _p$.t));
      return _p$;
    }, {
      e: void 0,
      t: void 0
    });
    return _el$;
  })();
}
__name(ToolPart, "ToolPart");

// src/tui/component/message/reasoning-part.tsx
import { createComponent as _$createComponent15 } from "@opentui/solid";
import { effect as _$effect6 } from "@opentui/solid";
import { memo as _$memo5 } from "@opentui/solid";
import { insert as _$insert7 } from "@opentui/solid";
import { createTextNode as _$createTextNode6 } from "@opentui/solid";
import { insertNode as _$insertNode7 } from "@opentui/solid";
import { setProp as _$setProp7 } from "@opentui/solid";
import { createElement as _$createElement7 } from "@opentui/solid";
function ReasoningPart(props) {
  const {
    theme
  } = useTheme();
  const [isCollapsed, setIsCollapsed] = createSignal(props.defaultCollapsed ?? true);
  const reasoningContent = createMemo(() => {
    const content = props.content;
    const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
    if (thinkingMatch) {
      return thinkingMatch[1].trim();
    }
    return content;
  });
  const summary = createMemo(() => {
    const content = reasoningContent();
    const firstLine = content.split("\n")[0];
    if (firstLine.length > 60) {
      return firstLine.slice(0, 57) + "...";
    }
    return firstLine;
  });
  const lineCount = createMemo(() => {
    return reasoningContent().split("\n").length;
  });
  return (() => {
    var _el$ = _$createElement7("box"), _el$2 = _$createElement7("box"), _el$3 = _$createElement7("box"), _el$4 = _$createElement7("text"), _el$6 = _$createElement7("text"), _el$8 = _$createElement7("text"), _el$9 = _$createTextNode6(`(`), _el$0 = _$createTextNode6(` lines)`), _el$1 = _$createElement7("text");
    _$insertNode7(_el$, _el$2);
    _$setProp7(_el$, "flexDirection", "column");
    _$setProp7(_el$, "borderStyle", "single");
    _$setProp7(_el$, "padding", 1);
    _$insertNode7(_el$2, _el$3);
    _$insertNode7(_el$2, _el$1);
    _$setProp7(_el$2, "flexDirection", "row");
    _$setProp7(_el$2, "justifyContent", "space-between");
    _$insertNode7(_el$3, _el$4);
    _$insertNode7(_el$3, _el$6);
    _$insertNode7(_el$3, _el$8);
    _$setProp7(_el$3, "flexDirection", "row");
    _$setProp7(_el$3, "gap", 1);
    _$insertNode7(_el$4, _$createTextNode6(`\u{1F4AD}`));
    _$insertNode7(_el$6, _$createTextNode6(`Thinking`));
    _$setProp7(_el$6, "bold", true);
    _$insertNode7(_el$8, _el$9);
    _$insertNode7(_el$8, _el$0);
    _$insert7(_el$8, lineCount, _el$0);
    _$insert7(_el$1, () => isCollapsed() ? "[space to expand]" : "[space to collapse]");
    _$insert7(_el$, _$createComponent15(Show, {
      get when() {
        return !isCollapsed();
      },
      get fallback() {
        return (() => {
          var _el$12 = _$createElement7("text");
          _$setProp7(_el$12, "italic", true);
          _$insert7(_el$12, summary);
          _$effect6((_$p) => _$setProp7(_el$12, "color", theme().colors.muted, _$p));
          return _el$12;
        })();
      },
      get children() {
        var _el$10 = _$createElement7("box"), _el$11 = _$createElement7("text");
        _$insertNode7(_el$10, _el$11);
        _$setProp7(_el$10, "flexDirection", "column");
        _$setProp7(_el$11, "wrap", "wrap");
        _$insert7(_el$11, reasoningContent);
        _$effect6((_$p) => _$setProp7(_el$11, "color", theme().colors.muted, _$p));
        return _el$10;
      }
    }), null);
    _$effect6((_p$) => {
      var _v$ = theme().colors.muted, _v$2 = isCollapsed() ? 0 : 1, _v$3 = theme().colors.muted, _v$4 = theme().colors.muted, _v$5 = theme().colors.muted, _v$6 = theme().colors.muted;
      _v$ !== _p$.e && (_p$.e = _$setProp7(_el$, "borderColor", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp7(_el$2, "marginBottom", _v$2, _p$.t));
      _v$3 !== _p$.a && (_p$.a = _$setProp7(_el$4, "color", _v$3, _p$.a));
      _v$4 !== _p$.o && (_p$.o = _$setProp7(_el$6, "color", _v$4, _p$.o));
      _v$5 !== _p$.i && (_p$.i = _$setProp7(_el$8, "color", _v$5, _p$.i));
      _v$6 !== _p$.n && (_p$.n = _$setProp7(_el$1, "color", _v$6, _p$.n));
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0,
      n: void 0
    });
    return _el$;
  })();
}
__name(ReasoningPart, "ReasoningPart");

// src/tui/component/message/assistant-message.tsx
function AssistantMessage(props) {
  const {
    theme
  } = useTheme();
  const isToolOutput = createMemo(() => {
    return !!props.output.toolName;
  });
  const isReasoningOutput = createMemo(() => {
    return props.output.result?.includes("<thinking>");
  });
  const content = createMemo(() => props.output.displayedResult || props.output.result);
  return (() => {
    var _el$ = _$createElement8("box"), _el$2 = _$createElement8("box"), _el$3 = _$createElement8("text"), _el$7 = _$createElement8("box");
    _$insertNode8(_el$, _el$2);
    _$insertNode8(_el$, _el$7);
    _$setProp8(_el$, "flexDirection", "column");
    _$insertNode8(_el$2, _el$3);
    _$setProp8(_el$2, "flexDirection", "row");
    _$setProp8(_el$2, "gap", 1);
    _$insertNode8(_el$3, _$createTextNode7(`Assistant`));
    _$setProp8(_el$3, "bold", true);
    _$insert8(_el$2, _$createComponent16(Show, {
      get when() {
        return props.output.toolName;
      },
      get children() {
        var _el$5 = _$createElement8("text"), _el$6 = _$createTextNode7(` `);
        _$insertNode8(_el$5, _el$6);
        _$insert8(_el$5, () => theme().icons.arrow, _el$6);
        _$insert8(_el$5, () => props.output.toolName, null);
        _$effect7((_$p) => _$setProp8(_el$5, "color", theme().colors.muted, _$p));
        return _el$5;
      }
    }), null);
    _$setProp8(_el$7, "marginLeft", 2);
    _$setProp8(_el$7, "marginTop", 1);
    _$insert8(_el$7, _$createComponent16(Show, {
      get when() {
        return isToolOutput();
      },
      get fallback() {
        return _$createComponent16(Show, {
          get when() {
            return isReasoningOutput();
          },
          get fallback() {
            return _$createComponent16(TextPart, {
              get content() {
                return content();
              }
            });
          },
          get children() {
            return _$createComponent16(ReasoningPart, {
              get content() {
                return content();
              }
            });
          }
        });
      },
      get children() {
        return _$createComponent16(ToolPart, {
          get output() {
            return props.output;
          },
          get isExpanded() {
            return props.isExpanded || false;
          }
        });
      }
    }));
    _$effect7((_$p) => _$setProp8(_el$3, "color", theme().colors.primary, _$p));
    return _el$;
  })();
}
__name(AssistantMessage, "AssistantMessage");

// src/tui/routes/session/messages.tsx
function Messages(props) {
  const {
    theme
  } = useTheme();
  const {
    state
  } = useSync();
  const groupedOutputs = createMemo(() => {
    return state.outputs.map((output) => ({
      ...output,
      isExpanded: props.expandedOutputId === output.id
    }));
  });
  return (() => {
    var _el$ = _$createElement9("box");
    _$setProp9(_el$, "flexDirection", "column");
    _$setProp9(_el$, "padding", 1);
    _$insert9(_el$, _$createComponent17(Show, {
      get when() {
        return state.outputs.length === 0;
      },
      get children() {
        var _el$2 = _$createElement9("box"), _el$3 = _$createElement9("text"), _el$5 = _$createElement9("text"), _el$7 = _$createElement9("box"), _el$8 = _$createElement9("text");
        _$insertNode9(_el$2, _el$3);
        _$insertNode9(_el$2, _el$5);
        _$insertNode9(_el$2, _el$7);
        _$setProp9(_el$2, "flexDirection", "column");
        _$setProp9(_el$2, "alignItems", "center");
        _$setProp9(_el$2, "marginY", 2);
        _$insertNode9(_el$3, _$createTextNode8(`Welcome to Bootstrap`));
        _$setProp9(_el$3, "bold", true);
        _$insertNode9(_el$5, _$createTextNode8(`Start typing to begin a conversation`));
        _$insertNode9(_el$7, _el$8);
        _$setProp9(_el$7, "marginTop", 1);
        _$insertNode9(_el$8, _$createTextNode8(`Use / for commands, @ for files, ! for shell`));
        _$effect8((_p$) => {
          var _v$ = theme().colors.primary, _v$2 = theme().colors.muted, _v$3 = theme().colors.muted;
          _v$ !== _p$.e && (_p$.e = _$setProp9(_el$3, "color", _v$, _p$.e));
          _v$2 !== _p$.t && (_p$.t = _$setProp9(_el$5, "color", _v$2, _p$.t));
          _v$3 !== _p$.a && (_p$.a = _$setProp9(_el$8, "color", _v$3, _p$.a));
          return _p$;
        }, {
          e: void 0,
          t: void 0,
          a: void 0
        });
        return _el$2;
      }
    }), null);
    _$insert9(_el$, _$createComponent17(For, {
      get each() {
        return groupedOutputs();
      },
      children: /* @__PURE__ */ __name((output) => (() => {
        var _el$11 = _$createElement9("box");
        _$setProp9(_el$11, "marginBottom", 1);
        _$insert9(_el$11, _$createComponent17(AssistantMessage, {
          output,
          get isExpanded() {
            return output.isExpanded;
          }
        }));
        return _el$11;
      })(), "children")
    }), null);
    _$insert9(_el$, _$createComponent17(Show, {
      get when() {
        return state.isProcessing;
      },
      get children() {
        var _el$0 = _$createElement9("box"), _el$1 = _$createElement9("text"), _el$10 = _$createTextNode8(` `);
        _$insertNode9(_el$0, _el$1);
        _$setProp9(_el$0, "marginTop", 1);
        _$insertNode9(_el$1, _el$10);
        _$insert9(_el$1, () => theme().icons.active, _el$10);
        _$insert9(_el$1, () => state.status.message || "Thinking...", null);
        _$effect8((_$p) => _$setProp9(_el$1, "color", theme().colors.primary, _$p));
        return _el$0;
      }
    }), null);
    return _el$;
  })();
}
__name(Messages, "Messages");

// src/tui/component/prompt/index.tsx
import { createComponent as _$createComponent18 } from "@opentui/solid";
import { effect as _$effect9 } from "@opentui/solid";
import { insert as _$insert10 } from "@opentui/solid";
import { memo as _$memo8 } from "@opentui/solid";
import { use as _$use } from "@opentui/solid";
import { createTextNode as _$createTextNode9 } from "@opentui/solid";
import { insertNode as _$insertNode10 } from "@opentui/solid";
import { setProp as _$setProp10 } from "@opentui/solid";
import { createElement as _$createElement10 } from "@opentui/solid";
function Prompt(props) {
  const {
    theme
  } = useTheme();
  const {
    state
  } = useSync();
  const {
    value,
    setValue,
    addToHistory
  } = usePrompt();
  const keybind = useKeybind();
  const exit = useExit();
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  let inputRef;
  const handleContentChange = /* @__PURE__ */ __name(() => {
    if (inputRef) {
      const newValue = inputRef.plainText || "";
      setValue(newValue);
    }
  }, "handleContentChange");
  const submit = /* @__PURE__ */ __name(async () => {
    const submittedValue = inputRef?.plainText || value();
    if (!submittedValue?.trim() || isSubmitting()) {
      return;
    }
    setIsSubmitting(true);
    addToHistory(submittedValue);
    try {
      await props.onSubmit(submittedValue);
      if (inputRef) {
        inputRef.clear();
      }
      setValue("");
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  }, "submit");
  onMount(() => {
    if (inputRef) {
      inputRef.focus();
    }
  });
  const textareaKeyBindings = [{
    name: "return",
    action: "submit"
  }, {
    name: "return",
    meta: true,
    action: "newline"
  }];
  return (() => {
    var _el$ = _$createElement10("box"), _el$2 = _$createElement10("box"), _el$3 = _$createElement10("text"), _el$4 = _$createTextNode9(`> `), _el$6 = _$createElement10("textarea");
    _$insertNode10(_el$, _el$2);
    _$setProp10(_el$, "flexDirection", "column");
    _$setProp10(_el$, "flexShrink", 0);
    _$insertNode10(_el$2, _el$3);
    _$insertNode10(_el$2, _el$6);
    _$setProp10(_el$2, "borderStyle", "single");
    _$setProp10(_el$2, "paddingX", 1);
    _$setProp10(_el$2, "paddingY", 0);
    _$setProp10(_el$2, "flexDirection", "row");
    _$insertNode10(_el$3, _el$4);
    _$setProp10(_el$3, "bold", true);
    _$use((r) => {
      inputRef = r;
      if (r) {
        setTimeout(() => {
          r.cursorColor = theme().colors.accent;
          r.focus();
        }, 0);
      }
    }, _el$6);
    _$setProp10(_el$6, "onContentChange", handleContentChange);
    _$setProp10(_el$6, "keyBindings", textareaKeyBindings);
    _$setProp10(_el$6, "onSubmit", submit);
    _$setProp10(_el$6, "minHeight", 1);
    _$setProp10(_el$6, "maxHeight", 6);
    _$setProp10(_el$6, "flexGrow", 1);
    _$insert10(_el$, _$createComponent18(Show, {
      get when() {
        return state.isProcessing;
      },
      get children() {
        var _el$7 = _$createElement10("box"), _el$8 = _$createElement10("text");
        _$insertNode10(_el$7, _el$8);
        _$setProp10(_el$7, "paddingX", 1);
        _$insert10(_el$8, () => state.status.message || "Processing...");
        _$effect9((_$p) => _$setProp10(_el$8, "color", theme().colors.primary, _$p));
        return _el$7;
      }
    }), null);
    _$effect9((_p$) => {
      var _v$ = theme().colors.border, _v$2 = theme().colors.background, _v$3 = theme().colors.accent, _v$4 = state.isProcessing ? "Processing..." : "Type a message...", _v$5 = theme().colors.foreground, _v$6 = theme().colors.foreground, _v$7 = theme().colors.accent, _v$8 = theme().colors.background;
      _v$ !== _p$.e && (_p$.e = _$setProp10(_el$2, "borderColor", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp10(_el$2, "backgroundColor", _v$2, _p$.t));
      _v$3 !== _p$.a && (_p$.a = _$setProp10(_el$3, "color", _v$3, _p$.a));
      _v$4 !== _p$.o && (_p$.o = _$setProp10(_el$6, "placeholder", _v$4, _p$.o));
      _v$5 !== _p$.i && (_p$.i = _$setProp10(_el$6, "textColor", _v$5, _p$.i));
      _v$6 !== _p$.n && (_p$.n = _$setProp10(_el$6, "focusedTextColor", _v$6, _p$.n));
      _v$7 !== _p$.s && (_p$.s = _$setProp10(_el$6, "cursorColor", _v$7, _p$.s));
      _v$8 !== _p$.h && (_p$.h = _$setProp10(_el$6, "focusedBackgroundColor", _v$8, _p$.h));
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0,
      n: void 0,
      s: void 0,
      h: void 0
    });
    return _el$;
  })();
}
__name(Prompt, "Prompt");

// src/tui/component/todo-item.tsx
import { memo as _$memo9 } from "@opentui/solid";
import { effect as _$effect10 } from "@opentui/solid";
import { createComponent as _$createComponent19 } from "@opentui/solid";
import { insert as _$insert11 } from "@opentui/solid";
import { createTextNode as _$createTextNode10 } from "@opentui/solid";
import { insertNode as _$insertNode11 } from "@opentui/solid";
import { setProp as _$setProp11 } from "@opentui/solid";
import { createElement as _$createElement11 } from "@opentui/solid";
function TodoList(props) {
  const {
    theme
  } = useTheme();
  const completedCount = createMemo(() => props.todos.filter((t) => t.status === "completed").length);
  const progress = createMemo(() => {
    if (props.todos.length === 0) return 0;
    return Math.round(completedCount() / props.todos.length * 100);
  });
  const spinnerFrames = ["\u25D0", "\u25D3", "\u25D1", "\u25D2"];
  const [spinnerIndex, setSpinnerIndex] = createSignal(0);
  createEffect(() => {
    const hasInProgress = props.todos.some((t) => t.status === "in_progress");
    if (hasInProgress) {
      const interval = setInterval(() => {
        setSpinnerIndex((i) => (i + 1) % spinnerFrames.length);
      }, 100);
      onCleanup(() => clearInterval(interval));
    }
  });
  const getStatusIcon = /* @__PURE__ */ __name((status) => {
    switch (status) {
      case "completed":
        return {
          icon: theme().icons.completed,
          color: theme().colors.success
        };
      case "in_progress":
        return {
          icon: spinnerFrames[spinnerIndex()],
          color: theme().colors.warning
        };
      default:
        return {
          icon: theme().icons.pending,
          color: theme().colors.muted
        };
    }
  }, "getStatusIcon");
  return (() => {
    var _el$ = _$createElement11("box"), _el$2 = _$createElement11("box"), _el$3 = _$createElement11("text"), _el$5 = _$createElement11("text"), _el$6 = _$createTextNode10(`/`), _el$7 = _$createTextNode10(` (`), _el$8 = _$createTextNode10(`%)`), _el$9 = _$createElement11("box"), _el$0 = _$createElement11("text"), _el$10 = _$createElement11("text"), _el$11 = _$createElement11("text"), _el$12 = _$createElement11("text");
    _$insertNode11(_el$, _el$2);
    _$insertNode11(_el$, _el$9);
    _$setProp11(_el$, "flexDirection", "column");
    _$setProp11(_el$, "borderStyle", "single");
    _$setProp11(_el$, "marginY", 1);
    _$setProp11(_el$, "padding", 1);
    _$insertNode11(_el$2, _el$3);
    _$insertNode11(_el$2, _el$5);
    _$setProp11(_el$2, "flexDirection", "row");
    _$setProp11(_el$2, "justifyContent", "space-between");
    _$setProp11(_el$2, "marginBottom", 1);
    _$insertNode11(_el$3, _$createTextNode10(`Tasks`));
    _$setProp11(_el$3, "bold", true);
    _$insertNode11(_el$5, _el$6);
    _$insertNode11(_el$5, _el$7);
    _$insertNode11(_el$5, _el$8);
    _$insert11(_el$5, completedCount, _el$6);
    _$insert11(_el$5, () => props.todos.length, _el$7);
    _$insert11(_el$5, progress, _el$8);
    _$insertNode11(_el$9, _el$0);
    _$insertNode11(_el$9, _el$10);
    _$insertNode11(_el$9, _el$11);
    _$insertNode11(_el$9, _el$12);
    _$setProp11(_el$9, "marginBottom", 1);
    _$insertNode11(_el$0, _$createTextNode10(`[`));
    _$insert11(_el$10, () => "\u2588".repeat(Math.floor(progress() / 5)));
    _$insert11(_el$11, () => "\u2591".repeat(20 - Math.floor(progress() / 5)));
    _$insertNode11(_el$12, _$createTextNode10(`]`));
    _$insert11(_el$, _$createComponent19(For, {
      get each() {
        return props.todos;
      },
      children: /* @__PURE__ */ __name((todo) => {
        const status = getStatusIcon(todo.status);
        return (() => {
          var _el$14 = _$createElement11("box"), _el$15 = _$createElement11("text"), _el$16 = _$createTextNode10(` `), _el$17 = _$createElement11("text");
          _$insertNode11(_el$14, _el$15);
          _$insertNode11(_el$14, _el$17);
          _$setProp11(_el$14, "flexDirection", "row");
          _$insertNode11(_el$15, _el$16);
          _$insert11(_el$15, () => status.icon, _el$16);
          _$setProp11(_el$17, "wrap", "truncate");
          _$insert11(_el$17, (() => {
            var _c$ = _$memo9(() => !!(todo.status === "in_progress" && todo.activeForm));
            return () => _c$() ? todo.activeForm : todo.content;
          })());
          _$effect10((_p$) => {
            var _v$7 = status.color, _v$8 = todo.status === "completed" ? theme().colors.muted : theme().colors.foreground, _v$9 = todo.status === "completed";
            _v$7 !== _p$.e && (_p$.e = _$setProp11(_el$15, "color", _v$7, _p$.e));
            _v$8 !== _p$.t && (_p$.t = _$setProp11(_el$17, "color", _v$8, _p$.t));
            _v$9 !== _p$.a && (_p$.a = _$setProp11(_el$17, "strikethrough", _v$9, _p$.a));
            return _p$;
          }, {
            e: void 0,
            t: void 0,
            a: void 0
          });
          return _el$14;
        })();
      }, "children")
    }), null);
    _$effect10((_p$) => {
      var _v$ = theme().colors.border, _v$2 = theme().colors.muted, _v$3 = theme().colors.muted, _v$4 = theme().colors.success, _v$5 = theme().colors.border, _v$6 = theme().colors.muted;
      _v$ !== _p$.e && (_p$.e = _$setProp11(_el$, "borderColor", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp11(_el$5, "color", _v$2, _p$.t));
      _v$3 !== _p$.a && (_p$.a = _$setProp11(_el$0, "color", _v$3, _p$.a));
      _v$4 !== _p$.o && (_p$.o = _$setProp11(_el$10, "color", _v$4, _p$.o));
      _v$5 !== _p$.i && (_p$.i = _$setProp11(_el$11, "color", _v$5, _p$.i));
      _v$6 !== _p$.n && (_p$.n = _$setProp11(_el$12, "color", _v$6, _p$.n));
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0,
      n: void 0
    });
    return _el$;
  })();
}
__name(TodoList, "TodoList");

// src/tui/ui/dialog.tsx
import { memo as _$memo10 } from "@opentui/solid";
import { createTextNode as _$createTextNode11 } from "@opentui/solid";
import { effect as _$effect11 } from "@opentui/solid";
import { insertNode as _$insertNode12 } from "@opentui/solid";
import { insert as _$insert12 } from "@opentui/solid";
import { setProp as _$setProp12 } from "@opentui/solid";
import { createElement as _$createElement12 } from "@opentui/solid";
import { createComponent as _$createComponent20 } from "@opentui/solid";
function DialogContainer() {
  const {
    current,
    close
  } = useDialog();
  const {
    theme
  } = useTheme();
  return _$createComponent20(Show, {
    get when() {
      return current();
    },
    children: /* @__PURE__ */ __name((config) => (() => {
      var _el$ = _$createElement12("box"), _el$2 = _$createElement12("box"), _el$3 = _$createElement12("box");
      _$insertNode12(_el$, _el$2);
      _$insertNode12(_el$, _el$3);
      _$setProp12(_el$, "position", "absolute");
      _$setProp12(_el$, "top", 0);
      _$setProp12(_el$, "left", 0);
      _$setProp12(_el$, "right", 0);
      _$setProp12(_el$, "bottom", 0);
      _$setProp12(_el$, "justifyContent", "center");
      _$setProp12(_el$, "alignItems", "center");
      _$setProp12(_el$2, "position", "absolute");
      _$setProp12(_el$2, "top", 0);
      _$setProp12(_el$2, "left", 0);
      _$setProp12(_el$2, "right", 0);
      _$setProp12(_el$2, "bottom", 0);
      _$setProp12(_el$2, "backgroundColor", "rgba(0,0,0,0.5)");
      _$setProp12(_el$3, "borderStyle", "double");
      _$setProp12(_el$3, "padding", 2);
      _$setProp12(_el$3, "minWidth", 40);
      _$setProp12(_el$3, "maxWidth", 60);
      _$setProp12(_el$3, "flexDirection", "column");
      _$insert12(_el$3, _$createComponent20(Switch, {
        get children() {
          return [_$createComponent20(Match, {
            get when() {
              return config().type === "confirm";
            },
            get children() {
              return _$createComponent20(ConfirmDialog, {
                get config() {
                  return config();
                }
              });
            }
          }), _$createComponent20(Match, {
            get when() {
              return config().type === "alert";
            },
            get children() {
              return _$createComponent20(AlertDialog, {
                get config() {
                  return config();
                }
              });
            }
          }), _$createComponent20(Match, {
            get when() {
              return config().type === "prompt";
            },
            get children() {
              return _$createComponent20(PromptDialog, {
                get config() {
                  return config();
                }
              });
            }
          }), _$createComponent20(Match, {
            get when() {
              return config().type === "select";
            },
            get children() {
              return _$createComponent20(SelectDialog, {
                get config() {
                  return config();
                }
              });
            }
          })];
        }
      }));
      _$effect11((_p$) => {
        var _v$ = theme().colors.primary, _v$2 = theme().colors.background;
        _v$ !== _p$.e && (_p$.e = _$setProp12(_el$3, "borderColor", _v$, _p$.e));
        _v$2 !== _p$.t && (_p$.t = _$setProp12(_el$3, "backgroundColor", _v$2, _p$.t));
        return _p$;
      }, {
        e: void 0,
        t: void 0
      });
      return _el$;
    })(), "children")
  });
}
__name(DialogContainer, "DialogContainer");
function ConfirmDialog(props) {
  const {
    theme
  } = useTheme();
  const [selected, setSelected] = createSignal("yes");
  const handleConfirm = /* @__PURE__ */ __name(() => {
    if (selected() === "yes") {
      props.config.onConfirm?.();
    } else {
      props.config.onCancel?.();
    }
  }, "handleConfirm");
  return (() => {
    var _el$4 = _$createElement12("box"), _el$6 = _$createElement12("text"), _el$7 = _$createElement12("box"), _el$8 = _$createElement12("box"), _el$9 = _$createElement12("text"), _el$1 = _$createElement12("box"), _el$10 = _$createElement12("text"), _el$12 = _$createElement12("text");
    _$insertNode12(_el$4, _el$6);
    _$insertNode12(_el$4, _el$7);
    _$insertNode12(_el$4, _el$12);
    _$setProp12(_el$4, "flexDirection", "column");
    _$insert12(_el$4, _$createComponent20(Show, {
      get when() {
        return props.config.title;
      },
      get children() {
        var _el$5 = _$createElement12("text");
        _$setProp12(_el$5, "bold", true);
        _$setProp12(_el$5, "marginBottom", 1);
        _$insert12(_el$5, () => props.config.title);
        return _el$5;
      }
    }), _el$6);
    _$setProp12(_el$6, "wrap", "wrap");
    _$setProp12(_el$6, "marginBottom", 2);
    _$insert12(_el$6, () => props.config.message);
    _$insertNode12(_el$7, _el$8);
    _$insertNode12(_el$7, _el$1);
    _$setProp12(_el$7, "flexDirection", "row");
    _$setProp12(_el$7, "gap", 2);
    _$setProp12(_el$7, "justifyContent", "center");
    _$insertNode12(_el$8, _el$9);
    _$setProp12(_el$8, "borderStyle", "single");
    _$setProp12(_el$8, "paddingX", 2);
    _$insertNode12(_el$9, _$createTextNode11(`Yes (y)`));
    _$insertNode12(_el$1, _el$10);
    _$setProp12(_el$1, "borderStyle", "single");
    _$setProp12(_el$1, "paddingX", 2);
    _$insertNode12(_el$10, _$createTextNode11(`No (n)`));
    _$insertNode12(_el$12, _$createTextNode11(`Arrow keys to select, Enter to confirm`));
    _$setProp12(_el$12, "marginTop", 1);
    _$setProp12(_el$12, "textAlign", "center");
    _$effect11((_p$) => {
      var _v$3 = selected() === "yes" ? theme().colors.success : theme().colors.border, _v$4 = selected() === "yes", _v$5 = selected() === "yes" ? theme().colors.success : void 0, _v$6 = selected() === "no" ? theme().colors.error : theme().colors.border, _v$7 = selected() === "no", _v$8 = selected() === "no" ? theme().colors.error : void 0, _v$9 = theme().colors.muted;
      _v$3 !== _p$.e && (_p$.e = _$setProp12(_el$8, "borderColor", _v$3, _p$.e));
      _v$4 !== _p$.t && (_p$.t = _$setProp12(_el$9, "bold", _v$4, _p$.t));
      _v$5 !== _p$.a && (_p$.a = _$setProp12(_el$9, "color", _v$5, _p$.a));
      _v$6 !== _p$.o && (_p$.o = _$setProp12(_el$1, "borderColor", _v$6, _p$.o));
      _v$7 !== _p$.i && (_p$.i = _$setProp12(_el$10, "bold", _v$7, _p$.i));
      _v$8 !== _p$.n && (_p$.n = _$setProp12(_el$10, "color", _v$8, _p$.n));
      _v$9 !== _p$.s && (_p$.s = _$setProp12(_el$12, "color", _v$9, _p$.s));
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0,
      o: void 0,
      i: void 0,
      n: void 0,
      s: void 0
    });
    return _el$4;
  })();
}
__name(ConfirmDialog, "ConfirmDialog");
function AlertDialog(props) {
  const {
    theme
  } = useTheme();
  return (() => {
    var _el$14 = _$createElement12("box"), _el$16 = _$createElement12("text"), _el$17 = _$createElement12("box"), _el$18 = _$createElement12("box"), _el$19 = _$createElement12("text");
    _$insertNode12(_el$14, _el$16);
    _$insertNode12(_el$14, _el$17);
    _$setProp12(_el$14, "flexDirection", "column");
    _$insert12(_el$14, _$createComponent20(Show, {
      get when() {
        return props.config.title;
      },
      get children() {
        var _el$15 = _$createElement12("text");
        _$setProp12(_el$15, "bold", true);
        _$setProp12(_el$15, "marginBottom", 1);
        _$insert12(_el$15, () => props.config.title);
        return _el$15;
      }
    }), _el$16);
    _$setProp12(_el$16, "wrap", "wrap");
    _$setProp12(_el$16, "marginBottom", 2);
    _$insert12(_el$16, () => props.config.message);
    _$insertNode12(_el$17, _el$18);
    _$setProp12(_el$17, "flexDirection", "row");
    _$setProp12(_el$17, "justifyContent", "center");
    _$insertNode12(_el$18, _el$19);
    _$setProp12(_el$18, "borderStyle", "single");
    _$setProp12(_el$18, "paddingX", 3);
    _$insertNode12(_el$19, _$createTextNode11(`OK (Enter)`));
    _$setProp12(_el$19, "bold", true);
    _$effect11((_p$) => {
      var _v$0 = theme().colors.primary, _v$1 = theme().colors.primary;
      _v$0 !== _p$.e && (_p$.e = _$setProp12(_el$18, "borderColor", _v$0, _p$.e));
      _v$1 !== _p$.t && (_p$.t = _$setProp12(_el$19, "color", _v$1, _p$.t));
      return _p$;
    }, {
      e: void 0,
      t: void 0
    });
    return _el$14;
  })();
}
__name(AlertDialog, "AlertDialog");
function PromptDialog(props) {
  const {
    theme
  } = useTheme();
  const [value, setValue] = createSignal(props.config.defaultValue || "");
  const handleSubmit = /* @__PURE__ */ __name(() => {
    props.config.onConfirm?.(value());
  }, "handleSubmit");
  return (() => {
    var _el$21 = _$createElement12("box"), _el$23 = _$createElement12("text"), _el$24 = _$createElement12("box"), _el$25 = _$createElement12("input"), _el$26 = _$createElement12("text");
    _$insertNode12(_el$21, _el$23);
    _$insertNode12(_el$21, _el$24);
    _$insertNode12(_el$21, _el$26);
    _$setProp12(_el$21, "flexDirection", "column");
    _$insert12(_el$21, _$createComponent20(Show, {
      get when() {
        return props.config.title;
      },
      get children() {
        var _el$22 = _$createElement12("text");
        _$setProp12(_el$22, "bold", true);
        _$setProp12(_el$22, "marginBottom", 1);
        _$insert12(_el$22, () => props.config.title);
        return _el$22;
      }
    }), _el$23);
    _$setProp12(_el$23, "wrap", "wrap");
    _$setProp12(_el$23, "marginBottom", 1);
    _$insert12(_el$23, () => props.config.message);
    _$insertNode12(_el$24, _el$25);
    _$setProp12(_el$24, "borderStyle", "single");
    _$setProp12(_el$24, "padding", 1);
    _$setProp12(_el$25, "onInput", (nextValue) => setValue(nextValue));
    _$setProp12(_el$25, "onSubmit", handleSubmit);
    _$setProp12(_el$25, "focused", true);
    _$setProp12(_el$25, "flexGrow", 1);
    _$insertNode12(_el$26, _$createTextNode11(`Enter to submit, Esc to cancel`));
    _$setProp12(_el$26, "marginTop", 1);
    _$effect11((_p$) => {
      var _v$10 = theme().colors.primary, _v$11 = value(), _v$12 = theme().colors.muted;
      _v$10 !== _p$.e && (_p$.e = _$setProp12(_el$24, "borderColor", _v$10, _p$.e));
      _v$11 !== _p$.t && (_p$.t = _$setProp12(_el$25, "value", _v$11, _p$.t));
      _v$12 !== _p$.a && (_p$.a = _$setProp12(_el$26, "color", _v$12, _p$.a));
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    });
    return _el$21;
  })();
}
__name(PromptDialog, "PromptDialog");
function SelectDialog(props) {
  const {
    theme
  } = useTheme();
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const options = /* @__PURE__ */ __name(() => props.config.options || [], "options");
  const handleSelect = /* @__PURE__ */ __name(() => {
    const option = options()[selectedIndex()];
    if (option) {
      props.config.onConfirm?.(option.value);
    }
  }, "handleSelect");
  return (() => {
    var _el$28 = _$createElement12("box"), _el$31 = _$createElement12("box"), _el$32 = _$createElement12("text");
    _$insertNode12(_el$28, _el$31);
    _$insertNode12(_el$28, _el$32);
    _$setProp12(_el$28, "flexDirection", "column");
    _$insert12(_el$28, _$createComponent20(Show, {
      get when() {
        return props.config.title;
      },
      get children() {
        var _el$29 = _$createElement12("text");
        _$setProp12(_el$29, "bold", true);
        _$setProp12(_el$29, "marginBottom", 1);
        _$insert12(_el$29, () => props.config.title);
        return _el$29;
      }
    }), _el$31);
    _$insert12(_el$28, _$createComponent20(Show, {
      get when() {
        return props.config.message;
      },
      get children() {
        var _el$30 = _$createElement12("text");
        _$setProp12(_el$30, "wrap", "wrap");
        _$setProp12(_el$30, "marginBottom", 1);
        _$insert12(_el$30, () => props.config.message);
        return _el$30;
      }
    }), _el$31);
    _$setProp12(_el$31, "flexDirection", "column");
    _$setProp12(_el$31, "marginY", 1);
    _$insert12(_el$31, _$createComponent20(For, {
      get each() {
        return options();
      },
      children: /* @__PURE__ */ __name((option, index) => (() => {
        var _el$34 = _$createElement12("box"), _el$35 = _$createElement12("text"), _el$36 = _$createTextNode11(` `);
        _$insertNode12(_el$34, _el$35);
        _$setProp12(_el$34, "paddingX", 1);
        _$insertNode12(_el$35, _el$36);
        _$insert12(_el$35, (() => {
          var _c$ = _$memo10(() => index() === selectedIndex());
          return () => _c$() ? theme().icons.arrow : " ";
        })(), _el$36);
        _$insert12(_el$35, () => option.label, null);
        _$effect11((_p$) => {
          var _v$13 = index() === selectedIndex() ? theme().colors.accent : void 0, _v$14 = index() === selectedIndex() ? theme().colors.background : theme().colors.foreground, _v$15 = index() === selectedIndex();
          _v$13 !== _p$.e && (_p$.e = _$setProp12(_el$34, "backgroundColor", _v$13, _p$.e));
          _v$14 !== _p$.t && (_p$.t = _$setProp12(_el$35, "color", _v$14, _p$.t));
          _v$15 !== _p$.a && (_p$.a = _$setProp12(_el$35, "bold", _v$15, _p$.a));
          return _p$;
        }, {
          e: void 0,
          t: void 0,
          a: void 0
        });
        return _el$34;
      })(), "children")
    }));
    _$insertNode12(_el$32, _$createTextNode11(`Arrow keys to navigate, Enter to select, Esc to cancel`));
    _$effect11((_$p) => _$setProp12(_el$32, "color", theme().colors.muted, _$p));
    return _el$28;
  })();
}
__name(SelectDialog, "SelectDialog");

// src/tui/ui/toast.tsx
import { createTextNode as _$createTextNode12 } from "@opentui/solid";
import { effect as _$effect12 } from "@opentui/solid";
import { insertNode as _$insertNode13 } from "@opentui/solid";
import { insert as _$insert13 } from "@opentui/solid";
import { createComponent as _$createComponent21 } from "@opentui/solid";
import { setProp as _$setProp13 } from "@opentui/solid";
import { createElement as _$createElement13 } from "@opentui/solid";
function ToastContainer() {
  const {
    toasts
  } = useToast();
  const {
    theme
  } = useTheme();
  return _$createComponent21(Show, {
    get when() {
      return toasts().length > 0;
    },
    get children() {
      var _el$ = _$createElement13("box");
      _$setProp13(_el$, "position", "absolute");
      _$setProp13(_el$, "bottom", 2);
      _$setProp13(_el$, "right", 2);
      _$setProp13(_el$, "flexDirection", "column");
      _$setProp13(_el$, "gap", 1);
      _$insert13(_el$, _$createComponent21(For, {
        get each() {
          return toasts();
        },
        children: /* @__PURE__ */ __name((toast) => _$createComponent21(ToastItem, {
          toast
        }), "children")
      }));
      return _el$;
    }
  });
}
__name(ToastContainer, "ToastContainer");
function ToastItem(props) {
  const {
    theme
  } = useTheme();
  const {
    dismiss
  } = useToast();
  const getToastStyle = /* @__PURE__ */ __name((type) => {
    switch (type) {
      case "success":
        return {
          icon: theme().icons.success,
          color: theme().colors.success,
          borderColor: theme().colors.success
        };
      case "error":
        return {
          icon: theme().icons.error,
          color: theme().colors.error,
          borderColor: theme().colors.error
        };
      case "warning":
        return {
          icon: theme().icons.warning,
          color: theme().colors.warning,
          borderColor: theme().colors.warning
        };
      default:
        return {
          icon: theme().icons.info,
          color: theme().colors.info,
          borderColor: theme().colors.info
        };
    }
  }, "getToastStyle");
  const style = createMemo(() => getToastStyle(props.toast.type));
  return (() => {
    var _el$2 = _$createElement13("box"), _el$3 = _$createElement13("box"), _el$4 = _$createElement13("text"), _el$5 = _$createElement13("text");
    _$insertNode13(_el$2, _el$3);
    _$setProp13(_el$2, "borderStyle", "single");
    _$setProp13(_el$2, "paddingX", 2);
    _$setProp13(_el$2, "paddingY", 1);
    _$setProp13(_el$2, "minWidth", 30);
    _$setProp13(_el$2, "maxWidth", 50);
    _$insertNode13(_el$3, _el$4);
    _$insertNode13(_el$3, _el$5);
    _$setProp13(_el$3, "flexDirection", "row");
    _$setProp13(_el$3, "gap", 1);
    _$insert13(_el$4, () => style().icon);
    _$setProp13(_el$5, "wrap", "wrap");
    _$insert13(_el$5, () => props.toast.message);
    _$insert13(_el$2, _$createComponent21(Show, {
      get when() {
        return props.toast.action;
      },
      children: /* @__PURE__ */ __name((action) => (() => {
        var _el$6 = _$createElement13("box"), _el$7 = _$createElement13("text"), _el$8 = _$createTextNode12(`[`), _el$9 = _$createTextNode12(`]`);
        _$insertNode13(_el$6, _el$7);
        _$setProp13(_el$6, "marginTop", 1);
        _$insertNode13(_el$7, _el$8);
        _$insertNode13(_el$7, _el$9);
        _$setProp13(_el$7, "bold", true);
        _$insert13(_el$7, () => action().label, _el$9);
        _$effect12((_$p) => _$setProp13(_el$7, "color", theme().colors.accent, _$p));
        return _el$6;
      })(), "children")
    }), null);
    _$effect12((_p$) => {
      var _v$ = style().borderColor, _v$2 = theme().colors.background, _v$3 = style().color;
      _v$ !== _p$.e && (_p$.e = _$setProp13(_el$2, "borderColor", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp13(_el$2, "backgroundColor", _v$2, _p$.t));
      _v$3 !== _p$.a && (_p$.a = _$setProp13(_el$4, "color", _v$3, _p$.a));
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    });
    return _el$2;
  })();
}
__name(ToastItem, "ToastItem");

// src/tui/routes/session/index.tsx
function Session() {
  const {
    theme
  } = useTheme();
  const {
    state
  } = useSync();
  const {
    processInput
  } = useAgent();
  const dialog = useDialog();
  const [showSidebar, setShowSidebar] = createSignal(false);
  const [expandedOutputId, setExpandedOutputId] = createSignal(null);
  const handleSubmit = /* @__PURE__ */ __name(async (input) => {
    if (!input.trim()) return;
    try {
      await processInput(input);
    } catch (error) {
    }
  }, "handleSubmit");
  return (() => {
    var _el$ = _$createElement14("box"), _el$2 = _$createElement14("box"), _el$3 = _$createElement14("box"), _el$4 = _$createElement14("box");
    _$insertNode14(_el$, _el$2);
    _$setProp14(_el$, "flexDirection", "column");
    _$setProp14(_el$, "flexGrow", 1);
    _$insert14(_el$, _$createComponent22(Header, {}), _el$2);
    _$insertNode14(_el$2, _el$3);
    _$setProp14(_el$2, "flexDirection", "row");
    _$setProp14(_el$2, "flexGrow", 1);
    _$insertNode14(_el$3, _el$4);
    _$setProp14(_el$3, "flexDirection", "column");
    _$setProp14(_el$3, "flexGrow", 1);
    _$setProp14(_el$4, "flexGrow", 1);
    _$setProp14(_el$4, "overflow", "scroll");
    _$insert14(_el$4, _$createComponent22(Messages, {
      get expandedOutputId() {
        return expandedOutputId();
      }
    }));
    _$insert14(_el$3, _$createComponent22(Show, {
      get when() {
        return state.todos.length > 0;
      },
      get children() {
        return _$createComponent22(TodoList, {
          get todos() {
            return state.todos;
          }
        });
      }
    }), null);
    _$insert14(_el$3, _$createComponent22(Prompt, {
      onSubmit: handleSubmit
    }), null);
    _$insert14(_el$2, _$createComponent22(Show, {
      get when() {
        return showSidebar();
      },
      get children() {
        return _$createComponent22(Sidebar, {});
      }
    }), null);
    _$insert14(_el$, _$createComponent22(Footer, {}), null);
    _$insert14(_el$, _$createComponent22(Show, {
      get when() {
        return dialog.isOpen();
      },
      get children() {
        return _$createComponent22(DialogContainer, {});
      }
    }), null);
    _$insert14(_el$, _$createComponent22(ToastContainer, {}), null);
    return _el$;
  })();
}
__name(Session, "Session");

// src/tui/app.tsx
function Providers(props) {
  return _$createComponent23(ExitProvider, {
    get onExit() {
      return props.onExit;
    },
    get children() {
      return _$createComponent23(ThemeProvider, {
        get isDarkMode() {
          return props.isDarkMode;
        },
        get children() {
          return _$createComponent23(KeybindProvider, {
            get children() {
              return _$createComponent23(AgentProvider, {
                get agent() {
                  return props.agent;
                },
                get children() {
                  return _$createComponent23(SyncProvider, {
                    get children() {
                      return _$createComponent23(RouteProvider, {
                        get children() {
                          return _$createComponent23(DialogProvider, {
                            get children() {
                              return _$createComponent23(CommandProvider, {
                                get children() {
                                  return _$createComponent23(PromptProvider, {
                                    get children() {
                                      return _$createComponent23(ToastProvider, {
                                        get children() {
                                          return props.children;
                                        }
                                      });
                                    }
                                  });
                                }
                              });
                            }
                          });
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
}
__name(Providers, "Providers");
function Router() {
  const route = useRoute();
  return _$createComponent23(Show, {
    get when() {
      return route.current() === "session";
    },
    get fallback() {
      return _$createComponent23(Home, {});
    },
    get children() {
      return _$createComponent23(Session, {});
    }
  });
}
__name(Router, "Router");
function AppContent() {
  const dimensions = useTerminalDimensions();
  const renderer = useRenderer2();
  const {
    theme
  } = useTheme();
  renderer.disableStdoutInterception();
  return (() => {
    var _el$ = _$createElement15("box");
    _$setProp15(_el$, "flexDirection", "column");
    _$insert15(_el$, _$createComponent23(Router, {}));
    _$effect13((_p$) => {
      var _v$ = dimensions().width, _v$2 = dimensions().height, _v$3 = theme().colors.background;
      _v$ !== _p$.e && (_p$.e = _$setProp15(_el$, "width", _v$, _p$.e));
      _v$2 !== _p$.t && (_p$.t = _$setProp15(_el$, "height", _v$2, _p$.t));
      _v$3 !== _p$.a && (_p$.a = _$setProp15(_el$, "backgroundColor", _v$3, _p$.a));
      return _p$;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    });
    return _el$;
  })();
}
__name(AppContent, "AppContent");
function App(props) {
  return _$createComponent23(Providers, {
    get agent() {
      return props.agent;
    },
    get isDarkMode() {
      return props.isDarkMode;
    },
    get onExit() {
      return props.onExit;
    },
    get children() {
      return _$createComponent23(AppContent, {});
    }
  });
}
__name(App, "App");

// src/tui/entry.ts
async function startTUI(options) {
  const { agent, onExit } = options;
  const isDarkMode = await detectTerminalBackground();
  return new Promise((resolve) => {
    const handleExit = /* @__PURE__ */ __name(async () => {
      onExit?.();
      resolve();
    }, "handleExit");
    render(
      () => App({ agent, isDarkMode, onExit: handleExit }),
      {
        targetFps: 60,
        gatherStats: false,
        exitOnCtrlC: false,
        // We handle Ctrl+C ourselves
        useKittyKeyboard: {},
        // Enable kitty keyboard protocol for better key handling
        onDestroy: /* @__PURE__ */ __name(() => {
          handleExit();
        }, "onDestroy")
      }
    );
  });
}
__name(startTUI, "startTUI");
async function detectTerminalBackground() {
  if (!process.stdin.isTTY) return true;
  return new Promise((resolve) => {
    let timeout;
    const cleanup = /* @__PURE__ */ __name(() => {
      process.stdin.setRawMode(false);
      process.stdin.removeListener("data", handler);
      clearTimeout(timeout);
    }, "cleanup");
    const handler = /* @__PURE__ */ __name((data) => {
      const str = data.toString();
      const match = str.match(/\x1b]11;([^\x07\x1b]+)/);
      if (match) {
        cleanup();
        const color = match[1];
        let r = 0, g = 0, b = 0;
        if (color.startsWith("rgb:")) {
          const parts = color.substring(4).split("/");
          r = parseInt(parts[0], 16) >> 8;
          g = parseInt(parts[1], 16) >> 8;
          b = parseInt(parts[2], 16) >> 8;
        } else if (color.startsWith("#")) {
          r = parseInt(color.substring(1, 3), 16);
          g = parseInt(color.substring(3, 5), 16);
          b = parseInt(color.substring(5, 7), 16);
        }
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        resolve(luminance <= 0.5);
      }
    }, "handler");
    process.stdin.setRawMode(true);
    process.stdin.on("data", handler);
    process.stdout.write("\x1B]11;?\x07");
    timeout = setTimeout(() => {
      cleanup();
      resolve(true);
    }, 500);
  });
}
__name(detectTerminalBackground, "detectTerminalBackground");
export {
  startTUI
};
//# sourceMappingURL=entry.js.map
