/*
 * $njs 1.0 Alpha - Javascript Toolkit
 *
 * Copyright (c) 2010 Henry Liang
 *
 * $Date: 2010-12-12 03:20:00$
 *
 */
window["undefined"] = window["undefined"];
var $njs = 
{
    extend: function()
    {
        var target = arguments[0] || {}, i = 1, length = arguments.length, options;
        
        if (typeof target != "object" && typeof target != "function") 
            target = {};
        
        for (; i < length; i++) 
            if ((options = arguments[i]) != null) 
                for (var name in options) 
                    if (target === options[name]) 
                        continue;
                    else 
                        if (options[name] != undefined) 
                        {
                            target[name] = options[name];
                        }
        
        return target;
    }
};

$njs.browser = 
{
    version: (navigator.userAgent.toLowerCase().match(/.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/) || [])[1],
    safari: /webkit/.test(navigator.userAgent.toLowerCase()),
    opera: /opera/.test(navigator.userAgent.toLowerCase()),
    msie: /msie/.test(navigator.userAgent.toLowerCase()) && !/opera/.test(navigator.userAgent.toLowerCase()),
    mozilla: /mozilla/.test(navigator.userAgent.toLowerCase()) && !/(compatible|webkit)/.test(navigator.userAgent.toLowerCase())
};
//
$njs.extend($njs, 
{
    _expand: "$njs" + (+new Date),
    _winObj: {},
    gid: 1,
    cache: {},
    data: function(elem, name, data)
    {
        elem = elem == window ? $njs["_winObj"] : elem;
        
        var id = elem[$njs["_expand"]];
        
        if (!id) 
            id = elem[$njs["_expand"]] = $njs.globalId();
        
        if (name && !$njs.cache[id]) 
            $njs.cache[id] = {};
        
        if (data !== undefined) 
            $njs.cache[id][name] = data;
        
        return name ? $njs.cache[id][name] : id;
    },
    removeData: function(elem, name)
    {
        elem = elem == window ? $njs["_winObj"] : elem;
        
        var id = elem[$njs["_expand"]];
        
        if (name) 
        {
            if ($njs.cache[id]) 
            {
                delete $njs.cache[id][name];
                
                name = "";
                
                for (name in $njs.cache[id]) 
                    break;
                
                if (!name) 
                    $njs.removeData(elem);
            }
        }
        else 
        {
            try 
            {
                delete elem[$njs["_expand"]];
            } 
            catch (e) 
            {
                if (elem.removeAttribute) 
                    elem.removeAttribute($njs["_expand"]);
            }
            delete $njs.cache[id];
        }
    },
    each: function(object, callback)
    {
        var name, i = 0, length = object.length;
        if (length === undefined) 
        {
            for (name in object) 
                if (callback.call(object[name], name, object[name]) === false) 
                    break;
        }
        else 
            for (var value = object[0]; i < length && callback.call(value, i, value) !== false; value = object[++i]) {}
    },
    trim: function(text)
    {
        return (text || "").replace(/^\s+/, "").replace(/\s+$/, "");
    },
    globalId: function()
    {
        return $njs.gid++;
    }
});
/*
 $njs element
 */
