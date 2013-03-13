// textpopup and hebrew keyboard widgets
// Version: 1.4
// dependencies: jquery.ui.subclass.js (mine), ui.core.js, effects.core.js (from jQuery UI 1.8)
// Copyright (c) 2010 Daniel Wachsstock
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

// Modified: 2010-11-23

(function($){
	$.ui.widget.subclass('ui.textpopup', {
		_init: function(){
			var self = this;
			this._hideOnOutsideClick(this.options.hideOnOutsideClick);
			// if options.position is an object suitable for passing to $.fn.position (field 'my' is defined) then use it; otherwise use the string shortcuts
			// if we use the string shortcuts, make sure we make a copy rather than changing the original
			this._position = this.options.position.my ? this.options.position : $.extend({},position[this.options.position]);
			// the position should usually be relative to the containing box or the element, but the user can override that.
			if (!this._position.of) this._position.of = this.options.box || this.element;
			if (!this._position.collision) this._position.collision = 'none';
			// turn the speed into an array to be used with Function.apply
			this._speed = $.isArray(this.options.speed) ? this.options.speed : [this.options.speed];
			var trigger = this.options.trigger;
			if (trigger == 'self'){
				trigger = this.element;
			}
			if (this._triggerElement) $(trigger).unbind('.textpopup'); // don't forget to remove the old bindings 
			// note that for elements that can get focus, self.show will be called twice (but we test for :visible so it doesn't animate twice)
			if (trigger) this._triggerElement = $(trigger).bind('focus.textpopup click.textpopup', function (){
				self.show(); 
				// allow the default behavior
			});
			// bug inducing note: this._trigger is the function, this._triggerElement is the element
		},
		position: function(){
			var display = this.box().css('display');
			this.box().css({display: 'block', visibility: 'hidden'}).
				position(this._position).
				css({display: display, visibility: 'visible'});
		},
		show: function(){
			// See http://wiki.codetalks.org/wiki/index.php/Docs/Keyboard_navigable_JS_widgets for manipulating tabindex
			var self = this, box = self.box().attr('tabindex', 0);
			if (box.is(':visible, :animated')) return;
			self.position();
			self.options.show.apply(box, this._speed);
			box.queue(function(){self._trigger('shown'); box.dequeue()});
		},
		hide: function(){
			// having a hidden box with a tabindex bothers the browser to no end
			var self = this, box = self.box().removeAttr('tabindex');
			if (box.is(':hidden')) return;
			self.options.hide.apply(box, this._speed);
			box.queue(function(){self._trigger('hidden'); box.dequeue()});
		},
		box: function(){
			// lazy create
			return this.theBox || this._createBox();
		},
		_createBox: function(){
			var self = this;
			var css = this.options.box ? {display: 'inline-block'} : {position: 'absolute', display: 'none'};
			var box = $('<div/>').
				appendTo(this.options.box || 'body').
				css(css).
				addClass(this.options['class']).
				keydown(function(e) {
					if (e.keyCode == $.ui.keyCode.ESCAPE) {
						self.element.focus();
						if (self.options.hideOnOutsideClick) self.hide();
					}
				});
			this.theBox = box;
			box.data('textpopup', this);
			this._fill(box);
			this._trigger('created', 0, box);
			return box;
		},
		_fill: function(box){
			// virtual method to put something in the box
		},
		// hides the box for any click outside it. fails for clicks in textboxes, since the click does not bubble up to the body
		_hideOnOutsideClick: function(flag){
			var self = this;
			var $body = $('body');
			if (flag){
				var hider = function(e){ if(!self._isClickInside(e)) self.hide(); };
				this.after('show', function(){
					$body.unbind('click.textpopup', hider); // we don't want to double hide
					$body.bind('click.textpopup', hider);
				});
				this.before('hide', function(){
					$body.unbind('click.textpopup', hider);
				});
			}else{
				$body.unbind ('click.textpopup');
			}
		},
		destroy: function() {
			this.box().remove();
			if (this._triggerElement) this._triggerElement.unbind ('.textpopup');
			$('body').unbind('.textpopup');
			this.theBox = undefined;
		},
		// returns true if the event e is a click inside the box , the original element or the triggering elements
		_setOption: function(key, value) {
			this._super(key, value);
			if (key == 'trigger' || 'hideOnOutsideClick' || 'position' || 'speed') this._init;
			if (key == 'class') this.box().attr('class', value);
		},
		_isClickInside: function(e){
			var keepers = $([]).add(this._triggerElement).add(this.box()).add(this.element);
			for (var elem = e.target; elem; elem = elem.parentNode) if (keepers.index(elem) > -1) return true;
			return false;
		},
		options: {
			show: $.fn.show,
			hide: $.fn.hide,
			speed: 'slow',
			hideOnOutsideClick: true,
			position: 'tl',
			trigger: 'self',
			'class': 'ui-textpopup-box'
		}
	});

	// position for the textpopup relative to the input box. rt means right side, aligned to top; tr means top side, aligned to right
	var position = {
		tl: {my: 'left bottom', at: 'left top'},
		tr: {my: 'right bottom ', at: 'right top'},
		bl: {my: 'left top', at: 'left bottom'},
		br: {my: 'right top', at: 'right bottom'},
		lt: {my: 'right top', at: 'left top'},
		rt: {my: 'left top', at: 'right top'},
		lb: {my: 'right bottom', at: 'left bottom'},
		rb: {my: 'left bottom', at: 'right bottom'}
	};
	
	// a textpopup that loads its HTML from an external (Ajax) , fixed file (it's loaded once when needed at first, then saved)
	// defaults.url must be defined
	// includes a hack to allow data: urls even in IE (checks the url for 'data:,' then treats it specially)
	$.ui.textpopup.subclass('ui.ajaxpopup', {
		_html: undefined, // lazy load the code
		_fill: function(box){
			var self = this;
			if (!self._html){
				box.append($(self.options.busy));
				var url = self.options.url;
				if (/^data:[^,]*,/.test(url)){
					setHTML(decodeURIComponent(url.replace(/^data:[^,]*,/, '')));
				}else{
					$.get(url, setHTML, 'text');
				}
			}else{
				box.html(self._html);
			}
			function setHTML(data){
				self._html = data.replace(/<style(\S|\s)*style>/, function(style){
					$('head').append(style); // styles only go in the head, and don't need to be appended more than once
					return '';
				});
				box.html(self._html);
				if (box.is(':animated, :visible')){ // restart the effect
					box.stop(true, true).hide();
					self.show();
				}
			}
		},
		options: {
			busy: '<img src="http://bililite.com/images/busy/wait22.gif" />'
		}
	});
	
	var keymap = {
		81: '"',
		87: "'",
		69: 'ק',
		82: 'ר',
		84: 'א',
		89: 'ט',
		85: 'ו',
		73: 'ן',
		79: 'ם',
		80: 'פ',
		91: ':',
		93: ';',
		65: 'ש',
		83: 'ד',
		68: 'ג',
		70: 'כ',
		71: 'ע',
		72: 'י',
		74: 'ח',
		75: 'ל',
		76: 'ך',
		59: 'ף',
		39: ',',
		90: 'ז',
		88: 'ס',
		67: 'ב',
		86: 'ה',
		66: 'נ',
		78: 'מ',
		77: 'צ',
		44: 'ת',
		46: 'ץ',
		47: '.'
	};
	// add the lower cases
	for (var c in keymap) if (c >= 65 && c <= 90) keymap[parseInt(c)+97-65] = keymap[c];

	$.ui.ajaxpopup.subclass('ui.hebrewKeyboard', {
		_capsLock: false,
		_fill: function(box){
			var self = this;
			this._super(box);
			box.click(function(e){
				if ($(e.target).is('.key')) {
					self.element.sendkeys(e.target.title);
					return false;
				}
			});
			this.element.keypress(function(evt){
				if (self._capsLock && !evt.metaKey && !evt.ctrlKey && keymap[evt.which]){
					self.element.sendkeys(keymap[evt.which]);
					return false;
				}
			}).keyup(function(evt){
				if (evt.which == $.ui.keyCode.CAPS_LOCK){
					self._capsLock = !self._capsLock;
					self.box().find('.capsLock').text(self._capsLock ? self.options.capslockOn : self.options.capslockOff);
				}
				if (self._capsLock){
					self.box().find('.k'+evt.which).removeClass('hover');
				}
			}).keydown(function(evt){
				if (self._capsLock){
					self.box().find('.k'+evt.which).addClass('hover');
				}
			});
		},
		options: {
			url: '/inc/keyboard.html',
			capslockOff: 'Press the Caps Lock key to use the physical keyboard',
			capslockOn: 'Press the Caps Lock key to restore the physical keyboard'
		}	
	});

})(jQuery);
