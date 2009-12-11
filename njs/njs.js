/*
 * $njs 1.0 Alpha - Javascript Toolkit
 *
 * Copyright (c) 2010 Henry Liang
 *
 * $Date: 2010-12-12 03:20:00$
 *
 */
window["undefined"]=window["undefined"];

var $njs = {extend : function()
{
	var target = arguments[0] || {}, i = 1, length = arguments.length, deep = false, options;
	
	if ( target.constructor == Boolean )
	{
		deep = target;
		target = arguments[1] || {};
		i = 2;
	}
	if ( typeof target != "object" && typeof target != "function" )
		target = {};
	
	if ( length == 1 )
	{
		target = this;
		i = 0;
	}
	for ( ; i < length; i++ )
		if ( (options = arguments[ i ]) != null )
			for ( var name in options )
			{
				if ( target === options[ name ] )
					continue;
	
				if ( deep && options[ name ] && typeof options[ name ] == "object" && target[ name ] && !options[ name ].nodeType )
					target[ name ] = $njs.extend( target[ name ], options[ name ] );
				else if(typeof options[ name ] == "function" && target[ name ] != undefined && target[ name ] != options[ name ])
				{
					var f = target[ name ];
					target[ name ] = options[ name ];
				}
				else if ( options[ name ] != undefined )
					target[ name ] = options[ name ];
			}
	return target;
}};