(function()
{
    $njs.extend($njs.element = {}, 
    {
        addClass: function(ele, name)
        {
            if (arguments.length == 2) 
            {
                if (!$njs.element.hasClass(ele, name)) 
                {
                    ele.className = ele.className + " " + name;
                }
            }
            else 
                for (var i = 1; i < arguments.length; i++) 
                    arguments.callee(ele, arguments[i]);
            
        },
        hasClass: function(ele, name)
        {
            var cla = ele.className.split(/\s+/);
            for (var i = 0; i < cla.length; i++) 
                if (cla[i] == name) 
                    return true;
            return false;
        },
        removeClass: function(ele, name)
        {
            if (arguments.length == 2) 
            {
                var cla = ele.className.split(/\s+/);
                for (var i = 0; i < cla.length; i++) 
                    if (cla[i] == name) 
                        cla.splice(i--, 1);
                ele.className = cla.join(" ");
            }
            else 
                for (var i = 1; i < arguments.length; i++) 
                    arguments.callee(ele, arguments[i]);
        },
        swap: function(elem, options, callback)
        {
            var old = {};
            
            for (var name in options) 
            {
                old[name] = elem.style[name];
                elem.style[name] = options[name];
            }
            
            callback.call(elem);
            
            for (var name in options) 
                elem.style[name] = old[name];
        },
        css: function(ele, name, value)
        {
            if (value == null && (name == "width" || name == "height")) 
            {
                var val, props = 
                {
                    position: "absolute",
                    visibility: "hidden",
                    display: "block"
                }, which = name == "width" ? ["Left", "Right"] : ["Top", "Bottom"];
                
                function getWH()
                {
                    val = name == "width" ? ele.offsetWidth : ele.offsetHeight;
                    var padding = 0, border = 0;
                    $njs.each(which, function(a)
                    {
                        padding += parseFloat($njs.element.css(ele, "padding" + a)) || 0;
                        border += parseFloat($njs.element.css(ele, "border" + a + "Width")) || 0;
                    });
                    val -= Math.round(padding + border);
                }
                
                if (ele.style.display != "none") 
                    getWH();
                else 
                    $njs.swap(ele, props, getWH);
                
                return Math.max(0, val);
            }
            
            
            return $njs.attr(ele.style, name, value);
        },
        attr: function(ele, name, value)
        {
        
            switch (name)
            {
                case "class":
                    name = "className";
                default:
                    ;            
			}
            
            if (ele.tagName && name == "opacity") 
            {
            
                if ($njs.browser.msie) 
                {
                    if (value) 
                    {
                        ele.zoom = 1;
                        ele.filter = (ele.filter || "").replace(/alpha\([^)]*\)/, "") +
                        (parseInt(value) + '' == "NaN" ? "" : "alpha(opacity=" + value * 100 + ")");
                    }
                    
                    return ele.filter && ele.filter.indexOf("opacity=") >= 0 ? (parseFloat(ele.filter.match(/opacity=([^)]*)/)[1]) / 100) + '' : "";
                }
                else 
                    if ($njs.browser.mozilla) 
                    {
                        name = "MozOpacity";
                    }
            }
            if (value) 
                ele[name] = value;
            return ele[name];
            
        },
        offset: function(e, p)
        {
            var left = 0;
            var top = 0;
            while (e.offsetParent && e != p) 
            {
                left += e.offsetLeft;
                top += e.offsetTop;
                e = e.offsetParent;
            }
            left += e.offsetLeft;
            top += e.offsetTop;
            return {
                x: left,
                y: top
            };
        },
        nodeName: function(elem, name)
        {
            return elem.nodeName && elem.nodeName.toUpperCase() == name.toUpperCase();
        },
        /*
         const unsigned short      DOCUMENT_POSITION_DISCONNECTED = 0x01;
         const unsigned short      DOCUMENT_POSITION_PRECEDING    = 0x02;
         const unsigned short      DOCUMENT_POSITION_FOLLOWING    = 0x04;
         const unsigned short      DOCUMENT_POSITION_CONTAINS     = 0x08;
         const unsigned short      DOCUMENT_POSITION_CONTAINED_BY = 0x10;
         const unsigned short      DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC = 0x20;
         */
        compareDocumentPosition: function(a, b)
        {
			if(a.compareDocumentPosition)
				return a.compareDocumentPosition(b);
			
			if(a == b)
				return 0;
			else if(a == document || a.contains(b))
				return 20;
			else if(b == document || b.contains(a))
				return 10;
			else if("sourceIndex" in a)
			{
				return a.sourceIndex >= 0 && b.sourceIndex >= 0 ? (a.sourceIndex < b.sourceIndex && 4) + (a.sourceIndex > b.sourceIndex && 2) : 1;
			}
			else
			{
				var c = a;
				while((c = c.previousSibling) && c != b){}
				if(c == b)
					return 2;
				c = b;
				while((c = c.previousSibling) && c != a){}
				if(c == a)
					return 4;
				return 1;
			}
			return 0;
            //return a.compareDocumentPosition ? a.compareDocumentPosition(b) : a.contains ? (a != b && a.contains(b) && 16) + (a != b && b.contains(a) && 8) + (a.sourceIndex >= 0 && b.sourceIndex >= 0 ? (a.sourceIndex < b.sourceIndex && 4) + (a.sourceIndex > b.sourceIndex && 2) : 1) : 0;
        }
    });
})();

