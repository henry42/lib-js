/*
 * $njs 1.0 Selector Alpha - Javascript Toolkit
 *
 * Copyright (c) 2010 Henry Liang
 *
 * $Date: 2010-12-12 03:20:00$
 *
 */
(function()
{
    var chars = "[\\w\\u0128-\\uFFFF*_-]";
    var parse = 
    {
        "id": new RegExp("^#(" + chars + "+)"),
        "element": new RegExp("^(?:(?:\\s*(>)\\s*)|\\s+)(" + chars + "+)?"),
        "attr": /^(\[)\s*([\w-]+) *([~^$*|]=)?\s*(.*?)\]/,
        "class": new RegExp("^\\.(" + chars + "+)"),
        /*
         E:nth-child(n)
         E:nth-last-child(n)
         E:nth-of-type(n)
         E:nth-last-of-type(n)
         */
        "pseudo$child": new RegExp("^:(nth-(?:last-)?(?:child|of-type))\\([^\\)]\\)"),
        /*
         E:root
         E:first-child
         E:last-child
         E:first-of-type
         E:last-of-type
         E:only-child
         E:only-of-type
         E:empty
         E:link
         E:visited
         E:active
         E:hover
         E:focus
         E:target
         E:enabled
         E:disabled
         E:checked
         
         not support
         
         E:lang(fr)
         */
        "pseudo$normal": null
    }
    var parse_f = 
    {
        "id": function(m, elems)
        {
            var r = document.getElementById(m);
            if (!r) 
                return [];
            if (elems.length == 1 && elems[0] == document) 
            {
                return [r]
            }
            else 
            {
                for (var i = 0, len = elems.length; i < len; i++) 
                {
                    if ($njs.element.compareDocumentPosition(elems[i], r) & 16) 
                        return [r];
                }
                return [];
            }
        },
        "element": function(m, elems)
        {
            var t = $njs.trim(m[2]) || "*";
            var p = $njs.trim(m[1]);
            var r = [];
            if (p == "") 
            {
                for (var i = 0, len = elems.length; i < len; i++) 
                {
                    $njs.array.copy(elems[i].getElementsByTagName(t), r);
                }
            }
            else 
                if (p == ">") 
                {
                    var rr = [];
                    for (var i = 0, len = elems.length; i < len; i++) 
                    {
                        $njs.array.copy(elems.childNodes, r);
                    }
                    if (t != "*") 
                    {
                        var rr = [];
                        $njs.each(r, function(v, ind)
                        {
                            if ($njs.element.nodeName(v, t)) 
                                rr.push(v);
                        });
                        r = rr;
                    }
                }
            elems.length = 0;
            return $njs.array.copy($njs.array.unique(r), elems);
        },
        "attr": function(m, elems)
        {
            var n = m[2], o = m[3], v = m[4], f = o ? filter.attr[o] : filter.attr["="];
            var r = [];
            if (!f) 
                throw "unknown operation : " + o;
            for (var i = 0, len = elems.length; i < len; i++) 
            {
                if (f(elems[i], n, v)) 
                    r.push(elems[i]);
            }
            elems.length = 0;
            return $njs.array.copy($njs.array.unique(r), elems);
        },
        "class": function(m, elems)
        {
            var r = [];
            for (var i = 0, len = elems.length; i < len; i++) 
            {
                if ($njs.element.hasClass(elems[i], m)) 
                    r.push(elems[i]);
            }
            elems.length = 0;
            return $njs.array.copy($njs.array.unique(r), elems);
        },
        "pseudo$child": function(m, elems)
        {
            return elems;
        },
        "pseudo$normal": function(m, elems)
        {
            return elems;
        }
    }
    var filter = 
    {
        "attr": 
        {
            "=": function(elem, n, v)
            {
                return v ? elem.getAttribute(n) == v : elem.hasAttribute(n);
            }
        },
        "pseudo$normal": 
        {
            "root": function(elem)
            {
                return true;
            },
            "first-child": function(elem)
            {
                return true;
            },
            "last-child": function(elem)
            {
                return true;
            },
            "first-of-type": function(elem)
            {
                return true;
            },
            "last-of-type": function(elem)
            {
                return true;
            },
            "only-child": function(elem)
            {
                return true;
            },
            "only-of-type": function(elem)
            {
                return true;
            },
            "empty": function(elem)
            {
                return true;
            },
            "link": function(elem)
            {
                return true;
            },
            "visited": function(elem)
            {
                return true;
            },
            "active": function(elem)
            {
                return true;
            },
            "hover": function(elem)
            {
                return true;
            },
            "focus": function(elem)
            {
                return true;
            },
            "target": function(elem)
            {
                return true;
            },
            "enabled": function(elem)
            {
                return true;
            },
            "disabled": function(elem)
            {
                return true;
            },
            "checked": function(elem)
            {
                return true;
            }
        },
        "pseudo$child": 
        {
            "nth-child": function(elem)
            {
                return true;
            },
            "nth-last-child": function(elem)
            {
                return true;
            },
            "nth-of-type": function(elem)
            {
                return true;
            },
            "nth-last-of-type": function(elem)
            {
                return true;
            }
        }
    };
    
    (function()
    {
        var r = [];
        $njs.each(filter["pseudo$normal"], function(k, v)
        {
            r.push(k);
        });
        parse["pseudo$normal"] = new RegExp("^:(" + r.join("|") + ")");
    })();
    
    var Selector = function(selector)
    {
        this.selector = selector;
        this.find = function(root)
        {
           // console.info(selector);
            if (!root) 
                root = [document];
            else 
                if (!root.length) 
                    root = [root];
            var arr, last, a = " " + this.selector;
            do 
            {
                last = a;
                for (var n in parse) 
                    if (arr = parse[n].exec(a)) 
                    {
                        //console.info(arr[0], n);
                        a = a.substr(arr[0].length);
                        parse_f[n](arr, root);
                    }
            }
            while (last != a) //&& root.length > 0
            return root;
        }
    }
    $njs.element.find = function(a, b)
    {
        return new Selector(a).find(b);
    }
    new Selector("a>b >c> d>e a[name=he][name=\"hel\"][ name = hello ] a.class.class E:nth-child(n):nth-last-child(n):nth-of-type(n):nth-last-of-type(n):root:first-child:last-child:first-of-type:last-of-type:only-child:only-of-type:empty:link:visited:active:hover:focus:target:enabled:disabled:checked").find();
})();
