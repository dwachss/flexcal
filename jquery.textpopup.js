// textpopup and hebrew keyboard widgets
// Version: 2.2.1
// dependencies: jquery.ui.subclass.js (mine), ui.core.js, effects.core.js (from jQuery UI)
// Copyright (c) 2015 Daniel Wachsstock
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
	$.widget('bililite.textpopup', {
		_init: function(){
			var self = this;
			if (this.options.box) this.options.hideOnOutsideClick = false; // never auto-hide for inline boxes
			this._hideOnOutsideClick(this.options.hideOnOutsideClick);
			// if options.position is an object suitable for passing to $.fn.position (field 'my' is defined) then use it; otherwise use the string shortcuts
			this._position = $.extend({
				of: this.element, // the input element that flexcal was called on
				collision: 'none',
				using: function(to) { $(this).stop(true, false).animate(to) } // animate the repositioning	
			}, this.options.position.my ? this.options.position : position[this.options.position]);
			// turn the duration into an array to be used with Function.apply
			this._duration = $.isArray(this.options.duration) ? this.options.duration : [this.options.duration];
			var trigger = this.options.trigger;
			if (trigger == 'self'){
				trigger = this.element;
			}
			if (this._triggerElement) $(trigger).unbind('.textpopup');
			if (trigger){
				this._triggerElement = $(trigger);
				this._triggerElement.filter(":focusable").bind('focus.textpopup', self.show.bind(self));
				this._triggerElement.filter(":not(:focusable)").bind('click.textpopup', self.show.bind(self));
			}
			// bug inducing note: this._trigger is the function, this._triggerElement is the element
		},
		position: function(){
			if (this.options.box) return; // don't change position for inline boxes
			var display = this._box().css('display');
			this._box().css({display: 'block', visibility: 'hidden'}).
				position(this._position).
				css({display: display, visibility: 'visible'});
		},
		show: function(){
			var self = this, box = self._box().attr('tabindex', 0);
			if (box.is(':visible, :animated')) return;
			self.position();
			self.options.show.apply(box, this._duration);
			box.queue(function(){
				self._trigger('shown');
				box.dequeue()
			});
		},
		hide: function(){
			// having a hidden box with a tabindex bothers the browser to no end
			var self = this, box = self._box().removeAttr('tabindex');
			if (box.is(':hidden')) return;
			self.options.hide.apply(box, this._duration);
			box.queue(function(){self._trigger('hidden'); box.dequeue()});
		},
		_box: function(){
			// lazy create
			return this.theBox || this._createBox();
		},
		_createBox: function(){
			var self = this;
			var box = this.options.box ?
				$(this.options.box) :
				$('<div/>').appendTo('body').css({position: 'absolute', display: 'none'});
			box.addClass(this.options['class']).
				keydown(function(e) {
					if (e.keyCode == $.ui.keyCode.ESCAPE) {
						self.element.focus();
						if (self.options.hideOnOutsideClick) self.hide();
					}
				});
			this.theBox = box;
			box.data('textpopup', this);
			this._fill(box);
			this._trigger('create', 0, box);
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
			if (!this.options.box) this._box().remove();
			if (this._triggerElement) this._triggerElement.unbind ('.textpopup');
			$('body').unbind('.textpopup');
			this.theBox = undefined;
		},
		option: function (key, value){
			if (key === 'box' && arguments.length === 1) return this._box();
			return this._super.apply(this, arguments);
		},
		_setOption: function(key, value) {
			this._super(key, value);
			if (key == 'trigger' || 'hideOnOutsideClick' || 'position' || 'duration') this._init;
			if (key == 'class') this._box().attr('class', value);
		},
		// returns true if the event e is a click inside the box , the original element or the triggering elements
		_isClickInside: function(e){
			var keepers = $([]).add(this._triggerElement).add(this._box()).add(this.element);
			for (var elem = e.target; elem; elem = elem.parentNode) if (keepers.index(elem) > -1) return true;
			return false;
		},
		options: {
			box: undefined,
			show: $.fn.show,
			hide: $.fn.hide,
			duration: 'slow',
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
	$.widget('bililite.ajaxpopup', $.bililite.textpopup, {
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
			url: '<div/>',
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

	$.widget('bililite.hebrewKeyboard', $.bililite.ajaxpopup, {
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
					self._box().find('.capsLock').text(self._capsLock ? self.options.capslockOn : self.options.capslockOff);
				}
				if (self._capsLock){
					self._box().find('.k'+evt.which).removeClass('hover');
				}
			}).keydown(function(evt){
				if (self._capsLock){
					self._box().find('.k'+evt.which).addClass('hover');
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
