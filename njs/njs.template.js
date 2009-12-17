/*
 * $njs 1.0 Template Alpha - Javascript Toolkit
 *
 * Copyright (c) 2010 Henry Liang
 *
 * $Date: 2010-12-12 03:20:00$
 *
 */
(function()
{
    function _newT(tmplName, context, fs, func, etc)
    {
        this.process = function(context, flags)
        {
            if (context == null) 
                context = {};
            if (context._MODIFIERS == null) 
                context._MODIFIERS = {};
            if (context.defined == null) 
                context.defined = function(str)
                {
                    return (context[str] != undefined);
                };
            for (var k in etc.modifierDef) 
            {
                if (context._MODIFIERS[k] == null) 
                    context._MODIFIERS[k] = etc.modifierDef[k];
            }
            if (flags == null) 
                flags = {};
            var arr = [];
            var out = 
            {
                write: function(m)
                {
                    arr.push(m);
                }
            };
            try 
            {
                func(out, context, flags);
            } 
            catch (e) 
            {
                if (flags.throwExceptions == true) 
                    throw e;
                var result = new String(arr.join("") + "[ERROR: " + e.toString() + (e.message ? '; ' + e.message : '') + "]");
                result["exception"] = e;
                return result;
            }
            return arr.join("");
        }
        this.name = tmplName;
        this.source = fs;
        this.func = func;
        this.toString = function()
        {
            return "$njs Template [" + tmplName + "]";
        }
    }
    var nextDelimiter = function(body, index, delimiter)
    {
        var end = index, length = delimiter.length, ch = delimiter.charAt(0), sS = "";
        while (++end < body.length) 
        {
            var c = body.charAt(end);
            if (sS) 
            {
                if (c == "\\") 
                {
                    if (body.charAt(end + 1) == "u") 
                        end = end + 5;
                    else 
                        if (body.charAt(end + 1) == "x") 
                            end = end + 3;
                        else 
                            end = end + 1;
                    
                }
                else 
                    if (sS == c) 
                        sS = "";
            }
            else 
            {
                if (c == "\"" || c == "'") 
                    sS = c;
                else 
                    if (c == ch && body.substr(end, length).indexOf(delimiter) == 0) 
                        return end;
            }
        }
        return -1;
    }
    var nextStmt = function(body, index, left_delimiter, right_delimiter, special_delimiter)
    {
        var length = body.length, start = c_start = body.indexOf(left_delimiter, index), c_end, prefix, suffix;
        
        if (start != -1) 
        {
            if (body.substr(c_start + 1, special_delimiter.length).indexOf(special_delimiter) == 0) 
            {
                right_delimiter = special_delimiter + right_delimiter;
                c_start = start + special_delimiter.length;
            }
            if (body.charAt(start - 1) == "$") 
            {
                start = start - 1;
            }
            prefix = body.substring(start, c_start + 1);
            c_end = nextDelimiter(body, c_start + 1, right_delimiter);
        }
        if (c_end != -1) 
            return {
                start: start,
                end: c_end + right_delimiter.length,
                prefix: prefix,
                suffix: body.substring(c_end, c_end + right_delimiter.length),
                content: body.substring(c_start + 1, c_end)
            };
        else 
            return {
                start: -1,
                end: -1,
                prefix: null,
                suffix: null,
                content: null
            }
    }
    var _parseText = function(body, tmplName, etc)
    {
        body = cleanWhiteSpace(body);
        var left_delimiter = etc.left_delimiter;
        var right_delimiter = etc.right_delimiter;
        var special_delimiter = etc.special_delimiter;
        
        var funcText = ["function(_OUT, _CONTEXT, _FLAGS) { with (_CONTEXT) {"];
        var state = 
        {
            stack: [],
            line: 1
        };
        var lastStmtIndex = 0;
        var lastIndex = lastStmtIndex;
        
        while (true) 
        {
            var lastStmt = nextStmt(body, lastIndex, left_delimiter, right_delimiter, special_delimiter);
            
            if (lastStmt.start == -1) 
                break;
            
            if (lastStmt.content.match(/^(cdata|minify|eval)/)) 
            {
                lastStmtIndex = emitSpecialStatement(body, lastStmt, etc, funcText);
            }
            else 
                if ((lastStmt.content.charAt(0) == "/" && lastStmt.content.substr(1, 11).search(etc.statementTag) == 0) || lastStmt.content.substr(0, 10).search(etc.statementTag) == 0) 
                {
                    emitSectionText(body.substring(lastStmtIndex, lastStmt.start), funcText);
                    emitStatement(lastStmt.content, state, funcText, tmplName, etc);
                    lastStmtIndex = lastStmt.end;
                }
                else 
                    if (lastStmt.prefix.charAt(0) == "$") 
                    {
                        emitSectionText(body.substring(lastStmtIndex, lastStmt.start), funcText);
                        emitExpression(lastStmt.content, funcText);
                        lastStmtIndex = lastStmt.end;
                    }
            
            lastIndex = lastStmt.end;
        }
        
        emitSectionText(body.substring(lastStmtIndex), funcText);
        if (state.stack.length != 0) 
            throw new error(tmplName + " unclosed, unmatched statement(s): " + state.stack.join(","));
        funcText.push("}};");
        return funcText.join("");
    }
    
    var emitStatement = function(stmtStr, state, funcText, tmplName, etc)
    {
        var parts = stmtStr.split(' ');
        var stmt = etc.statementDef[parts[0]]; // Here, parts[0] == for/if/else/...
        if (stmt == null) 
        { // Not a real statement.
            emitSectionText(stmtStr, funcText);
            return;
        }
        if (stmt.delta < 0) 
        {
            if (state.stack.length <= 0) 
                throw new error(tmplName + " close tag does not match any previous statement: " + stmtStr);
            state.stack.pop();
        }
        if (stmt.delta > 0) 
            state.stack.push(stmtStr);
        
        if (stmt.paramMin != null &&
        stmt.paramMin >= parts.length) 
            throw new error(tmplName + " statement needs more parameters: " + stmtStr);
        if (stmt.prefixFunc != null) 
            funcText.push(stmt.prefixFunc(parts, state, tmplName, etc));
        else 
            funcText.push(stmt.prefix);
        if (stmt.suffix != null) 
        {
            if (parts.length <= 1) 
            {
                if (stmt.paramDefault != null) 
                    funcText.push(stmt.paramDefault);
            }
            else 
            {
                for (var i = 1; i < parts.length; i++) 
                {
                    if (i > 1) 
                        funcText.push(' ');
                    funcText.push(parts[i]);
                }
            }
            funcText.push(stmt.suffix);
        }
    }
    
    var emitSectionText = function(text, funcText)
    {
        if (text.length <= 0) 
            return;
        emitText(text, funcText);
    }
    
    var emitSpecialStatement = function(body, stmt, etc, funcText)
    {
        var left_delimiter = etc.left_delimiter;
        var right_delimiter = etc.right_delimiter;
        var special_delimiter = etc.special_delimiter;
        
        var blockrx = stmt.content.match(/^(cdata|minify|eval)/);
        if (blockrx) 
        {
            var blockType = blockrx[1];
            var blockMarker;
            if (blockType == stmt.content) 
            {
                blockMarker = stmt.prefix + "/" + blockType + stmt.suffix;
            }
            else 
            {
                blockMarker = stmt.content.substr(blockType.length + 1);
            }
            
            var blockEnd = body.indexOf(blockMarker, stmt.end + 1);
            if (blockEnd >= 0) 
            {
                var blockText = body.substring(stmt.end, blockEnd);
                if (blockType == 'cdata') 
                {
                    emitText(blockText, funcText);
                }
                else 
                    if (blockType == 'minify') 
                    {
                        emitText(scrubWhiteSpace(blockText), funcText);
                    }
                    else 
                        if (blockType == 'eval') 
                        {
                            if (blockText != null && blockText.length > 0) 
                                funcText.push('_OUT.write( (function() { ' + blockText + ' })() );');
                        }
                return blockEnd + blockMarker.length;
            }
        }
        emitSectionText(body.substring(stmt.start, stmt.end), funcText);
        return stmt.end;
    }
    var emitText = function(text, funcText)
    {
        if (text == null ||
        text.length <= 0) 
            return;
        text = text.replace(/\\/g, '\\\\');
        text = text.replace(/\n/g, '\\n');
        text = text.replace(/"/g, '\\"');
        funcText.push('_OUT.write("');
        funcText.push(text);
        funcText.push('");');
    }
    
    var emitExpression = function(expr, funcText)
    {
        var ind = last = -1, r = [];
        while (ind = nextDelimiter(expr, last + 1, "|") != -1) 
        {
            r.push(expr.substring(last + 1, ind));
            last = ind;
        }
        r.push(expr.substr(last + 1));
        funcText.push('_OUT.write(');
        emitExpressionArray(r, r.length - 1, funcText);
        funcText.push(');');
    }
    var emitExpressionArray = function(exprArr, index, funcText)
    {
        var expr = exprArr[index];
        if (index <= 0) 
        {
            funcText.push(expr);
            return;
        }
        var parts = expr.split(':');
        funcText.push('_MODIFIERS["');
        funcText.push(parts[0]);
        funcText.push('"](');
        emitExpression(exprArr, index - 1, funcText);
        if (parts.length > 1) 
        {
            funcText.push(',');
            funcText.push(parts.slice(1).join(":"));
        }
        funcText.push(')');
    }
    
    var cleanWhiteSpace = function(result)
    {
        result = result.replace(/\t/g, "    ");
        result = result.replace(/\r\n/g, "\n");
        result = result.replace(/\r/g, "\n");
        result = result.replace(/^(\s*\S*(\s+\S+)*)\s*$/, '$1');
        return result;
    }
    
    var scrubWhiteSpace = function(result)
    {
        result = result.replace(/^\s+/g, "");
        result = result.replace(/\s+$/g, "");
        result = result.replace(/\s+/g, " ");
        result = result.replace(/^(\s*\S*(\s+\S+)*)\s*$/, '$1');
        return result;
    }
    $njs.template = 
    {
        etc: 
        {
            left_delimiter: "{",
            right_delimiter: "}",
            special_delimiter: "%",
            statementTag: "forelse|for|if|elseif|else|var|macro",
            statementDef: 
            {
                "if": 
                {
                    delta: 1,
                    prefix: "if(",
                    suffix: "){",
                    paramMin: 1
                },
                "else": 
                {
                    delta: 0,
                    prefix: "}else{"
                },
                "elseif": 
                {
                    delta: 0,
                    prefix: "}else if(",
                    suffix: "){",
                    paramDefault: "true"
                },
                "/if": 
                {
                    delta: -1,
                    prefix: "}"
                },
                "for": 
                {
                    delta: 1,
                    paramMin: 3,
                    prefixFunc: function(stmtParts, state, tmplName, etc)
                    {
                        if (stmtParts[2] != "in") 
                            throw new error(tmplName, state.line, "bad for loop statement: " + stmtParts.join(' '));
                        var iterVar = stmtParts[1];
                        var listVar = "__LIST__" + iterVar;
                        return ["var ", listVar, " = ", stmtParts[3], ";", "var __LENGTH_STACK__;", "if (typeof(__LENGTH_STACK__) == 'undefined' || !__LENGTH_STACK__.length) __LENGTH_STACK__ = new Array();", "__LENGTH_STACK__[__LENGTH_STACK__.length] = 0;", "if ((", listVar, ") != null) { ", "var ", iterVar, "_ct = 0;", "for (var ", iterVar, "_index in ", listVar, ") { ", iterVar, "_ct++;", "if (typeof(", listVar, "[", iterVar, "_index]) == 'function') {continue;}", "__LENGTH_STACK__[__LENGTH_STACK__.length - 1]++;", "var ", iterVar, " = ", listVar, "[", iterVar, "_index];"].join("");
                    }
                },
                "forelse": 
                {
                    delta: 0,
                    prefix: "} } if (__LENGTH_STACK__[__LENGTH_STACK__.length - 1] == 0) { if (",
                    suffix: ") {",
                    paramDefault: "true"
                },
                "/for": 
                {
                    delta: -1,
                    prefix: "} }; __LENGTH_STACK__.length--;"
                },
                "var": 
                {
                    delta: 0,
                    prefix: "var ",
                    suffix: ";"
                },
                "macro": 
                {
                    delta: 1,
                    prefixFunc: function(stmtParts, state, tmplName, etc)
                    {
                        var macroName = stmtParts[1].split('(')[0];
                        return ["var ", macroName, " = function", stmtParts.slice(1).join(' ').substring(macroName.length), "{ var _OUT_arr=[]; var _OUT={ write:function(m) { if(m)_OUT_arr.push(m);}};"].join('');
                    }
                },
                "/macro": 
                {
                    delta: -1,
                    prefix: " return _OUT_arr.join(''); };"
                }
            },
            modifierDef: 
            {
                "eat": function(v)
                {
                    return "";
                },
                "escape": function(s)
                {
                    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                },
                "capitalize": function(s)
                {
                    return String(s).toUpperCase();
                },
                "default": function(s, d)
                {
                    return s != null ? s : d;
                }
            }
        },
        parse: function(context, name, etc)
        {
            if (etc == null) 
                etc = $njs.template.etc;
            var fs = _parseText(context, name, etc);
            var func = eval("var $njs_TEMP_TEMPLATE = " + fs + ";$njs_TEMP_TEMPLATE");
            if (func != null) 
                return new _newT(name || "UNKNOWN TEMPLATE", context, fs, func, etc);
            return null;
        }
    }
})();
