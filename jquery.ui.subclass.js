// Copyright (c) 2013 Daniel Wachsstock
// Version 2.0
// documentation at http://github.bililite.com/extending-widgets.html
// MIT license:
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following
// conditions:

// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.
(function($){

// allow _init, _create, and _destroy to automatically call _super
var oldwidget = $.widget;
$.widget = function(name, base, prototype){
	var proto = $.extend({}, prototype); // copy it so it can be reused
	for (key in proto) if (proto.hasOwnProperty(key)) switch (key){
		case '_create':
			var create = proto._create;
			proto._create = function(){
				this.super();
				create.apply(this);
			};
		break;
		case '_init':
			var init = proto._init;
			proto._init = function(){
				this._super();
				init.apply(this);
			};
		break;
		case '_destroy':
			var destroy = proto._destroy;
			proto.destroy = function(){
				destroy.apply(this);
				this._super();
			};
		break;
	}
	return oldwidget.call(this, name, base, proto); // set up the widget as usual
};
$.widget.extend = oldwidget.extend;
$.widget.bridge = oldwidget.bridge;

// implement Aspect-Oriented Programming
$.extend($.Widget.prototype, {
	yield: null,
	returnValues: { },
	before: function(method, f) {
		var original = this[method];
		this[method] = function() {
			f.apply(this, arguments);
			return original.apply(this, arguments);
		};
	},
	after: function(method, f) {
		var original = this[method];
		this[method] = function() {
			this.returnValues[method] = original.apply(this, arguments);
			return f.apply(this, arguments);
		}
	},
	around: function(method, f) {
		var original = this[method];
		this[method] = function() {
			var tmp = this.yield;
			this.yield = original;
			var ret = f.apply(this, arguments);
			this.yield = tmp;
			return ret;
		}
	}
});

})(jQuery)