$njs.browser = 
{
	version: (navigator.userAgent.toLowerCase().match( /.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/ ) || [])[1],
	safari: /webkit/.test( navigator.userAgent.toLowerCase() ),
	opera: /opera/.test( navigator.userAgent.toLowerCase() ),
	msie: /msie/.test( navigator.userAgent.toLowerCase() ) && !/opera/.test( navigator.userAgent.toLowerCase() ),
	mozilla: /mozilla/.test( navigator.userAgent.toLowerCase() ) && !/(compatible|webkit)/.test( navigator.userAgent.toLowerCase() )
};
//
$njs.extend($njs,
{
	each : function( object, callback )
	{
		var name, i = 0, length = object.length;
		if ( length === undefined )
		{
			for ( name in object )
				if ( callback.call( object[ name ], name, object[ name ] ) === false )
					break;
		} else
			for ( var value = object[0];
				i < length && callback.call( value, i, value ) !== false; value = object[++i] ){}
	},
	globalId : function()
	{
		if(agruments.callee.gid = null)
			agruments.callee.gid = new Date().getTime() + "" + Math.floor(Math.random() * 100000);
		return agruments.callee.gid * 1 + 1 + "";
	},
	element : {},
	array : {},
	event : {},
	ajax : {}
});
$njs.extend($njs.element,
{
	addClass : function(ele,name)
	{
		if(arguments.length  == 2)
		{
			if(!$njs.element.hasClass(ele,name))
			{
				ele.className = ele.className + " " + name;
			}
		}
		else
			for(var i = 1 ; i < arguments.length ; i++)
				arguments.callee(ele,arguments[i]);

	},
	hasClass : function(ele,name)
	{
		var cla = ele.className.split(/\s+/);
		for(var i = 0 ; i < cla.length ; i++)
			if(cla[i] == name)
				return true;
		return false;
	},
	removeClass : function(ele,name)
	{
		if(arguments.length  == 2)
		{
			var cla = ele.className.split(/\s+/);
			for(var i = 0 ; i < cla.length ; i++)
				if(cla[i] == name)
					cla.splice(i--,1);
			ele.className = cla.join(" ");
		}
		else
			for(var i = 1 ; i < arguments.length ; i++)
				arguments.callee(ele,arguments[i]);
	},
	addEvent : function(elem,type,handle)
	{
		if (elem.addEventListener)
			elem.addEventListener(type, handle, false);
		else if (elem.attachEvent)
			elem.attachEvent("on" + type, handle);
	},
	removeEvent : function(elem,type,handle)
	{
		if (elem.removeEventListener)
			elem.removeEventListener(type, handle , false);
		else if (elem.detachEvent)
			elem.detachEvent("on" + type,handle);
	},
	swap: function( elem, options, callback ) {
		var old = {};

		for ( var name in options ) {
			old[ name ] = elem.style[ name ];
			elem.style[ name ] = options[ name ];
		}

		callback.call( elem );

		for ( var name in options )
			elem.style[ name ] = old[ name ];
	},
	css : function(ele,name,value)
	{
		if (value == null &&( name == "width" || name == "height" ))
		{
			var val, props = { position: "absolute", visibility: "hidden", display:"block" }, which = name == "width" ? [ "Left", "Right" ] : [ "Top", "Bottom" ];

			function getWH() {
				val = name == "width" ? ele.offsetWidth : ele.offsetHeight;
				var padding = 0, border = 0;
				$njs.each( which, function(a) 
				{
					padding += parseFloat(JSNative.css( ele, "padding" + a)) || 0;
					border += parseFloat(JSNative.css( ele, "border" + a + "Width")) || 0;
				});
				val -= Math.round(padding + border);
			}

			if (ele.style.display != "none")
				getWH();
			else
				$njs.swap( ele, props, getWH );

			return Math.max(0, val);
		}


		return $njs.attr(ele.style,name,value);
	},
	attr : function(ele,name,value)
	{

		switch(name)
		{
			case "class":name = "className";
			default : ;
		}

		//tag
		if(ele.tagName)
		{
			if(value)
				ele[name] = value;
			return ele[name];
		}

		//style
		if(name == "opacity")
		{

			if ( $njs.browser.msie)
			{	
				if ( value )
				{
					ele.zoom = 1;
					ele.filter = (ele.filter || "").replace( /alpha\([^)]*\)/, "" ) +
						(parseInt( value ) + '' == "NaN" ? "" : "alpha(opacity=" + value * 100 + ")");
				}

				return ele.filter && ele.filter.indexOf("opacity=") >= 0 ?
					(parseFloat( ele.filter.match(/opacity=([^)]*)/)[1] ) / 100) + '':
					"";
			}
			else if ( JSNative.browser.mozilla )
			{
				name = "MozOpacity";
			}
		}
		if(value)
			ele[name] = value;
		return ele[name];
		
	},
	trim : function(text)
	{
		return (text || "").replace(/^\s+/, "").replace(/\s+$/,""); 
	},
	offset : function(e,p)
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
		return {x:left, y:top} ;
	}
});
$njs.extend($njs.array,
{
	unique : function( array )
	{
		var ret = [], done = {};

		for ( var i = 0, length = array.length; i < length; i++ ) 
		{
			if ( !done[ array[ i ] ] ) 
			{
				done[ array[ i ] ] = true;
				ret.push( array[ i ] );
			}
		}

		return ret;

	},
	inArray : function( arr , e )
	{
		for(var i = 0 ; i < arr.length ; i++)
			if(arr[i] == e)
				return i;
		return -1;
	}
});
$njs.extend($njs.event,
{
	offset : function(ev)
	{
		if(ev.pageX || ev.pageY)
		{
			return {x:ev.pageX, y:ev.pageY};
		}
		return { x:ev.clientX + Math.max(document.body.scrollLeft,document.documentElement.scrollLeft) - Math.max(document.body.clientLeft,document.documentElement.clientLeft) , 
			y:ev.clientY + Math.max(document.body.scrollTop,document.documentElement.scrollTop) - Math.max(document.body.clientTop,document.documentElement.clientTop) }; 
	}
})
$njs.extend($njs.ajax,
{
	httpSuccess : function(r)
	{
		try
		{
			return !r.status && location.protocol == "file:" ||( r.status >= 200 && r.status < 300 ) || r.status == 304 || r.status == 1223;
		}catch(e){}
		return false;
	},
	request : function(obj)
	{
		obj = $njs.extend({type:"post",url:"",data:null,username:null,password:null,async:false,contentType: "application/x-www-form-urlencoded",complete:function(){}},obj || {});

		var xhr = window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
		if( obj.username )
			xhr.open(obj.type, obj.url, obj.async, obj.username, obj.password);
		else
			xhr.open(obj.type, obj.url, obj.async);

		xhr.setRequestHeader("Content-Type", obj.contentType);
		xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		xhr.onreadystatechange = function()
		{
			if(xhr.readyState == 4)
			{
				
				if(JSNative.httpSuccess(xhr))
				{
					obj.complete.call(window,"success",xhr);
				}
				else
				{
					obj.complete.call(window,"error",xhr);
				}
			}
		}
		xhr.send(obj.data);
		return xhr;
	},
	get : function(url,func)
	{
		if(func)
		{
			return $njs.ajax.request({type:"get",url:url,complete:func,async:true});
		}
		else
		{
			return $njs.ajax.request({type:"get",url:url,async:false});
		}
	},
	post : function(url,data,func)
	{
		if(func)
		{
			return $njs.ajax.request({type:"post",url:url,data:data,complete:func,async:true});
		}
		else
		{
			return $njs.ajax.request({type:"post",url:url,data:data,async:false});
		}
	}
});