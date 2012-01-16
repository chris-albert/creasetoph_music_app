/**
 * This is the base javascript library
 *
 * A JS library with the application constructs of JAVA... Hopefully.
 * @author creasetoph
 **/
(function() {
    window.creasetoph = {
        objects: {},
        classes: {}
    };
    var C$ = {
        object_ns: window.creasetoph.objects,
        class_ns: window.creasetoph.classes,
        logger_on: true,
        logger: function(msg) {
            if(this.logger_on) {
                console.log(msg);
            }
        },
        get_class_ns: function() {
            return this.class_ns;
        },
        get_object_ns: function() {
            return this.object_ns;
        },
        add_object_to_ns: function(name,obj) {
            this.get_object_ns()[name] = obj;
        },
        get_object: function(name) {
            var tmp = this.get_object_ns()[name];
            if(typeof tmp !== 'undefined') {
                return tmp;
            }
            return null;
        },
        get_class: function(class_name) {
            var class_obj = this.get_class_ns()[class_name];
            if(typeof class_obj !== 'undefined') {
                return class_obj;
            }
            return null;
        },
        Class: function(class_name) {
            if(typeof class_name !== 'undefined') {
                return this.funcify(this.get_class(class_name));
            }
            return null;
        },
        classify: function(class_name,parent_class_name,object) {
            object['parent_class'] = parent_class_name
            this.get_class_ns()[class_name] = object;
        },
        funcify: function(class_obj) {
            var Class = function() {
                if(this.init) {
                    this.init.apply(this,arguments);
                }
            };
            Class.prototype = class_obj;
            Class.prototype.constructor = Class;
            return Class;
        },
        inherit: function(class_name) {
            var class_obj = this.get_class(class_name),
                base_class_obj = null;
                class_obj.class_name = class_name;
            if(class_obj !== null) {
                base_class_obj = this.get_class(class_obj.parent_class);
                if(base_class_obj !== null) {
                    C$.foreach(base_class_obj,function(key,value) {
                        var type = typeof class_obj[key];
                        if(type === 'undefined') {
                            class_obj[key] = value;
                        }else if(type === 'function') {
                            class_obj[key] = (function(super_fn,fn){
                                return function() {
                                    this._super = super_fn;
                                    return fn.apply(this, arguments);
                                };
                           })(value,class_obj[key]);
                        }
                    },this);
                }
            }
        },
        extend_obj: function(orig_obj,new_obj) {
            for(var i in new_obj) {
                if(new_obj.hasOwnProperty(i)) {
                    orig_obj[i] = new_obj[i];
                }
            }
            return orig_obj;
        },
        foreach: function(obj,func,scope) {
            var ret = [];
            scope = scope || this;
			for(var key in obj) {
				if(obj.hasOwnProperty(key)) {
					ret.push(func.call(scope,key,obj[key]));
				}
			}
			return ret;
		},
        ready_funcs: [],
        ready: function(func) {
            this.ready_funcs.push(func);
        },
        call_ready_funcs: function() {
            this.foreach(this.ready_funcs,function(i,func) {
                func();
            });
        },
        $: function(el, root) {
            if(typeof el === 'string') {
                var els = window.Sizzle(el,root);
                if(els.length >= 1) {
                    if(el.indexOf('#') === 0) {
                        C$.extend_obj(els[0],C$.$functions)
                        return els[0];
                    }else {
                        for(var i in els) {
                            C$.extend_obj(els[i],C$.$functions);
                        }
                        els.foreach = function(func) {
                            return C$.foreach(els,func);
                        };
                        return els;
                    }
                }
                return null;
            }else if(typeof el === 'object') {
                if(el.extended) {
                    return el;
                }
                return C$.extend_obj(el,C$.$functions);
            }else if(typeof el === 'undefined') {
                return {
                    create: C$.$functions.create,
                    elify: C$.$functions.elify
                };
            }
            return null;
        },
        objectify: function(arr) {
        	if(arr.length) {
        		var obj = {};
	        	for(var i = 0, l = arr.length;i < l;i++) {
	        		obj[arr[i]] = arr[i];
	        	}
	        	return obj;
        	}
            return null;
        },
        init: function() {
            //inherit all the classes that need to be inherited
            C$.foreach(C$.get_class_ns(),function(key,value) {
                this.inherit(key);
            },C$);
            C$.call_ready_funcs();
        },
        get_elements_by_attribute: function(attribute,root) {
            root = root || document;
            var els = $('*[' + attribute + ']:not(.hidden_cache_container *)',root,true);
            return els;
        },
        encode_url: function(obj) {
            var url = [], i;
            for(i in obj) {
                url.push(encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]));
            }
            return url.join('&');
        },
        string: {
            capitalize: function(str) {
                var ret = [];
                C$.foreach(str.split(' '),function(i,v) {
                    ret.push(v.charAt(0).toUpperCase() + v.slice(1));
                },this);
                return ret.join(' ');
            },
            trim: function(str) {
                str = str.replace(/^\s+/, '');
                for (var i = str.length - 1; i >= 0; i--) {
                    if (/\S/.test(str.charAt(i))) {
                        str = str.substring(0, i + 1);
                        break;
                    }
                }
                return str;
            }
        },
        is_array: function(obj) {
            return obj instanceof Array;
        },
        active_ajax: 0,
        total_ajax: 0,
        ajax: function(url,callback,scope,post_vars,ret_text) {
            ret_text = ret_text || false;
            scope = scope || this;
            var method = (post_vars === null) ? 'GET' : 'POST',
                ret,
                createXhrObject =  function() {
                    var methods = [
                        function() {return new XMLHttpRequest();},
                        function() {return new ActiveXObject('Msxml2.XMLHTTP')},
                        function() {return new ActiveXObject('Microsoft.XMLHTTP')}
                    ];
                    var conn;
                    for(var i = 0,len = methods.length;i < len; i++) {
                        try{
                            conn = methods[i]();
                        }catch(e) {
                            continue;
                        }
                        this.createXhrObject = conn;
                        return conn;
                    };
                    throw new Error('createXhrObject: Could not create an ajax connection')
                },
                xhr = createXhrObject(),
                post;
            xhr.onreadystatechange = function() {
                if(xhr.readyState !== 4) {return};
                if(xhr.status === 200) {
                    C$.active_ajax--;
                    if(!ret_text && xhr.responseText) {
                        ret = eval('(' + xhr.responseText + ')');
                    }else {
                        ret = xhr.responseText;
                    }
                    callback.call(scope,ret);
                }else {
                    //TODO ajax error
                }
            };
            xhr.open(method,url,true);
            if(method === 'POST') {
                post = C$.encode_url(post_vars);
                xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                xhr.setRequestHeader("Content-length", post.length);
                xhr.setRequestHeader("Connection", "close");
            }
            xhr.send(post);
            this.total_ajax++;
            this.active_ajax++;
        },
        fps: 16,
        animation: function(animation_obj,el) {
            var self = animation_obj;
            var ret = function() {};
            ret.prototype = {
                element: el,
                queue: null,
                tween_forward: true,
                first_toggle: true,
                determine_direction: function(start, end) {
                    if(start < end) {
                        return '+';
                    }else {
                        return '-';
                    }
                },
                set_current: function() {
                    var i, prop;
                    for(i in this.queue.moves) {
                        prop = this.queue.moves[i].property;
                        this.queue.moves[i].current = this.element['offset'+ prop.charAt(0).toUpperCase() + prop.slice(1)];
                    }
                },
                toggle_tweener: function() {
                    if(!this.first_toggle) {
                        for(var i in this.queue.moves) {
                            var dir = this.queue.moves[i].direction;
                            if(dir === '+') {
                                this.set_tweener('-',i);
                            }else if(dir === '-') {
                                this.set_tweener('+',i);
                            }
                        }
                    }
                    this.first_toggle = false;
                },
                set_tweener: function(dir,index) {
                    this.queue.moves[index].tweener = C$.tweener(dir);
                    this.queue.moves[index].direction = dir;
                },
                switch_tweener: function() {
                    for(var i in this.queue.moves) {
                        var dir = this.queue.moves[i].original_direction;
                        if(dir === '+') {
                            this.set_tweener('-',i);
                        }else if(dir === '-') {
                            this.set_tweener('+',i);
                        }
                    }
                },
                reset_tweener: function() {
                    for(var i in this.queue.moves) {
                        this.set_tweener(this.queue.moves[i].original_direction,i);
                    }
                },
                play: function() {
                    this.build_queue();
                    if(!this.queue.playing) {
                        this.play_animation();
                    }
                },
                forward: function() {
                    this.build_queue();
                    this.reset_tweener();
                    this.play()
                },
                backward: function() {
                    this.build_queue();
                    this.switch_tweener();
                    this.play();
                    
                },
                toggle: function() {
                    this.build_queue();
                    this.toggle_tweener();
                    this.play();
                },
                stop: function(func) {
                    if(this.queue.playing) {
                        if(typeof func == 'function') {
                            this.onStop = function() {
                                func();
                            };
                        }
                        this.queue.pause = true;
                    }
                },
                play_animation: function(){
                    var me = this;
                    this.queue.playing = true;
                    this.queue.done = false;
                    (function animate() {
                        if(!me.queue.pause) {
                            for(var i in me.queue.moves) {
                               var prop = me.queue.moves[i].property;
                               if(prop === 'opacity') {
                                   me.element.style[prop] = me.queue.moves[i].tweener.call(me,i);
                               }else {
                                   me.element.style[prop] = me.queue.moves[i].tweener.call(me,i) + 'px';
                               }
                            }
                            setTimeout(animate,(1 / C$.fps));
                        }else {
                            me.queue.playing = false;
                            me.queue.pause = false;
                            me.queue.done = true;
                            self.onEnd();
                            return;
                        }
                    })();
                },
                build_queue: function(){
                    if(this.queue == null) {
                        var prop, o, arr = [],q = {};
                        q.pause = false;
                        q.done = false;
                        q.playing = false;
                        for(prop in self.properties) {
                            if(self.properties.hasOwnProperty(prop)) {
                                o = {};
                                o.property = prop;
                                o.end_value = self.properties[prop];
                                if(prop === 'opacity') {
                                    o.start_value = this.element.style[prop] || 1;
                                }else {
                                    o.start_value = this.element['offset'+ prop.charAt(0).toUpperCase() + prop.slice(1)] || 0;
                                }
                                o.diff = o.end_value - o.start_value;
                                o.time = self.time * .001; //in milliseconds
                                o.frames = C$.fps * o.time;
                                o.tween = Math.abs(o.diff / o.frames);
                                o.current = o.start_value;
                                o.direction = this.determine_direction(o.start_value,o.end_value);
                                o.original_direction = o.direction;
                                o.tweener = C$.tweener(o.direction);
                                arr.push(o);
                            }
                        }
                        this.queue = q;
                        this.queue.moves = arr;
                    }
                }
            };
            return new ret;
        },
        tweener: function(dir) {
            if(dir == '+') {
                return function(index) {
                    var obj = this.queue.moves[index];
                    obj.current += obj.tween;

                    if(obj.original_direction === '+') {
                        if(obj.current >= obj.end_value) {
                            this.queue.pause = true;
                            return obj.end_value;
                        }
                    }else {
                        if(obj.current >= obj.start_value) {
                            this.queue.pause = true;
                            return obj.start_value;
                        }
                    }    
                    return obj.current;
                }
            }else if(dir == '-') {
                return function(index) {
                    var obj = this.queue.moves[index];
                    obj.current -= obj.tween;

                    if(obj.original_direction === '+') {
                        if(obj.current <= obj.start_value) {
                            this.queue.pause = true;
                            return obj.start_value;
                        }
                    }else {
                        if(obj.current <= obj.end_value) {
                            this.queue.pause = true;
                            return obj.end_value;
                        }
                    }
                    return obj.current;
                }
            }
        },
        toggler: function(element, property, new_value) {
            var toggle = false,
                old_value = element[property];
            return function() {
                if(!toggle) {
                    element[property] = new_value;
                    toggle = true;
                }else {
                    element[property] = old_value;
                    toggle = false;
                }
            };
        },
        detect_browser: function() {
            var browsers = C$.browsers;
            for(var i in browsers) {
                if(browsers[i]) {
                    this.browser = i;
                    break;
                }
            }
        },
        when_DOM_ready: function(callback) {
            //var DomReady = window.DomReady = {};
            var userAgent = navigator.userAgent.toLowerCase();
            var browser = {
//                version: (userAgent.match( /.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/ ) || [])[1],
                chrome: /chrome/.test(userAgent),
                safari: /webkit/.test(userAgent),
                opera: /opera/.test(userAgent),
                msie: (/msie/.test(userAgent)) && (!/opera/.test( userAgent )),
                mozilla: (/mozilla/.test(userAgent)) && (!/(compatible|webkit)/.test(userAgent))
            };
            C$.browsers = browser;
            var readyBound = false;
            var isReady = false;
            var readyList = [];
            function domReady() {
                if(!isReady) {
                    isReady = true;
                    if(readyList) {
                        for(var fn = 0; fn < readyList.length; fn++) {
                            readyList[fn].call(window, []);
                        }
                        readyList = [];
                    }
                }
            };
            function addLoadEvent(func) {
              var oldonload = window.onload;
              if (typeof window.onload != 'function') {
                window.onload = func;
              } else {
                window.onload = function() {
                  if (oldonload) {
                    oldonload();
                  }
                  func();
                }
              }
            };
            function bindReady() {
                if(readyBound) {
                    return;
                }
                readyBound = true;
                if (document.addEventListener && !browser.opera) {
                    document.addEventListener("DOMContentLoaded", domReady, false);
                }
                if (browser.msie && window == top) (function(){
                    if (isReady) return;
                    try {
                        document.documentElement.doScroll("left");
                    } catch(error) {
                        setTimeout(arguments.callee, 0);
                        return;
                    }
                    domReady();
                })();
                if(browser.opera) {
                    document.addEventListener( "DOMContentLoaded", function () {
                        if (isReady) return;
                        for (var i = 0; i < document.styleSheets.length; i++)
                            if (document.styleSheets[i].disabled) {
                                setTimeout( arguments.callee, 0 );
                                return;
                            }
                        domReady();
                    }, false);
                }
                if(browser.safari) {
                    var numStyles;
                    (function(){
                        if (isReady) return;
                        if (document.readyState != "loaded" && document.readyState != "complete") {
                            setTimeout( arguments.callee, 0 );
                            return;
                        }
                        if (numStyles === undefined) {
                            var links = document.getElementsByTagName("link");
                            for (var i=0; i < links.length; i++) {
                                if(links[i].getAttribute('rel') == 'stylesheet') {
                                    numStyles++;
                                }
                            }
                            var styles = document.getElementsByTagName("style");
                            numStyles += styles.length;
                        }
                        if (document.styleSheets.length != numStyles) {
                            setTimeout( arguments.callee, 0 );
                            return;
                        }
                        domReady();
                    })();
                }
                addLoadEvent(domReady);
            };
            var ready = function(fn, args) {
                bindReady();
                if (isReady) {
                    fn.call(window, []);
                } else {
                    readyList.push( function() {return fn.call(window, []);} );
                }
            }(callback);
        },
        $functions: {
            extended: true,
            css: function(args) {
                for(var i in args) {
                    if(args.hasOwnProperty(i)) {
                        if(this.hasOwnProperty(i)) {
                            this[i](args[i]);
                        }else {
                            //this should never get executed since we added all style functions to this
                            //just in case there is a wild style that was not on the body but on the element
                            this.style[i] = args[i];
                        }
                    }
                }
                return this;
            },
            opacity: function(value){
                this.style.opacity = value/10;
                this.style.MozOpacity = value/10;
                this.style.KhtmlOpacity = value/10;
                this.style.filter = 'alpha(opacity=' + value*10 + ')';
                return this;
            },
            add_styles: function() {
                var i;
                C$.styles = $('body').style;
                for(i in C$.styles) {
                    if(typeof C$.$functions[i] === "undefined") {
                        C$.$functions[i] = function(i) {
                            return function(value) {
                                this.style[i] = value;
                                return this;
                            }
                        }(i);
                    }
                }
                return this;
            },
            animate: function(properties,callback,time) {
                if(!this.animation) {
                    this.animation = new creasetoph.Animation();
                    this.animation.instance = [];
                    this.animation.element = this;
                    this.animation.properties = properties;
                    this.animation.callback = callback || this.animation.callback;
                    this.animation.time = time || this.animation.time;
                }
                return this.animation;
            },
            get_attribute: function(attribute) {
                return this.getAttribute(attribute);
            },
            get_attributes: function(attributes) {
                var ret = {};
                C$.foreach(attributes,function(key,name) {
                    var tmp = this.get_attribute(name);
                    ret[name] = tmp;
                },this);
                return ret;
            },
            set_attribute: function(attribute,value) {
                var type = typeof attribute,
                    self = this;
                if(type === 'object') {
                    C$.foreach(attribute,function(k,v) {
                        self.setAttribute(k,v);
                    });
                }else if(type === 'string') {
                    this.setAttribute(attribute,value);
                }

                return this;
            },
            add_class: function(class_name) {
                if(this.className.indexOf(class_name) === -1) {
                    if(this.className !== ''){
                        class_name = ' ' + class_name;
                    }
                    this.className += class_name;
                }
                return this;
            },
            remove_class: function(class_name) {
                if(this.className.indexOf(class_name) !== -1) {
                    this.className = this.className.replace(class_name, '');
                }
                return this;
            },
            has_class: function(class_name) {
                if(this.className.indexOf(class_name) === -1) {
                    return false;
                }
                return true;
            },
            set: function(text) {
                switch(this.tagName.toLowerCase()) {
                    case 'input':
                        this.value = text;
                        break;
                    default:
                        this.innerHTML = text;
                        break;
                }
                return this;
            },
            get: function() {
                switch(this.tagName.toLowerCase()) {
                    case 'input':
                    case 'textarea':
                    case 'select':
                        return this.value;
                        break;
                    default:
                        return this.innerHTML;
                }
            },
            create: function(new_els) {
                //TODO: this better
            },
            elify: function(html) {
                var tmp_el = document.createElement('div');
                tmp_el.innerHTML = html;
                return tmp_el.childNodes[0];
            },
            empty: function() {
                this.innerHTML = '';
            },
            append: function(els) {
                var self = this;
                if(typeof els.length === 'undefined') {
                    els = Array.prototype.slice.call(arguments, 0);
                }
                C$.foreach(els, function(index,el) {

                    self.appendChild(el);
                });
                return this;
            },
            remove: function(els) {
                var self = this;
                if(typeof els.length === 'undefined') {
                    els = Array.prototype.slice.call(arguments, 0);
                }
                C$.foreach(els, function(index,el) {
                    self.removeChild(el);
                });
                return this;
            },
            insert_after: function(after_node) {
                after_node.parentNode.insertBefore(this,after_node.nextSibling);
                return this;
            },
            get_sibling: function(sibling) {
                var match = {
                    ID: /#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
                    CLASS: /\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
                    ATTR: /\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,
                    TAG: /^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/
                },type;
                for(type in match) {
                    if(match[type].exec(sibling)) {
                        break;
                    }
                }
                switch(type) {
                    case 'ATTR':
                        var pos,attr,dir = 'previous',tmp;
                        var get_sibling_by_attribute = function(el) {
                            pos = sibling.indexOf('=');
                            if(pos != -1) {
                                attr = sibling.substr(pos + 1, (sibling.length - pos) - 2);
                                if(el.getAttribute && attr == el.getAttribute(sibling.substr(1,pos - 1))) {
                                    return el;
                                }else {
                                    return get_sibling_by_attribute(el[dir + 'Sibling']);
                                }
                            }else {
                                if(el.getAttribute && el.getAttribute(sibling.substr(1,sibling.length - 2))) {
                                    return el;
                                }else {
                                    return get_sibling_by_attribute(el[dir + 'Sibling']);
                                }
                            }
                            return false;
                        };
                        tmp = $(get_sibling_by_attribute(this));
                        if(!tmp) {
                            dir = 'next';
                            tmp = $(get_sibling_by_attribute(this));
                        }
                        return tmp;

                        break;
                     case 'TAG':
                        //var get_parent_by_tag = function(el) {
                            //if(el.tagName && el.tagName == parent.toUpperCase()) {
                                //return el;
                            //}else {
                                //return get_parent_by_tag(el.parentNode);
                            //}
                        //};
                        //return $(get_parent_by_tag(this));

                        break;
                    case 'CLASS':
                        //var get_parent_by_ = function(el) {
                            //var parts = C$.objectify(el.getAttribute(type).split(' '));
                            //if(el.getAttribute && parts[parent.substr(1)]) {
                                //return el;
                            //}
                            //return get_parent_by_(el.parentNode);
                        //};
                        //return $(get_parent_by_(this));
                        break;
                    case 'ID':
                        //var get_parent_by_ = function(el) {
                            //if(el.getAttribute && el.getAttribute(type) == parent.substr(1)) {
                                //return el;
                            //}else {
                                //return get_parent_by_(el.parentNode);
                            //}
                        //};
                        //return $(get_parent_by_(this));
                        break;
                }
            },
            get_parent: function(parent) {
                var match = {
                    ID: /#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
                    CLASS: /\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
                    ATTR: /\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,
                    TAG: /^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/
                },type;
                for(type in match) {
                    if(match[type].exec(parent)) {
                        break;
                    }
                }
                switch(type) {
                    case 'ATTR':
                        var pos,attr;
                        var get_parent_by_attribute = function(el) {
                            pos = parent.indexOf('=');
                            if(pos != -1) {
                                attr = parent.substr(pos + 1, (parent.length - pos) - 2);
                                if(el.getAttribute && attr == el.getAttribute(parent.substr(1,pos - 1))) {
                                    return el;
                                }else {
                                    return get_parent_by_attribute(el.parentNode);
                                }
                            }else {
                                if(el.getAttribute && el.getAttribute(parent.substr(1,parent.length - 2))) {
                                    return el;
                                }else {
                                    return get_parent_by_attribute(el.parentNode);
                                }
                            }
                        };
                        return $(get_parent_by_attribute(this));

                        break;
                     case 'TAG':
                        var get_parent_by_tag = function(el) {
                            if(el.tagName && el.tagName == parent.toUpperCase()) {
                                return el;
                            }else {
                                return get_parent_by_tag(el.parentNode);
                            }
                        };
                        return $(get_parent_by_tag(this));

                        break;
                    case 'CLASS':
                    	var get_parent_by_ = function(el) {
                    		var parts = C$.objectify(el.getAttribute(type).split(' '));
                            if(el.getAttribute && parts[parent.substr(1)]) {
                                return el;
                            }
                            return get_parent_by_(el.parentNode);
                        };
                        return $(get_parent_by_(this));
                        break;
                    case 'ID':
                        var get_parent_by_ = function(el) {
                            if(el.getAttribute && el.getAttribute(type) == parent.substr(1)) {
                                return el;
                            }else {
                                return get_parent_by_(el.parentNode);
                            }
                        };
                        return $(get_parent_by_(this));
                        break;
                }
            },
            get_child: function(child) {
                var arr = [],tmp;
                if(typeof child === 'object') {
                    for(var i in child) {
                        tmp = this.get_child(child[i]);
                        if(tmp !== undefined) {
                            arr = arr.concat(this.get_child(child[i]));
                        }
                    }
                }else {
                    return $(child,this);
                }
                return arr;
            },
            determine_selector: function(selector) {
                switch(selector.charAt(0)) {
                    case '.':
                        return 'class';
                        break;
                    case '#':
                        return 'id';
                        break;
                    case '[':
                        return selector.substr(1,selector.length - 2);
                        break;
                }
            },
            event: function(event,func,scope) {
                if(typeof this.addEventListener !== 'undefined') {
                    this.addEventListener(event,function(a,b,c,d) {
                        func.call(scope,a,b,c,d)
                    },true);
                }else if(typeof this.attachEvent !== 'undefined') {
                    this.attachEvent('on' + event,function(a,b,c,d) {
                        func.call(scope,a,b,c,d)
                    });
                }
                return this;
            },
            remove_event: function(event) {
                if(typeof this.removeEventListener !== 'undefined') {
                    this.removeEventListener(event,func,true);
                }else if(typeof this.detachEvent !== 'undefined') {
                    this.detachEvent('on' + event,func);
                }
                return this;
            },
            ajax: function(url,callback,scope,post_vars) {
                C$.ajax(url,callback,scope,post_vars);
                return this;
            }
        }
    };
    window.C$ = C$;
    window.$ = C$.$;
})();