/*
 $njs array
 */
(function()
{
    $njs.extend($njs.array = {}, 
    {
        unique: function(array)
        {
            var ret = [];
            for (var i = 0; i < array.length; i++) 
            {
                var b = false;
                for (var j = 0; j < ret.length; j++) 
                    if (ret[j] == array[i]) 
                    {
                        b = true;
                        break;
                    }
                if (!b) 
                    ret.push(array[i]);
            }
            return ret;
        },
        inArray: function(arr, e)
        {
            for (var i = 0; i < arr.length; i++) 
                if (arr[i] == e) 
                    return i;
            return -1;
        },
        copy: function()
        {
            var ind = -1, len = arguments.length, pos, target = arguments[len - 1];
            if (typeof arguments[len - 1] == "number") 
            {
                var source = [target, 0];
                target = arguments[--len - 1];
                while (++ind < len - 1) 
                    arguments.callee(arguments[ind], source);
                Array.prototype.splice.apply(target, source);
            }
            else 
                while (++ind < len - 1)
					for(var i = 0 , l = arguments[ind].length ; i < l ; i++)
						target.push(arguments[ind][i]);
            return target;
        }
    });
})();

/*
 $njs event
 */
(function()
{
    $njs.extend($njs.event = {}, 
    {
        _native: ("blur,focus,load,resize,scroll,unload,click,dblclick,mousedown,mouseup,mousemove,mouseover,mouseout,mouseenter,mouseleave,change,select,submit,keydown,keypress,keyup,error").split(","),
        offset: function(ev)
        {
            if (ev.pageX || ev.pageY) 
            {
                return {
                    x: ev.pageX,
                    y: ev.pageY
                };
            }
            return {
                x: ev.clientX + Math.max(document.body.scrollLeft, document.documentElement.scrollLeft) - Math.max(document.body.clientLeft, document.documentElement.clientLeft),
                y: ev.clientY + Math.max(document.body.scrollTop, document.documentElement.scrollTop) - Math.max(document.body.clientTop, document.documentElement.clientTop)
            };
        },
        preventDefault: function(ev)
        {
            ev = ev || window.event;
            if (ev.preventDefault) 
                ev.preventDefault();
            ev.returnValue = false;
        },
        stopPropagation: function(ev)
        {
            ev = ev || window.event;
            if (ev.stopPropagation) 
                ev.stopPropagation();
            ev.cancelBubble = true;
        },
        handle: function(ev)
        {
            var type = typeof ev == "string" ? ev : (ev || window.event).type;
            var handlers = arguments[0] = ($njs.data(this, "events") || {})[type];
            
            if (handlers) 
            {
                for (var i = 0, len = handlers.length; i < len; i++) 
                {
                    var ret = handlers[i].apply(this, arguments);
                    if (ret === false) 
                    {
                        this.preventDefault(ev);
                        this.stopPropagation(ev);
                    }
                }
            }
        },
        bind: function(elem, type, handler)
        {
            if (elem.nodeType == 3 || elem.nodeType == 8) 
                return;
            if (elem.setInterval && elem != window) 
                elem = window;
            var events = $njs.data(elem, "events") || $njs.data(elem, "events", {}), handle = $njs.data(elem, "handle") ||
            $njs.data(elem, "handle", function()
            {
                return !$njs.event.triggered ? $njs.event.handle.apply(arguments.callee.elem, arguments) : undefined;
            });
            handle.elem = elem;
            
            var handlers = events[type];
            
            if (!handlers) 
            {
                handlers = events[type] = [];
                if ($njs.array.inArray(this._native, type) != -1) 
                    if (elem.addEventListener) 
                        elem.addEventListener(type, handle, false);
                    else 
                        if (elem.attachEvent) 
                            elem.attachEvent("on" + type, handle);
                
            }
            handlers.push(handler);
        },
        remove: function(elem, type, handler)
        {
            if (elem.nodeType == 3 || elem.nodeType == 8) 
                return;
            var events = $njs.data(elem, "events");
            if (events) 
            {
                if (type == undefined) 
                {
                    for (var type in events) 
                        this.remove(elem, type);
                }
                else 
                {
                    var handles = events[type], name;
                    var ind;
                    if (handler) 
                        while ((ind = $njs.array.inArray(handles, handler)) != -1) 
                        {
                            handles.splice(ind, 1);
                        }
                    else 
                        handles = [];
                    if (handles.length == 0) 
                    {
                        if ($njs.array.inArray(this._native, type) != -1) 
                            if (elem.removeEventListener) 
                                elem.removeEventListener(type, $njs.data(elem, "handle"), false);
                            else 
                                if (elem.detachEvent) 
                                    elem.detachEvent("on" + type, $njs.data(elem, "handle"));
                        delete events[type];
                    }
                    for (name in events) 
                        break;
                    if (!name) 
                    {
                        var handle = $njs.data(elem, "handle");
                        if (handle) 
                            handle.elem = null;
                        $njs.removeData(elem, "events");
                        $njs.removeData(elem, "handle");
                    }
                }
            }
        },
        trigger: function(elem, type, data)
        {
            var handle = $njs.data(elem, "handle");
            if (handle) 
                handle.call(elem, type, data);
            
            if ((!elem[type] || ($njs.element.nodeName(elem, 'a') && type == "click")) && elem["on" + type] && elem["on" + type].apply(elem, data) === false) 
                ;
            if (elem[type] && !($njs.element.nodeName(elem, 'a') && type == "click")) 
            {
                this.triggered = true;
                try 
                {
                    elem[type]();
                } 
                catch (e) 
                {
                }
                this.triggered = false;
            }
        }
    });
    $njs.event.bind(window, 'unload', function()
    {
        for (var id in $njs.cache) 
            if (id != 1 && $njs.cache[id].handle) 
                $njs.event.remove($njs.cache[id].handle.elem);
    });
})();

