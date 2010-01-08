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
		t = t.replace(/\\/g, '\\\\');
		t = t.replace(/\n/g, '\\n');
		t = t.replace(/"/g, '\\"');
		return "_OUT.Write(\"" + t + "\");";
	}
	var wrapFunction = function(t)
	{
		return t.charAt(0) == "="? "_OUT.Write(" + t.substr(1) + ");" : t;
	}
	var _newT = function(func)
	{
		this.process = function(data)
		{
			var arr = [];
			var _OUT = 
			{
				Write : function(t){arr.push(t);}
			}
			func(_OUT , data);
			return arr.join("");
		}
	}
    var parse = function(text)
	{
		var l = 0;
		var n , nn , r = ["function(_OUT,_CONTEXT){with(_CONTEXT){"];
		while((n = text.indexOf("<#",l)) != -1 && (nn = text.indexOf("#>",n)) != -1)
		{
			r.push(wrapText(text.substring(l,n)));
			r.push(wrapFunction(text.substring(n + 2,nn)));
			l = nn + 2;
		}
		if(l < text.length)
			r.push(wrapText(text.substr(l)));
		r.push("}}");
		return eval("EasyTemplate_TEMP_FUNCTION=" + r.join("") + ";EasyTemplate_TEMP_FUNCTION");
	}
	window.EasyTemplate =
	{
		parse : function(text)
		{
			return new _newT(parse(text));
		}
	}
})();