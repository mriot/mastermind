
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.37.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/common/Button.svelte generated by Svelte v3.37.0 */

    const file$7 = "src/common/Button.svelte";

    function create_fragment$7(ctx) {
    	let button;
    	let t;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*label*/ ctx[0]);
    			attr_dev(button, "class", "svelte-ntrkbm");
    			add_location(button, file$7, 4, 0, 55);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*label*/ 1) set_data_dev(t, /*label*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, []);
    	let { label = "[No Value]" } = $$props;
    	const writable_props = ["label"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("label" in $$props) $$invalidate(0, label = $$props.label);
    	};

    	$$self.$capture_state = () => ({ label });

    	$$self.$inject_state = $$props => {
    		if ("label" in $$props) $$invalidate(0, label = $$props.label);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [label];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { label: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get label() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /*
    Adapted from https://github.com/mattdesl
    Distributed under MIT License https://github.com/mattdesl/eases/blob/master/LICENSE.md
    */
    function backInOut(t) {
        const s = 1.70158 * 1.525;
        if ((t *= 2) < 1)
            return 0.5 * (t * t * ((s + 1) * t - s));
        return 0.5 * ((t -= 2) * t * ((s + 1) * t + s) + 2);
    }
    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }

    /* src/ColorPicker.svelte generated by Svelte v3.37.0 */
    const file$6 = "src/ColorPicker.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (31:4) {#each colorsL as color, i}
    function create_each_block_1$1(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[3](/*color*/ ctx[5]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "picker-item svelte-12psw1w");
    			set_style(div, "background-color", /*color*/ ctx[5].value);
    			add_location(div, file$6, 31, 6, 626);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(31:4) {#each colorsL as color, i}",
    		ctx
    	});

    	return block;
    }

    // (49:4) {#each colorsR as color, i}
    function create_each_block$2(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[4](/*color*/ ctx[5]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "picker-item svelte-12psw1w");
    			set_style(div, "background-color", /*color*/ ctx[5].value);
    			add_location(div, file$6, 49, 6, 971);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(49:4) {#each colorsR as color, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div2;
    	let div0;
    	let div0_intro;
    	let div0_outro;
    	let t;
    	let div1;
    	let div1_intro;
    	let div1_outro;
    	let current;
    	let each_value_1 = /*colorsL*/ ctx[1];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = /*colorsR*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "container left svelte-12psw1w");
    			add_location(div0, file$6, 20, 2, 446);
    			attr_dev(div1, "class", "container right svelte-12psw1w");
    			add_location(div1, file$6, 38, 2, 789);
    			add_location(div2, file$6, 19, 0, 438);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			append_dev(div2, t);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*colorsL, selectedColor*/ 3) {
    				each_value_1 = /*colorsL*/ ctx[1];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*colorsR, selectedColor*/ 5) {
    				each_value = /*colorsR*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div0_outro) div0_outro.end(1);

    				if (!div0_intro) div0_intro = create_in_transition(div0, fly, {
    					x: 25,
    					opacity: 0,
    					delay: 0,
    					easing: backInOut
    				});

    				div0_intro.start();
    			});

    			add_render_callback(() => {
    				if (div1_outro) div1_outro.end(1);

    				if (!div1_intro) div1_intro = create_in_transition(div1, fly, {
    					x: -25,
    					opacity: 0,
    					delay: 0,
    					easing: backInOut
    				});

    				div1_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div0_intro) div0_intro.invalidate();
    			div0_outro = create_out_transition(div0, scale, {});
    			if (div1_intro) div1_intro.invalidate();
    			div1_outro = create_out_transition(div1, scale, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching && div0_outro) div0_outro.end();
    			destroy_each(each_blocks, detaching);
    			if (detaching && div1_outro) div1_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ColorPicker", slots, []);
    	let { selectedColor } = $$props;

    	const colorsL = [
    		{ name: "red", value: "#ff0000" },
    		{ name: "green", value: "#00ff34" },
    		{ name: "purple", value: "#7400ff" }
    	];

    	const colorsR = [
    		{ name: "blue", value: "#00dbff" },
    		{ name: "yellow", value: "#ffd700" },
    		{ name: "pink", value: "#ff00d7" }
    	];

    	const writable_props = ["selectedColor"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ColorPicker> was created with unknown prop '${key}'`);
    	});

    	const click_handler = color => $$invalidate(0, selectedColor = color);
    	const click_handler_1 = color => $$invalidate(0, selectedColor = color);

    	$$self.$$set = $$props => {
    		if ("selectedColor" in $$props) $$invalidate(0, selectedColor = $$props.selectedColor);
    	};

    	$$self.$capture_state = () => ({
    		backInOut,
    		scale,
    		fly,
    		selectedColor,
    		colorsL,
    		colorsR
    	});

    	$$self.$inject_state = $$props => {
    		if ("selectedColor" in $$props) $$invalidate(0, selectedColor = $$props.selectedColor);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selectedColor, colorsL, colorsR, click_handler, click_handler_1];
    }

    class ColorPicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { selectedColor: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ColorPicker",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*selectedColor*/ ctx[0] === undefined && !("selectedColor" in props)) {
    			console.warn("<ColorPicker> was created without expected prop 'selectedColor'");
    		}
    	}

    	get selectedColor() {
    		throw new Error("<ColorPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedColor(value) {
    		throw new Error("<ColorPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /** Dispatch event on click outside of node */
    function clickOutside(node) {
      
      const handleClick = event => {
        if (node && !node.contains(event.target) && !event.defaultPrevented) {
          node.dispatchEvent(new CustomEvent("clickoutside", node));
        }
      };

    	document.addEventListener("click", handleClick, true);
      
      return {
        destroy() {
          document.removeEventListener("click", handleClick, true);
        }
    	}
    }

    /* src/ColorButton.svelte generated by Svelte v3.37.0 */
    const file$5 = "src/ColorButton.svelte";

    // (18:2) {#if pickerOpen && active}
    function create_if_block(ctx) {
    	let colorpicker;
    	let updating_selectedColor;
    	let current;

    	function colorpicker_selectedColor_binding(value) {
    		/*colorpicker_selectedColor_binding*/ ctx[3](value);
    	}

    	let colorpicker_props = {};

    	if (/*selectedColor*/ ctx[0] !== void 0) {
    		colorpicker_props.selectedColor = /*selectedColor*/ ctx[0];
    	}

    	colorpicker = new ColorPicker({ props: colorpicker_props, $$inline: true });
    	binding_callbacks.push(() => bind(colorpicker, "selectedColor", colorpicker_selectedColor_binding));

    	const block = {
    		c: function create() {
    			create_component(colorpicker.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(colorpicker, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const colorpicker_changes = {};

    			if (!updating_selectedColor && dirty & /*selectedColor*/ 1) {
    				updating_selectedColor = true;
    				colorpicker_changes.selectedColor = /*selectedColor*/ ctx[0];
    				add_flush_callback(() => updating_selectedColor = false);
    			}

    			colorpicker.$set(colorpicker_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(colorpicker.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(colorpicker.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(colorpicker, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(18:2) {#if pickerOpen && active}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*pickerOpen*/ ctx[1] && /*active*/ ctx[2] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "color-button svelte-12vzuqx");
    			set_style(div, "background-color", /*selectedColor*/ ctx[0].value);
    			toggle_class(div, "inactive", !/*active*/ ctx[2]);
    			add_location(div, file$5, 9, 0, 223);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(clickOutside.call(null, div)),
    					listen_dev(div, "click", /*click_handler*/ ctx[4], false, false, false),
    					listen_dev(div, "clickoutside", /*clickoutside_handler*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*pickerOpen*/ ctx[1] && /*active*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*pickerOpen, active*/ 6) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*selectedColor*/ 1) {
    				set_style(div, "background-color", /*selectedColor*/ ctx[0].value);
    			}

    			if (dirty & /*active*/ 4) {
    				toggle_class(div, "inactive", !/*active*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ColorButton", slots, []);
    	let { active = false } = $$props;
    	let { selectedColor = "" } = $$props;
    	let { pickerOpen = false } = $$props;
    	const writable_props = ["active", "selectedColor", "pickerOpen"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ColorButton> was created with unknown prop '${key}'`);
    	});

    	function colorpicker_selectedColor_binding(value) {
    		selectedColor = value;
    		$$invalidate(0, selectedColor);
    	}

    	const click_handler = () => $$invalidate(1, pickerOpen = !pickerOpen);
    	const clickoutside_handler = () => $$invalidate(1, pickerOpen = false);

    	$$self.$$set = $$props => {
    		if ("active" in $$props) $$invalidate(2, active = $$props.active);
    		if ("selectedColor" in $$props) $$invalidate(0, selectedColor = $$props.selectedColor);
    		if ("pickerOpen" in $$props) $$invalidate(1, pickerOpen = $$props.pickerOpen);
    	};

    	$$self.$capture_state = () => ({
    		ColorPicker,
    		clickOutside,
    		active,
    		selectedColor,
    		pickerOpen
    	});

    	$$self.$inject_state = $$props => {
    		if ("active" in $$props) $$invalidate(2, active = $$props.active);
    		if ("selectedColor" in $$props) $$invalidate(0, selectedColor = $$props.selectedColor);
    		if ("pickerOpen" in $$props) $$invalidate(1, pickerOpen = $$props.pickerOpen);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		selectedColor,
    		pickerOpen,
    		active,
    		colorpicker_selectedColor_binding,
    		click_handler,
    		clickoutside_handler
    	];
    }

    class ColorButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			active: 2,
    			selectedColor: 0,
    			pickerOpen: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ColorButton",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get active() {
    		throw new Error("<ColorButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<ColorButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedColor() {
    		throw new Error("<ColorButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedColor(value) {
    		throw new Error("<ColorButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pickerOpen() {
    		throw new Error("<ColorButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pickerOpen(value) {
    		throw new Error("<ColorButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/GuessInfo.svelte generated by Svelte v3.37.0 */

    const file$4 = "src/GuessInfo.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (14:2) {#each Array(rightColorsPins) as _}
    function create_each_block_2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "pin right-color svelte-1f05xg2");
    			add_location(div, file$4, 14, 4, 266);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(14:2) {#each Array(rightColorsPins) as _}",
    		ctx
    	});

    	return block;
    }

    // (17:2) {#each Array(rightGuessPins) as _}
    function create_each_block_1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "pin right-guess svelte-1f05xg2");
    			add_location(div, file$4, 17, 4, 349);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(17:2) {#each Array(rightGuessPins) as _}",
    		ctx
    	});

    	return block;
    }

    // (20:2) {#each Array(4 - rightColorsPins - rightGuessPins) as _}
    function create_each_block$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "pin svelte-1f05xg2");
    			add_location(div, file$4, 20, 4, 454);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(20:2) {#each Array(4 - rightColorsPins - rightGuessPins) as _}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let each_value_2 = Array(/*rightColorsPins*/ ctx[1]);
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = Array(/*rightGuessPins*/ ctx[0]);
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = Array(4 - /*rightColorsPins*/ ctx[1] - /*rightGuessPins*/ ctx[0]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t0 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "id", "wrapper");
    			attr_dev(div, "class", "svelte-1f05xg2");
    			add_location(div, file$4, 12, 0, 205);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(div, null);
    			}

    			append_dev(div, t0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div, null);
    			}

    			append_dev(div, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*rightColorsPins*/ 2) {
    				const old_length = each_value_2.length;
    				each_value_2 = Array(/*rightColorsPins*/ ctx[1]);
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = old_length; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (!each_blocks_2[i]) {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(div, t0);
    					}
    				}

    				for (i = each_value_2.length; i < old_length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (dirty & /*rightGuessPins*/ 1) {
    				const old_length = each_value_1.length;
    				each_value_1 = Array(/*rightGuessPins*/ ctx[0]);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = old_length; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (!each_blocks_1[i]) {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div, t1);
    					}
    				}

    				for (i = each_value_1.length; i < old_length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*rightColorsPins, rightGuessPins*/ 3) {
    				const old_length = each_value.length;
    				each_value = Array(4 - /*rightColorsPins*/ ctx[1] - /*rightGuessPins*/ ctx[0]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = old_length; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (!each_blocks[i]) {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (i = each_value.length; i < old_length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("GuessInfo", slots, []);
    	let { result = {} } = $$props;
    	let rightGuessPins = 0;
    	let rightColorsPins = 0;
    	const writable_props = ["result"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GuessInfo> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("result" in $$props) $$invalidate(2, result = $$props.result);
    	};

    	$$self.$capture_state = () => ({ result, rightGuessPins, rightColorsPins });

    	$$self.$inject_state = $$props => {
    		if ("result" in $$props) $$invalidate(2, result = $$props.result);
    		if ("rightGuessPins" in $$props) $$invalidate(0, rightGuessPins = $$props.rightGuessPins);
    		if ("rightColorsPins" in $$props) $$invalidate(1, rightColorsPins = $$props.rightColorsPins);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*result*/ 4) {
    			{
    				$$invalidate(0, rightGuessPins = result.rightGuesses ?? 0);
    				$$invalidate(1, rightColorsPins = result.goodColors ?? 0);
    			}
    		}
    	};

    	return [rightGuessPins, rightColorsPins, result];
    }

    class GuessInfo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { result: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GuessInfo",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get result() {
    		throw new Error("<GuessInfo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set result(value) {
    		throw new Error("<GuessInfo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    class Game {
      constructor() {
        this.CODE = [];
        this.COLORS = ["red", "green", "blue", "yellow", "purple", "pink"];
        console.log("Game created");
      }

      start() {
        // start a game session
        for (let i = 0; i < 4; i++) {
          this.CODE.push(this.COLORS[Math.floor(Math.random() * this.COLORS.length)]);
        }
        console.log("CODE", this.CODE);
      }

      pause() {
        console.log("Game paused");
      }

      win() {
        alert("Good Job!");
      }

      gameover() {
        alert("Maybe next time :)");
      }

      /**
       * 
       * @param {ARRAY} guess 
       */
      validateGuess(guess) {
        // // ! DEV ==================
        // guess = [];
        // for (let i = 0; i < 4; i++) {
        //   guess.push(this.COLORS[Math.floor(Math.random() * this.COLORS.length)]);
        // }
        // // ! DEV ==================
        
        console.log("GUESS", guess);

    /* 
        const test2 = guess.reduce((acc, color, index) => {
          console.log("\n -> ", color, "- position", index);
          if (color === this.CODE[index]) {
            acc[0]++;
            acc[2].push(index);
            console.log(`MATCH for ${color} at index ${index}`);
          } else if (this.CODE.includes(color)) {
            const i = this.CODE.findIndex((val) => val === color);
            console.log(`found ${color} at position ${i} in CODE`);
            
            if (acc[2].includes(i)) {
              console.log(`CODE: "${this.CODE[i]}" with index ${i} was already used`);
              return acc;
            }

            if (guess[i] !== this.CODE[i]) {
              console.log(`"${guess[i]}" and "${this.CODE[i]}" IS NO MATCH -> gud color`);
              acc[1]++;
              acc[2].push(i);
            } else {
              console.log(color, "is a match at", i, "-> skip");
            }
          } else {
            console.log(color, "at position", index, "is not in CODE");
          }

          return acc;
        }, [0, 0, []])
     */


        // TODO: tidy up -> Currently in "debug mode" just in case
        console.groupCollapsed("GUESS VALIDATOR");
        const validationResult = guess.reduce((acc, color, index) => {
          console.log("\n -> ", color, "- position", index);

          if (color === this.CODE[index]) {
            acc.rightGuesses++;
            acc._processedItems.push(index);
            console.log(`MATCH for ${color} at index ${index}`);
          } else if (this.CODE.includes(color)) {
            const i = this.CODE.findIndex((val) => val === color);
            console.log(`found ${color} at position ${i} in CODE`);
            
            if (acc._processedItems.includes(i)) {
              console.log(`CODE: "${this.CODE[i]}" with index ${i} was already used`);
              // remove "_processedItems" as its only used internally
              if (index + 1 === guess.length) {
                delete acc._processedItems;
              }
              return acc;
            }

            if (guess[i] !== this.CODE[i]) {
              console.log(`"${guess[i]}" and "${this.CODE[i]}" IS NO MATCH -> gud color`);
              acc.goodColors++;
              acc._processedItems.push(i);
            } else {
              console.log(color, "is a match at", i, "-> skip");
            }
          } else {
            console.log(color, "at position", index, "is not in CODE");
          }

          // remove "_processedItems" as its only used internally
          if (index + 1 === guess.length) {
            delete acc._processedItems;
          }

          return acc;
        }, { rightGuesses: 0, goodColors: 0, _processedItems: [] });
        
        console.log(validationResult);
        console.groupEnd("GUESS VALIDATOR");




    /* 
        const test = [];
        guess.forEach((element, index) => {
          test.push([this.CODE[index], element])
        });
        // console.log("original", test);

        const res = test.reduce((acc, value, index) => {
          if (value[0] === value[1]) {
            
          } else if (this.CODE.includes(value)) {

          }

          return acc;
        }, [0, 0])
     */
        // console.log("result", test, res);






    /* 
        const nonMatches = guess.filter((color, index) => color !== this.CODE[index]);
        const matches = this.CODE.length - nonMatches.length;
        // console.log(nonMatches);
        // console.log("matches", matches);

        // const gudColors = this.CODE.filter((color, index) => {
        //   return nonMatches.includes(color) && color !== guess[index];
        // });

        const gudColors = nonMatches.filter((color, index) => {
          return this.CODE.includes(color) && nonMatches[index] !== this.CODE[index];
        });
        // console.log("gudColors", gudColors);
     */
        
        return validationResult;
      }
    }

    const currentStep = writable(0);

    const game = writable(new Game());

    /* src/Gamerow.svelte generated by Svelte v3.37.0 */

    const { console: console_1 } = globals;
    const file$3 = "src/Gamerow.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let aside0;
    	let t0;
    	let t1;
    	let main;
    	let colorbutton0;
    	let updating_selectedColor;
    	let t2;
    	let colorbutton1;
    	let updating_selectedColor_1;
    	let t3;
    	let colorbutton2;
    	let updating_selectedColor_2;
    	let t4;
    	let colorbutton3;
    	let updating_selectedColor_3;
    	let t5;
    	let aside1;
    	let guessinfo;
    	let current;

    	function colorbutton0_selectedColor_binding(value) {
    		/*colorbutton0_selectedColor_binding*/ ctx[8](value);
    	}

    	let colorbutton0_props = { active: /*active*/ ctx[1] };

    	if (/*color1*/ ctx[2] !== void 0) {
    		colorbutton0_props.selectedColor = /*color1*/ ctx[2];
    	}

    	colorbutton0 = new ColorButton({
    			props: colorbutton0_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(colorbutton0, "selectedColor", colorbutton0_selectedColor_binding));

    	function colorbutton1_selectedColor_binding(value) {
    		/*colorbutton1_selectedColor_binding*/ ctx[9](value);
    	}

    	let colorbutton1_props = { active: /*active*/ ctx[1] };

    	if (/*color2*/ ctx[3] !== void 0) {
    		colorbutton1_props.selectedColor = /*color2*/ ctx[3];
    	}

    	colorbutton1 = new ColorButton({
    			props: colorbutton1_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(colorbutton1, "selectedColor", colorbutton1_selectedColor_binding));

    	function colorbutton2_selectedColor_binding(value) {
    		/*colorbutton2_selectedColor_binding*/ ctx[10](value);
    	}

    	let colorbutton2_props = { active: /*active*/ ctx[1] };

    	if (/*color3*/ ctx[4] !== void 0) {
    		colorbutton2_props.selectedColor = /*color3*/ ctx[4];
    	}

    	colorbutton2 = new ColorButton({
    			props: colorbutton2_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(colorbutton2, "selectedColor", colorbutton2_selectedColor_binding));

    	function colorbutton3_selectedColor_binding(value) {
    		/*colorbutton3_selectedColor_binding*/ ctx[11](value);
    	}

    	let colorbutton3_props = { active: /*active*/ ctx[1] };

    	if (/*color4*/ ctx[5] !== void 0) {
    		colorbutton3_props.selectedColor = /*color4*/ ctx[5];
    	}

    	colorbutton3 = new ColorButton({
    			props: colorbutton3_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(colorbutton3, "selectedColor", colorbutton3_selectedColor_binding));

    	guessinfo = new GuessInfo({
    			props: { result: /*result*/ ctx[6] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			aside0 = element("aside");
    			t0 = text(/*lineNumber*/ ctx[0]);
    			t1 = space();
    			main = element("main");
    			create_component(colorbutton0.$$.fragment);
    			t2 = space();
    			create_component(colorbutton1.$$.fragment);
    			t3 = space();
    			create_component(colorbutton2.$$.fragment);
    			t4 = space();
    			create_component(colorbutton3.$$.fragment);
    			t5 = space();
    			aside1 = element("aside");
    			create_component(guessinfo.$$.fragment);
    			add_location(aside0, file$3, 40, 2, 808);
    			attr_dev(main, "class", "svelte-5r209y");
    			add_location(main, file$3, 41, 2, 838);
    			add_location(aside1, file$3, 47, 2, 1085);
    			attr_dev(div, "id", "gamerow");
    			attr_dev(div, "class", "svelte-5r209y");
    			toggle_class(div, "active", /*active*/ ctx[1]);
    			add_location(div, file$3, 39, 0, 774);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, aside0);
    			append_dev(aside0, t0);
    			append_dev(div, t1);
    			append_dev(div, main);
    			mount_component(colorbutton0, main, null);
    			append_dev(main, t2);
    			mount_component(colorbutton1, main, null);
    			append_dev(main, t3);
    			mount_component(colorbutton2, main, null);
    			append_dev(main, t4);
    			mount_component(colorbutton3, main, null);
    			append_dev(div, t5);
    			append_dev(div, aside1);
    			mount_component(guessinfo, aside1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*lineNumber*/ 1) set_data_dev(t0, /*lineNumber*/ ctx[0]);
    			const colorbutton0_changes = {};
    			if (dirty & /*active*/ 2) colorbutton0_changes.active = /*active*/ ctx[1];

    			if (!updating_selectedColor && dirty & /*color1*/ 4) {
    				updating_selectedColor = true;
    				colorbutton0_changes.selectedColor = /*color1*/ ctx[2];
    				add_flush_callback(() => updating_selectedColor = false);
    			}

    			colorbutton0.$set(colorbutton0_changes);
    			const colorbutton1_changes = {};
    			if (dirty & /*active*/ 2) colorbutton1_changes.active = /*active*/ ctx[1];

    			if (!updating_selectedColor_1 && dirty & /*color2*/ 8) {
    				updating_selectedColor_1 = true;
    				colorbutton1_changes.selectedColor = /*color2*/ ctx[3];
    				add_flush_callback(() => updating_selectedColor_1 = false);
    			}

    			colorbutton1.$set(colorbutton1_changes);
    			const colorbutton2_changes = {};
    			if (dirty & /*active*/ 2) colorbutton2_changes.active = /*active*/ ctx[1];

    			if (!updating_selectedColor_2 && dirty & /*color3*/ 16) {
    				updating_selectedColor_2 = true;
    				colorbutton2_changes.selectedColor = /*color3*/ ctx[4];
    				add_flush_callback(() => updating_selectedColor_2 = false);
    			}

    			colorbutton2.$set(colorbutton2_changes);
    			const colorbutton3_changes = {};
    			if (dirty & /*active*/ 2) colorbutton3_changes.active = /*active*/ ctx[1];

    			if (!updating_selectedColor_3 && dirty & /*color4*/ 32) {
    				updating_selectedColor_3 = true;
    				colorbutton3_changes.selectedColor = /*color4*/ ctx[5];
    				add_flush_callback(() => updating_selectedColor_3 = false);
    			}

    			colorbutton3.$set(colorbutton3_changes);
    			const guessinfo_changes = {};
    			if (dirty & /*result*/ 64) guessinfo_changes.result = /*result*/ ctx[6];
    			guessinfo.$set(guessinfo_changes);

    			if (dirty & /*active*/ 2) {
    				toggle_class(div, "active", /*active*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(colorbutton0.$$.fragment, local);
    			transition_in(colorbutton1.$$.fragment, local);
    			transition_in(colorbutton2.$$.fragment, local);
    			transition_in(colorbutton3.$$.fragment, local);
    			transition_in(guessinfo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(colorbutton0.$$.fragment, local);
    			transition_out(colorbutton1.$$.fragment, local);
    			transition_out(colorbutton2.$$.fragment, local);
    			transition_out(colorbutton3.$$.fragment, local);
    			transition_out(guessinfo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(colorbutton0);
    			destroy_component(colorbutton1);
    			destroy_component(colorbutton2);
    			destroy_component(colorbutton3);
    			destroy_component(guessinfo);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $game;
    	validate_store(game, "game");
    	component_subscribe($$self, game, $$value => $$invalidate(7, $game = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Gamerow", slots, []);
    	let { lineNumber = 0 } = $$props;
    	let { active = false } = $$props;
    	let color1;
    	let color2;
    	let color3;
    	let color4;
    	let result;
    	const writable_props = ["lineNumber", "active"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Gamerow> was created with unknown prop '${key}'`);
    	});

    	function colorbutton0_selectedColor_binding(value) {
    		color1 = value;
    		$$invalidate(2, color1);
    	}

    	function colorbutton1_selectedColor_binding(value) {
    		color2 = value;
    		$$invalidate(3, color2);
    	}

    	function colorbutton2_selectedColor_binding(value) {
    		color3 = value;
    		$$invalidate(4, color3);
    	}

    	function colorbutton3_selectedColor_binding(value) {
    		color4 = value;
    		$$invalidate(5, color4);
    	}

    	$$self.$$set = $$props => {
    		if ("lineNumber" in $$props) $$invalidate(0, lineNumber = $$props.lineNumber);
    		if ("active" in $$props) $$invalidate(1, active = $$props.active);
    	};

    	$$self.$capture_state = () => ({
    		ColorButton,
    		GuessInfo,
    		currentStep,
    		game,
    		lineNumber,
    		active,
    		color1,
    		color2,
    		color3,
    		color4,
    		result,
    		$game
    	});

    	$$self.$inject_state = $$props => {
    		if ("lineNumber" in $$props) $$invalidate(0, lineNumber = $$props.lineNumber);
    		if ("active" in $$props) $$invalidate(1, active = $$props.active);
    		if ("color1" in $$props) $$invalidate(2, color1 = $$props.color1);
    		if ("color2" in $$props) $$invalidate(3, color2 = $$props.color2);
    		if ("color3" in $$props) $$invalidate(4, color3 = $$props.color3);
    		if ("color4" in $$props) $$invalidate(5, color4 = $$props.color4);
    		if ("result" in $$props) $$invalidate(6, result = $$props.result);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*color1, color2, color3, color4, $game, result*/ 252) {
    			{
    				if (color1 && color2 && color3 && color4) {
    					// console.log(color1);
    					// console.log(color2);
    					// console.log(color3);
    					// console.log(color4);
    					$$invalidate(6, result = $game.validateGuess([color1.name, color2.name, color3.name, color4.name]));

    					console.log(result);

    					if (result.rightGuesses !== 4) {
    						currentStep.update(current => current + 1);
    					} else {
    						$game.win();
    					}
    				}
    			}
    		}
    	};

    	return [
    		lineNumber,
    		active,
    		color1,
    		color2,
    		color3,
    		color4,
    		result,
    		$game,
    		colorbutton0_selectedColor_binding,
    		colorbutton1_selectedColor_binding,
    		colorbutton2_selectedColor_binding,
    		colorbutton3_selectedColor_binding
    	];
    }

    class Gamerow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { lineNumber: 0, active: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Gamerow",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get lineNumber() {
    		throw new Error("<Gamerow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lineNumber(value) {
    		throw new Error("<Gamerow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<Gamerow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<Gamerow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Gameboard.svelte generated by Svelte v3.37.0 */
    const file$2 = "src/Gameboard.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	child_ctx[4] = i;
    	return child_ctx;
    }

    // (20:4) {#each Array(10) as _, i}
    function create_each_block(ctx) {
    	let gamerow;
    	let current;

    	gamerow = new Gamerow({
    			props: {
    				lineNumber: /*i*/ ctx[4] + 1,
    				active: /*$currentStep*/ ctx[0] === /*i*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(gamerow.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(gamerow, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const gamerow_changes = {};
    			if (dirty & /*$currentStep*/ 1) gamerow_changes.active = /*$currentStep*/ ctx[0] === /*i*/ ctx[4];
    			gamerow.$set(gamerow_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gamerow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gamerow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(gamerow, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(20:4) {#each Array(10) as _, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let nav;
    	let button0;
    	let t0;
    	let button1;
    	let t1;
    	let button2;
    	let t2;
    	let section;
    	let current;

    	button0 = new Button({
    			props: { label: "Pause" },
    			$$inline: true
    		});

    	button1 = new Button({
    			props: { label: "Reset" },
    			$$inline: true
    		});

    	button2 = new Button({
    			props: { label: "Rules" },
    			$$inline: true
    		});

    	let each_value = Array(10);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			nav = element("nav");
    			create_component(button0.$$.fragment);
    			t0 = space();
    			create_component(button1.$$.fragment);
    			t1 = space();
    			create_component(button2.$$.fragment);
    			t2 = space();
    			section = element("section");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(nav, "class", "svelte-1aecwpb");
    			add_location(nav, file$2, 13, 2, 253);
    			attr_dev(section, "class", "svelte-1aecwpb");
    			add_location(section, file$2, 18, 2, 357);
    			attr_dev(div, "id", "gameboard");
    			attr_dev(div, "class", "svelte-1aecwpb");
    			add_location(div, file$2, 12, 0, 230);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, nav);
    			mount_component(button0, nav, null);
    			append_dev(nav, t0);
    			mount_component(button1, nav, null);
    			append_dev(nav, t1);
    			mount_component(button2, nav, null);
    			append_dev(div, t2);
    			append_dev(div, section);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(section, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$currentStep*/ 1) {
    				each_value = Array(10);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(section, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(button0);
    			destroy_component(button1);
    			destroy_component(button2);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $game;
    	let $currentStep;
    	validate_store(game, "game");
    	component_subscribe($$self, game, $$value => $$invalidate(1, $game = $$value));
    	validate_store(currentStep, "currentStep");
    	component_subscribe($$self, currentStep, $$value => $$invalidate(0, $currentStep = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Gameboard", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Gameboard> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Button,
    		Gamerow,
    		game,
    		currentStep,
    		$game,
    		$currentStep
    	});

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$game*/ 2) {
    			{
    				if (currentStep >= 10) {
    					$game.gameover();
    				}
    			}
    		}
    	};

    	return [$currentStep, $game];
    }

    class Gameboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Gameboard",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Header.svelte generated by Svelte v3.37.0 */

    const file$1 = "src/Header.svelte";

    function create_fragment$1(ctx) {
    	let header;
    	let pre;
    	let t;

    	const block = {
    		c: function create() {
    			header = element("header");
    			pre = element("pre");
    			t = text(" ███╗   ███╗ █████╗ ███████╗████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗██████╗ \n ████╗ ████║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗\n ██╔████╔██║███████║███████╗   ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║██║  ██║\n ██║╚██╔╝██║██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██║  ██║\n ██║ ╚═╝ ██║██║  ██║███████║   ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██████╔╝\n╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═════╝");
    			set_style(pre, "color", /*color*/ ctx[0]);
    			attr_dev(pre, "class", "svelte-10dmwqi");
    			add_location(pre, file$1, 14, 2, 224);
    			attr_dev(header, "class", "svelte-10dmwqi");
    			add_location(header, file$1, 13, 0, 213);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, pre);
    			append_dev(pre, t);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	let color = "#";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ color });

    	$$self.$inject_state = $$props => {
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.37.0 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let div;
    	let header;
    	let t;
    	let gameboard;
    	let current;
    	header = new Header({ $$inline: true });
    	gameboard = new Gameboard({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(header.$$.fragment);
    			t = space();
    			create_component(gameboard.$$.fragment);
    			attr_dev(div, "id", "app");
    			attr_dev(div, "class", "svelte-m00wp7");
    			add_location(div, file, 8, 0, 158);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(header, div, null);
    			append_dev(div, t);
    			mount_component(gameboard, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(gameboard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(gameboard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(header);
    			destroy_component(gameboard);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $game;
    	validate_store(game, "game");
    	component_subscribe($$self, game, $$value => $$invalidate(0, $game = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	$game.start();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Gameboard, Header, game, $game });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