/*
 $njs ajax
 */
$njs.extend($njs.ajax = {}, 
{
    httpSuccess: function(r)
    {
        try 
        {
            return !r.status && location.protocol == "file:" || (r.status >= 200 && r.status < 300) || r.status == 304 || r.status == 1223;
        } 
        catch (e) 
        {
        }
        return false;
    },
    request: function(obj)
    {
        obj = $njs.extend(
        {
            type: "post",
            url: "",
            data: null,
            username: null,
            password: null,
            async: false,
            contentType: "application/x-www-form-urlencoded",
            complete: function()
            {
            }
        }, obj || {});
        
        var xhr = window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
        if (obj.username) 
            xhr.open(obj.type, obj.url, obj.async, obj.username, obj.password);
        else 
            xhr.open(obj.type, obj.url, obj.async);
        
        xhr.setRequestHeader("Content-Type", obj.contentType);
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        xhr.onreadystatechange = function()
        {
            if (xhr.readyState == 4) 
            {
            
                if ($njs.ajax.httpSuccess(xhr)) 
                {
                    obj.complete.call(window, "success", xhr);
                }
                else 
                {
                    obj.complete.call(window, "error", xhr);
                }
            }
        }
        xhr.send(obj.data);
        return xhr;
    },
    get: function(url, func)
    {
        if (func) 
        {
            return $njs.ajax.request({
                type: "get",
                url: url,
                complete: func,
                async: true
            });
        }
        else 
        {
            return $njs.ajax.request({
                type: "get",
                url: url,
                async: false
            });
        }
    },
    post: function(url, data, func)
    {
        if (func) 
        {
            return $njs.ajax.request({
                type: "post",
                url: url,
                data: data,
                complete: func,
                async: true
            });
        }
        else 
        {
            return $njs.ajax.request({
                type: "post",
                url: url,
                data: data,
                async: false
            });
        }
    }
});
