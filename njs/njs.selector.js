/*
 * $njs 1.0 Selector Alpha - Javascript Toolkit
 *
 * Copyright (c) 2010 Henry Liang
 *
 * $Date: 2010-12-12 03:20:00$
 *
 */
(function(){
	var chars = "[\\w\\u0128-\\uFFFF*_-]";
	var parse = 
	{
		id : new RegExp("^#(" + chars + "+)"),
		element : new RegExp("^(?:(?:\\s*(>)\\s*)|\\s+)(" + chars + "+)?"),
		attr : /^(\[)([\w-]+) *([~^$*|]=)?\s*(.*?)\]/,
		class  :  new RegExp("^\\.(" + chars + "+)"),
		pseudo : new RegExp("^:(" + chars + "+)")
	}
	var parse_f =
	{
		id : function(m , elems)
		{
			var r = document.getElementById(m);
			if(!r)
				return [];
			if(elems.length == 1 && elems[0] == document)
			{
				return [r]
			}
			else
			{
				for(var i = 0 , len = elems.length ; i < len ; i++)
				{
					if($njs.element.compareDocumentPosition(elems[i] , r) & 16)
						return [r];
				}
				return [];
			}
		},
		element : function(m , elems)
		{
			var t = $njs.trim(m[2]) || "*";
			var p = $njs.trim(m[1]);
			var r = [];
			if(p == "")
			{
				for(var i = 0 , len = elems.length ; i < len ; i++)
				{
					$njs.array.copy(elems[i].getElementsByTagName(t) , r);
				}
			}
			else if(p == ">")
			{
				var rr = [];
				for(var i = 0 , len = elems.length ; i < len ; i++)
				{
					$njs.array.copy(elems.childNodes , r);
				}
				if(t != "*")
				{
					var rr = [];
					$njs.each(r , function(v , ind)
					{	
						if($njs.element.nodeName(v , t))
							rr.push(v);
					});
					r = rr;
				}
			}
			elems.length = 0;
			return $njs.array.copy($njs.array.unique(r) , elems);
		},
		attr : function(m , elems)
		{
			var n = m[2] , o = m[3] , v = m[4] , f = o ? filter.attr[o] : filter.attr["="];
			var r = [];
			if(!f)
				throw "unknown operation : " + o;
			for(var i = 0 , len = elems.length ; i < len ; i++)
			{
				if(f(n,v,elems[i]))
					r.push(elems[i]);
			}
			elems.length = 0;
			return $njs.array.copy($njs.array.unique(r) , elems);
		},
		class : function( m , elems)
		{
			var r = [];
			for(var i = 0 , len = elems.length ; i < len ; i++)
			{
				if($njs.element.hasClass(elems[i],m))
					r.push(elems[i]);
			}
			elems.length = 0;
			return $njs.array.copy($njs.array.unique(r) , elems);
		},
		pseudo : function(m , elems)
		{
			return elems;
		}
	}
	var filter = 
	{
		attr :  
		{
			"=" : function(n,v,elem){return v ? elem.getAttribute(n) == v : elem.hasAttribute(n);}
		}
	}
	var Selector = function( selector )
	{
		this.selector = selector;
		this.find = function(root)
		{
			if(!root) root = [document]; else if(!root.length) root = [root];
			var arr , last , a  = " " + this.selector;
			do
			{
				last = a;
				for(var n in parse)
					if(arr = parse[n].exec(a))
					{
						a = a.substr(arr[0].length);
						parse_f[n](arr , root);
					}
			}while(last != a) //&& root.length > 0
			return root;
		}
	}
	$njs.element.find = function(a,b) 
	{
		return new Selector(a).find(b);
	}
	new Selector("sss .xxx > xsdsds[a] ds[a = 2] dsdadas:nthsdschild xxx.cxcx:dsd#sdds>dsds:nth-child(2)").find();
})();