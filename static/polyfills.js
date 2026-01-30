// KoboWeb Polyfills for S40/Old Browsers

// Console safety
if (!window.console) {
    window.console = {
        log: function() {},
        error: function() {},
        warn: function() {}
    };
}

// Date.now polyfill
if (!Date.now) {
    Date.now = function() { return new Date().getTime(); };
}

// Array.indexOf polyfill
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(searchElement, fromIndex) {
        var k;
        if (this == null) throw new TypeError('"this" is null or not defined');
        var O = Object(this);
        var len = O.length >>> 0;
        if (len === 0) return -1;
        var n = +fromIndex || 0;
        if (Math.abs(n) === Infinity) n = 0;
        if (n >= len) return -1;
        k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
        while (k < len) {
            if (k in O && O[k] === searchElement) return k;
            k++;
        }
        return -1;
    };
}

// Object.keys polyfill
if (!Object.keys) {
  Object.keys = (function() {
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

    return function(obj) {
      if (typeof obj !== 'function' && (typeof obj !== 'object' || obj === null)) {
        throw new TypeError('Object.keys called on non-object');
      }

      var result = [], prop, i;

      for (prop in obj) {
        if (hasOwnProperty.call(obj, prop)) {
          result.push(prop);
        }
      }

      if (hasEnumBug) {
        for (i = 0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) {
            result.push(dontEnums[i]);
          }
        }
      }
      return result;
    };
  }());
}

// JSON Polyfill (Simplified)
if (!window.JSON) {
  window.JSON = {
    parse: function(sJSON) { return eval('(' + sJSON + ')'); },
    stringify: function(vContent) {
      if (vContent instanceof Object) {
        var sOutput = "";
        if (Object.prototype.toString.call(vContent) === '[object Array]') {
          for (var i = 0; i < vContent.length; i++) {
             sOutput += this.stringify(vContent[i]);
             if (i < vContent.length - 1) sOutput += ",";
          }
          return "[" + sOutput + "]";
        }
        if (vContent.toString !== Object.prototype.toString) { 
             return '"' + vContent.toString().replace(/"/g, '\\$&') + '"'; 
        }
        for (var sProp in vContent) { 
             if (Object.prototype.hasOwnProperty.call(vContent, sProp)) {
                 sOutput += '"' + sProp.replace(/"/g, '\\$&') + '":' + this.stringify(vContent[sProp]) + ','; 
             }
        }
        if (sOutput.length > 0 && sOutput.charAt(sOutput.length - 1) === ',') {
             sOutput = sOutput.substring(0, sOutput.length - 1);
        }
        return "{" + sOutput + "}";
      }
      return typeof vContent === "string" ? '"' + vContent.replace(/"/g, '\\$&') + '"' : String(vContent);
    }
  };
}

// LocalStorage Safe Wrapper
var SafeStorage = {
    _data: {},
    getItem: function(k) {
        try { if(window.localStorage) return window.localStorage.getItem(k); } catch(e){}
        return this._data[k] || null;
    },
    setItem: function(k, v) {
        try { if(window.localStorage) window.localStorage.setItem(k, v); } catch(e){}
        this._data[k] = v;
    },
    removeItem: function(k) {
        try { if(window.localStorage) window.localStorage.removeItem(k); } catch(e){}
        delete this._data[k];
    },
    clear: function() {
        try { if(window.localStorage) window.localStorage.clear(); } catch(e){}
        this._data = {};
    }
};

// XMLHttpRequest Factory
function createXHR() {
    if (window.XMLHttpRequest) {
        return new XMLHttpRequest();
    }
    try { return new ActiveXObject("Msxml2.XMLHTTP"); } catch(e) {}
    try { return new ActiveXObject("Microsoft.XMLHTTP"); } catch(e) {}
    return null;
}

// getElementsByClassName Polyfill
if (!document.getElementsByClassName) {
    document.getElementsByClassName = function(search) {
        var d = document, elements, pattern, i, results = [];
        if (d.querySelectorAll) { // IE8
            return d.querySelectorAll("." + search);
        }
        if (d.evaluate) { // IE6, IE7
            pattern = ".//*[contains(concat(' ', @class, ' '), ' " + search + " ')]";
            elements = d.evaluate(pattern, d, null, 0, null);
            while ((i = elements.iterateNext())) {
                results.push(i);
            }
        } else {
            elements = d.getElementsByTagName("*");
            pattern = new RegExp("(^|\\s)" + search + "(\\s|$)");
            for (i = 0; i < elements.length; i++) {
                if (pattern.test(elements[i].className)) {
                    results.push(elements[i]);
                }
            }
        }
        return results;
    }
}
