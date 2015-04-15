// hebrew keyboard widgets
// Version: 2.2.3
// dependencies: jquery.ui.subclass.js (mine), jquery.textpopup.js (mine), ui.core.js, effects.core.js (from jQuery UI)
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
			url: 'keyboard.html',
			capslockOff: 'Press the Caps Lock key to use the physical keyboard',
			capslockOn: 'Press the Caps Lock key to restore the physical keyboard'
		}	
	});

})(jQuery);
