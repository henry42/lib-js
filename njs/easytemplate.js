/*
 * $njs 1.0 Easy Template
 *
 * Copyright (c) 2010 Henry Liang
 *
 * $Date: 2010-12-12 03:20:00$
 *
 */
(function()
{
	var wrapText = function(t)
	{
		t = t.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, "\\\"");
		return "_Write(\"" + t + "\");";
	}
	var wrapFunction = function(t)
	{
		return t.charAt(0) == "="? "_Write(" + t.substr(1) + ");" : t + ";";
	}
	var _newT = function(func)
	{
		this.process = function(data,onerror)
		{
			var arr = [];
			try
			{
				func(function(t){arr.push(t);} , data);
			}
			catch (e)
			{
				if(typeof onerror == "function")
				{
					onerror(arr.join("") + "[" + e.message + "]");
					return "";
				}
				else
					throw e;
			}
			return arr.join("");
		}
	}
    var parse = function(text,beginTag,endTag)
	{
		var l = 0 , n , nn , r = ["function(_Write,_CONTEXT){with(_CONTEXT){"] , beginTag = beginTag || "<#" , endTag = endTag || "#>";
		while((n = text.indexOf(beginTag,l)) != -1 && (nn = text.indexOf(endTag,n)) != -1)
		{
			r.push(wrapText(text.substring(l,n)),wrapFunction(text.substring(n + 2,nn)));
			l = nn + 2;
		}
		if(l < text.length)
			r.push(wrapText(text.substr(l)));
		r.push("}}");
		return eval("EasyTemplate_TEMP_FUNCTION=" + r.join("") + ";EasyTemplate_TEMP_FUNCTION");
	}
	window.EasyTemplate =
	{
		parse : function(text , beginTag , endTag)
		{
			return new _newT(parse(text, beginTag , endTag));
		}
	}
})();