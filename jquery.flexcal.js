// flexcal: a multi-calendar date picker 

// Version 3.5

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
	
function makeVisible (callback){
	// offsetHeight and -Width for invisible elements is always zero. This function temporarily makes the element
	// and all its ancestors visible (using jQuery's $.swap method). Note that $.fn.height() uses $.swap, but only
	// for the element itself. This uses it on all the ancestors.
	return function swapper (elem, parent){
		if (arguments.length < 1) elem = this[0];
		if (arguments.length < 2) parent = elem;
		if (!elem) return undefined;
		if (!parent || !parent.style) return callback.call(this);
		return $.swap(
			parent,
			{display:'inline-block'}, // make it visible but shrink to contents
			swapper.bind(this, elem, parent.parentNode)			
		);
	};
}

$.fn.extend({
	// add indicators that an element is active; UI doesn't use :hover, which probably makes sense for IE
	'ui-clickable': function(){
		return this.addClass('ui-state-default')
		.bind('focus.ui', function(){$(this).addClass('ui-state-focus')})
		.bind('blur.ui', function() {$(this).removeClass('ui-state-focus')})
		.bind('mouseenter.ui', function(){$(this).addClass('ui-state-hover')})
		.bind('mouseleave.ui', function(){$(this).removeClass('ui-state-hover')});
	},
	'ui-unclickable': function(){
		return this.removeClass('ui-state-default ui-state-focus ui-state-hover').unbind('.ui');
	},
	trueHeight: makeVisible(function(){
		// Firefox bug (as of version 37): table offsetHeight does not include the caption.
		// https://bugzilla.mozilla.org/show_bug.cgi?id=820891
		// jQuery does not correct for this: http://bugs.jquery.com/ticket/2196
		// assumes a single caption at most
		var caption = this.find('caption');
		var h = caption.outerHeight();
		caption.detach();
		h += this.outerHeight();
		this.prepend(caption);
		return h;
	}),
	trueWidth: makeVisible($.fn.outerWidth),
});

var oneDay = 86400000; // milliseconds/day
// for internal use; requires ECMAScript 5 (no IE 8!)
// must have parseISO(formatISO(d)).getTime() === d.getTime()
// Can't just use new Date() for parsing because new Date('2015-02-27') assumes UTC, which gets converted to 
// a local time, which (for those of us in the Western hemisphere) can be the day before.
// Similarly, formatting with toISOString.
function formatISO(d) {
	if (isNaN(d.getTime())) return 'Invalid   ';
	return pad(d.getFullYear(), 4)+'-'+pad(d.getMonth()+1, 2)+'-'+pad(d.getDate(), 2)
} 
function parseISO(s) {
	var m = s.match(/(\d+)/g);
	return new Date(m[0],m[1]-1,m[2]);
}

// from http://stackoverflow.com/a/1268377 . Assumes whole positive numbers; too-long numbers are left as is
function pad(n, p) {
	var zeros = Math.max(0, p - n.toString().length );
	return Math.pow(10,zeros).toString().substr(1) + n;
}

var defaultHTML = [
	'<div class="ui-tabs ui-widget ui-widget-content ui-corner-all ui-datepicker ui-flexcal ui-helper-clearfix">',
	'	<ul dir=auto class="ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all"></ul>',
	'	<div class="ui-flexcal-container">',
	'		<div class="ui-flexcal-pane"></div>',
	'		<div class="ui-flexcal-pane"></div>',
	'	</div>',
	'	<div dir=auto class="ui-datepicker-buttonpane ui-widget-content"></div>',
	'</div>'
].join('\n');

$.widget('bililite.flexcal', $.bililite.textpopup, {
	options: {
		buttons: [],
		calendars: ['en'],
		changeMonth: false,
		changeYear: false,
		current: undefined,
		filter: undefined,
		hidetabs: 'conditional',
		l10n: {	name: 'flexcal' }, // remainder to be filled in when the calendars are defined, below
		reposition: true,
		tab: 0,
		transition: function(oldCalendar, newCalendar, rev){
			oldCalendar.hide();
			newCalendar.show();
		},
		structure: defaultHTML
	},
	/**************
	 * Public methods
	 **************/
	commit: function(d){
		d = d || this.options.current;
		this.element.val(this.format(d));
		this._setDate(d, false);
		this._trigger('commit', 0, d);
	},
	format: function (d, format, l10n){
		if (typeof format !== 'string'){
			l10n = format;
			format = undefined;
		}
		// special case: parse(d) alone uses the first calendar format
		l10n = l10n || (arguments.length === 1 ? this._firstL10n : this._l10n);
		l10n = l10n || this._l10n;
		format = format || l10n.dateFormat;
		return $.bililite.flexcal.format(d, format, l10n);
	},
	localize: function (text, l10n){
		l10n = l10n || this._l10n;
		return $.bililite.flexcal.localize(text, l10n);
	},
	option: function (key, value){
		if (arguments.length === 1 && key === 'l10n') return this._l10n; // return the current localization object, not the default
		return this._super.apply(this, arguments);
	},
	parse: function (d, format, l10n){
		if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return parseISO(d); // always allow ISO date strings
		if (typeof d === 'string'){
			if (typeof format !== 'string'){
				l10n = format;
				format = undefined;
			}
			// special case: parse(d) alone uses the first calendar format
			l10n = l10n || (arguments.length === 1 ? this._firstL10n : this._l10n);
			format = format || l10n.dateFormat;
			d = $.bililite.flexcal.parse (d, format, l10n);
		}
		if (!(d instanceof Date)) d = new Date(d);
		return d;
	},
	show: function(){
		if (this._oldCalendar.length == 0){ // have not shown any calendars yet
			this._oldCalendar = this._box().find('.ui-flexcal-pane').eq(0);
			this._newCalendar = this._oldCalendar.next('.ui-flexcal-pane');
		}
		this._setTabs();
		this._setButtons();
		this._makeCurrentCalendar(this.options.tab);
		this._setDate(this.element.val(), false);
		this._super();
	},
	/**************
	 * Protected fields (public ones are in the options object)
	 **************/
	 _excludefilter: undefined, // function to disable specified dates
	 _firstL10n: {}, // the localization object of the first calendar; used for formatting/parsing the attached text box
	 _l10n: {}, // the localization object of the currently showing calendar
	 _oldCalendar: $(), // the currently showing calendar
	 _newCalendar: $(), // the calendar to show next
	 _rev: false, // true if the transition between calendars is to be reversed (to a previous month)
	 _tabs: $(), // the calendar-selection tabs
	 // there is also _duration, _position, _triggerElement from textpopup
	/**************
	 * Protected methods
	 **************/
	_adjustHTML: function(cal){
		cal.attr ('dir', this._l10n.isRTL ? 'rtl' : 'ltr');
		cal.find('a').removeClass('ui-state-focus').filter('.commit[rel="'+formatISO(this.options.current)+'"]').addClass('ui-state-focus');
		var val = this.parse(this.element.val());
		cal.find('a').removeClass('ui-state-active').filter('.commit[rel="'+formatISO(val)+'"]').addClass('ui-state-active');
		cal.find('a').removeClass('ui-state-highlight').filter('.commit[rel="'+formatISO(new Date)+'"]').addClass('ui-state-highlight');
		cal.find('a:not([href])')['ui-clickable']();
		cal.find('a.go').removeClass('ui-state-default') // ui-datepicker has its own styling
			.each(function(){ this.title = $(this).text().trim() }); // when we use image replacement for the prev/next buttons, leave the text as a tooltip title
		// allow for using either the jQuery UI icons or the FontAwesome icon font
		cal.find('a.ui-datepicker-prev').children().addClass('ui-icon ui-icon-circle-triangle-w fa fa-chevron-circle-left');
		cal.find('a.ui-datepicker-next').children().addClass('ui-icon ui-icon-circle-triangle-e fa fa-chevron-circle-right');
		cal.find('a.commit').filter(this._excludefilter).
		  removeClass('commit')['ui-unclickable']().addClass('ui-state-disabled');
		if (this.options.changeMonth){
			var monthMenu = $('<select>').html(this._listMonths(this.options.current).map(function(m){
				return $('<option>').text(m[0]).val(m[1]).prop('selected', m[2]);
			}));
			cal.find('.ui-datepicker-month').html(monthMenu);
		}
		if (this.options.changeYear){
			var yearMenu = $('<select>').html(this._listYears(this.options.current).map(function(m){
				return $('<option>').text(m[0]).val(m[1]).prop('selected', m[2]);
			}));
			cal.find('.ui-datepicker-year').html(yearMenu);
		}
		return cal;
	},
	_commit: function(d){
		// commit to the date, then close the calendar
		this.commit(d);
		this.element[0].focus(); 
		if (!this.options.box) this.hide();
	},
	_init: function(){
		if (!$.Widget.prototype.yield) this._super(); // if not using my subclassing code, need to initialize the textpopup explicitly
		var self = this;
		this.options.current = this.parse(this.options.current, this._firstL10n.dateFormat, this._firstL10n);
		if (isNaN(this.options.current.getDate())) this.options.current = new Date;
		if (this.options.filter){
			// the filter option returns true for elements to allow, but _adjustHTML expects a filter that returns true for elements to disable
			this._excludefilter = function(){
				return !(self.options.filter.call(this, parseISO(this.rel)));
			}
		}
		this._setL10n(); // create a default localization
		if (this.options.box) this.show(); // inline calendars get shown right away
	},
	_fill: function(box){
		var self = this;
		box.html(this.options.structure);
		this.element.bind(this.widgetEventPrefix+'shown', function(){
			if (self.options.box) return; // for an inline flexcal, showing is under programmatic control. Don't unexpectedly change the focus
			if (self._triggerElement){
				self._triggerElement[0].focus(); // keep the focus on the element that triggered the popup
			}else{
				this.focus(); // unless there is no trigger; then focus the textbox
			}
		});
		if (this._triggerElement) this._triggerElement.keydown(function(e){
			// tab from the textbox to the calendar
			if (!e.ctrlKey && !e.altKey && e.keyCode===$.ui.keyCode.TAB && box.is(':visible')){
				box[0].focus();
				return false;
			}
		});
		box.on('click', 'a', function(e){
			var $target = $(this);
			if ($target.length == 0 || $target.is('[href]')){
				return; // allow real links to work
			}else if ($target.is('.go')){
				self._setDate($target.attr('rel'));
			}else if ($target.is('.commit')){
				self._commit(parseISO($target.attr('rel')));
			}else if ($target.is('.ui-tabs-nav li:not(.ui-tabs-selected) a')){
				self._makeCurrentCalendar(self._tabs.index($target.parent())); // the click is on the <a> but the data is on the <li>
				self._setDate(undefined, true);
			}
			return false; // and don't leave the page (or even change to a /# page)
		}).keydown(function (e){
			// largely from http://oaa-accessibility.org/example/15/ plus respecting isRTL, and changing control-keys to alt keys (FF uses ctrl-page up/down to switch tabs), and allowing tab to actually exit the calendar
			// alt-arrow keys switches calendars
			var dir = self._l10n.isRTL ? -1 : 1;
			function offsetDate(d) { self._setDate(new Date (self.options.current.getTime()+d*oneDay)); return false; }
			function calendarDate(which) { self._setDate(self._l10n.calendar(self.options.current)[which], true); return false; }
			if (!e.ctrlKey && !e.altKey) switch (e.keyCode){
				case $.ui.keyCode.ENTER: self._commit(self.options.current); return false;
				case $.ui.keyCode.RIGHT: return offsetDate(dir);
				case $.ui.keyCode.LEFT: return offsetDate(-dir);
				case $.ui.keyCode.UP: return offsetDate(-self._l10n.dayNamesMin.length);
				case $.ui.keyCode.DOWN: return offsetDate(self._l10n.dayNamesMin.length);
				case $.ui.keyCode.PAGE_UP: return calendarDate('prev');
				case $.ui.keyCode.PAGE_DOWN: return calendarDate('next');
				case $.ui.keyCode.HOME: return calendarDate('first');
				case $.ui.keyCode.END: return calendarDate('last');
				case $.ui.keyCode.TAB: 
					if (self.options.hideOnOutsideClick){ // if we hide when losing focus, tabbing out should also hide. Otherwise, just do the default tabbing
						self.hide();
						if (self._triggerElement) self._triggerElement[0].focus(); // $().focus() does not actually set the focus; have to call the method of the DOM element
						return false; // tabbing out hides the element and still tabs out
					}
					return; // if not hideOnOutsideClick, just do the default.
			}
			if (e.altKey) switch (e.keyCode){
				case $.ui.keyCode.PAGE_UP: return calendarDate('prevYear');
				case $.ui.keyCode.PAGE_DOWN: return calendarDate('nextYear');
				case $.ui.keyCode.RIGHT:
					self._makeCurrentCalendar((self.options.tab+1)%self._tabs.length);
					self._setDate(undefined, true);
					return false;
				case $.ui.keyCode.LEFT:
					self._makeCurrentCalendar((self.options.tab+self._tabs.length-1)%self._tabs.length);
					self._setDate(undefined, true);
					return false;
			}
		}).on('wheel', function (e){
			e.preventDefault();
			e = e.originalEvent; // jQuery doesn't automatically copy these over
			if (e.deltaY > 0){ // scroll down
				box.trigger({type: 'keydown', keyCode: $.ui.keyCode.PAGE_DOWN, altKey: e.altKey}); // next month/year
			}else if (e.deltaY < 0){ // scroll up
				box.trigger({type: 'keydown', keyCode: $.ui.keyCode.PAGE_UP, altKey: e.altKey});  // prev month/year
			}else if (e.deltaX > 0){ // scroll right
				box.trigger({type: 'keydown', keyCode: $.ui.keyCode.RIGHT, altKey: true}); // next tab
			}else if (e.deltaX < 0){ // scroll left
				box.trigger({type: 'keydown', keyCode: $.ui.keyCode.LEFT, altKey: true}); // prev tab
			}
		}).on('change', 'select', function(){
			// allow use of drop-down menus
			self._setDate(new Date($(this).val()));
		});
		// allow buttons to find this
		box.find('.ui-datepicker-buttonpane').data(
			self.widgetName,
			{element: self.element, widget: box, instance: self}
		);
	},
	_generateCalendar: function(d){
		// TODO: implement some kind of caching
		var ret = [], l10n = this._l10n;
		var cal = l10n.calendar(d);
		var daysinweek = l10n.dayNamesMin.length;
		var dow = (cal.dow - l10n.firstDay + daysinweek) % daysinweek; // mod operator (% fails for negative dividends)

		ret.push(this._generateGoButton('prev', cal));
		ret.push(this._generateGoButton('next', cal));
		ret.push ('<table class="ui-widget-content" style="border: none">');
		ret.push (this._generateCaption(d, cal));
		ret.push(this._generateWeekHeader(cal));
		ret.push('<tbody>');
		if (dow > 0) ret.push('<tr>');
		for (var i = 0; i < dow; ++i) ret.push ('<td class="ui-datepicker-other-month ui-state-disabled"></td>');
		for (i = 1, d = cal.first; d <= cal.last; ++i, ++dow, d.setDate(d.getDate()+1)){
			if (dow == 0) ret.push('<tr>');
			ret.push(this._generateDate(d, i));
			if (dow >= daysinweek-1){
				ret.push('</tr>');
				dow=-1;
			}
		}
		if (dow > 0){
			for (; dow < daysinweek; ++dow) ret.push('<td class="ui-datepicker-other-month ui-state-disabled"></td>');
			ret.push('</tr>');
		}
		ret.push('</tbody>');
		ret.push('</table>');
		return $(ret.join(''));
	},
	// all these are separated out to allow for easy overriding
	_generateDate: function (d, i){
		// element for date d with number i
		var dstring = formatISO(d);
		return [
			'<td><a class=commit rel='+dstring+' title='+dstring+' >',
				this._generateDateText(d,i),
			'</a></td>'
		].join('');
	},
	_generateDateText: function (d, i){
		return this._l10n.dates(i);
	},
	_generateCaption: function(d, cal){
		return [
			'<caption class="ui-datepicker-header ui-widget-header ui-corner-all">',
				this._generateCaptionText(d, cal),
			'</caption>'
		].join('\n');
	},
	_generateCaptionText: function(d, cal){
		return [
			'<span class=ui-datepicker-month>',
			this._l10n.monthNames[cal.m],
			'</span> <span class=ui-datepicker-year>',
			this._l10n.years(cal.y),
			'</span>'
		].join('\n');
	},
	_generateGoButton: function(which, cal){
		var whichClass = 'ui-datepicker-'+which;
		return [
			'<a class="go '+whichClass+' ui-corner-all" rel='+formatISO(cal[which])+' >',
			'	<span>'+
				'<span>'+this._generateGoText(which, cal)+'</span>'+ // internal span for icon replacement
				'</span>',
			'</a>'
		].join('\n');
		
	},
	_generateGoText: function(which, cal){
		return this.localize(which, this._l10n);
	},
	_generateWeekHeader: function (cal){
		// short "months" are only present in calendars that add days that are not part of the week (see the French Revolutionary calendar)
		var dayNames = this._listDaysOfWeek (cal.first, cal.dow);
		var showWeekHeader = (cal.last - cal.first)/oneDay > dayNames.length;
		for (var i = 0; i < l10n.firstDay; ++i) dayNames.push(dayNames.shift()); // rotate the names
		return [
			'<thead' + (showWeekHeader ? '' : ' style="visibility: hidden; line-height: 0"') + '>',
			'	<tr>',
					dayNames.map(function(day){
						return '<th><span>'+day+'</span></th>';
					}).join(''),
			'	</tr>',
			'</thead>'
		].join('\n');
	},
	_listDaysOfWeek: function (d, dow){
		// returns an array of days of the week, starting at the localized first day of the week
		// uses the week centered around d, which is on dow day of the week.
		// not used in this version, but allows for localized formatting
		var dayNames = this._l10n.dayNamesMin.slice(); // copy
		for (var i = 0; i < this._l10n.firstDay; ++i) dayNames.push(dayNames.shift()); // rotate the names
		return dayNames;
	},
	_listMonths: function(d){
		// returns an array of months of the year of Date d, as [monthName, Date, isThisMonth]
		var origD = d;
		var l10n = this._l10n, c = l10n.calendar, y = c(d).y;
		var ret = [[l10n.monthNames[c(d).m], d, true]];
		for (d=c(d).prev; c(d).y === y; d = c(d).prev){ // go through all the previous months of the year 
			ret.unshift([l10n.monthNames[c(d).m], d, false]);
		}
		d = origD;
		for (d=c(d).next; c(d).y === y; d = c(d).next){ // go through all the next months of the year
			ret.push([l10n.monthNames[c(d).m], d, false]);
		}
		return ret;
	},
	_listYears: function(d){
		// returns an array of years surrounding Date d, as [formatted year, Date, isThisYear]
		var origD = d, n = 5; // n is number of years before and after d
		var l10n = this._l10n, c = l10n.calendar;
		var ret = [[l10n.years(c(d).y), d, true]];
		for (var i = 0; i < n; ++i){
			d = c(d).prevYear;
			ret.unshift([l10n.years(c(d).y), d, false]);
		}
		d = origD;
		for (var i = 0; i < n; ++i){
			d = c(d).nextYear;
			ret.push([l10n.years(c(d).y), d, false]);
		}
		return ret;
	},
	_makeCurrentCalendar: function (n){
		this._tabs.removeClass('ui-tabs-selected ui-state-active')
			.children()['ui-clickable']();
		n = Math.min(this._tabs.length-1, Math.max (0, n)) || 0; // correct the parameters
		var tab = this._tabs.eq(n).addClass('ui-tabs-selected ui-state-active') // mark the tab as current
			.children()['ui-unclickable']().end(); // and remove the clickable indication
		this._setL10n(tab.data('flexcal.l10n'));
		this._rev = (n < this.options.tab) != this._l10n.isRTL; // true if the transition should indicate backwards.
		// The XOR with isRTL is because the actual transition doesn't know whether we are transitioning 
		// to a new date in the same calendar (in which isRTL is relevant and the code should do the XOR)
		// or to a new tab (which is always in the browser's default direction). Using an XOR here allows
		// the transition code to "overcorrect" back to the right result with its XOR
		this.options.tab = n;
	},
	_setButtons: function (){
		var self = this;
		self._box().find('.ui-datepicker-buttonpane').children().detach().end().append(
			self.options.buttons.map(function(element){
				if (typeof element == 'string')	return $('<button>').addClass(element).data('flexcalL10n', element.split(' ')[0]);
				return element;
			})				
		);
	},
	_setDate: function(d, animate){
		// d is the date we want to change to; if undefined just redraws the calendar
		// set animate == true to force the animated transition, false to prevent it.
		// if undefined, only animate if the new date is not on the currently visible calendar
		var oldd = this.options.current;
		d = this.parse(d, this._firstL10n.dateFormat, this._firstL10n);
		if (isNaN(d.getTime())) d = oldd;
		this.options.current = d;
		this._trigger('set', 0, [d, oldd]);
		// the find(..) looks for a date element with the desired date (stored in the rel attribute). If it's there, then the new date is showing and we can use it
		var needCalendar = this._oldCalendar.find('table a[rel="'+formatISO(d)+'"]').length == 0;
		if (animate == null) animate = needCalendar;
		if (!animate && !needCalendar){
			this._adjustHTML(this._oldCalendar);
		}else{
			if (formatISO(oldd) != formatISO(d)) this._rev = (oldd > d); // if the date is unchanged, we may be transitioning calendars, so leave the rev flag alone
			this._newCalendar.html(this._generateCalendar(d));
			this._adjustHTML(this._newCalendar);
			// if the tab bar is bigger than the calendar, it looks funny
			var tabbar = this._box().find('.ui-tabs-nav');
			var width = tabbar.css('display') == 'none' ? '0' : tabbar.trueWidth();
			var daynames = this._newCalendar.find('th');
			daynames.css('min-width', (width/daynames.length) + 'px');
			var table = this._newCalendar.find('table');
			var size = {width: table.trueWidth(), height: table.trueHeight() };
			this._newCalendar.css(size);
			this._transition(size, animate);
		}
	},
	_setL10n: function(name){
		var self = this;
		this._l10n = tol10n(name, this.options.l10n);
		// jQuery UI standards say don't include the little arrows, but many localizations don't obey this
		this._l10n.nextText = this._l10n.nextText.replace (/&#x3e;|>/gi,'');
		this._l10n.prevText = this._l10n.prevText.replace (/&#x3c;|</gi,'');
		this._box().find(':data(flexcalL10n), [data-flexcal-l10n]').each(function(){
			// need to search for both because data attributes are not pulled into $.data until requested
			$(this).html(self.localize($(this).data('flexcalL10n'), self._l10n));
		});
		this._trigger('setL10n', 0, this._l10n);
	},
	_setOption: function(key, value) {
		if (key == 'current'){
			this._setDate(value);
			return; // _setDate records the new date in options.current; we want a valid date, not whatever the user passed in
		}
		this._super.apply(this, arguments);
		if (key == 'buttons'){
			this._setButtons();
			this._setL10n(this._l10n);
		}
		// _setTabs redraws the tab bar; _setDate redraws the calendar
		if (key == 'calendars' || key == 'calendarNames' || key == 'hidetabs'){
			this._setTabs();
			this._setDate(undefined, true);
		}
		if (key == 'l10n'){
			this._setL10n(value);
			this._setDate(undefined, true);
		}
		if (key == 'tab'){
			this._makeCurrentCalendar(value);
			this._setDate(undefined, true);
		}
	},
	_setTabs: function(){
		var self = this;
		var tabbar = this._box().find('ul.ui-tabs-nav').empty();
		this.options.calendars.forEach (function (name){
			tabbar.append( $('<li>').
				addClass('ui-corner-top').
				append($('<a>').text(tol10n(name, self.options.l10n).name)).
				data('flexcal.l10n', name)
			);
		});
		this._tabs = tabbar.children();
		var hidetabs = this.options.hidetabs;
		this._tabs.children()['ui-clickable'](); // the <a>'s are the clickable elements
		if (hidetabs === true || (hidetabs =='conditional' && this.options.calendars.length == 1)){
			this._tabs.parent().hide();
		}else{
			this._tabs.parent().show();
		}
		this._firstL10n = tol10n(this.options.calendars[0], this.options.l10n);
		this._makeCurrentCalendar(this.options.tab);
	},
	_transition: function(size, animate){
		var first = this._oldCalendar, second = this._newCalendar, self = this;
		function nextSlide(){
			self._oldCalendar = second;
			self._newCalendar = first;
		}
		this._box().find('.ui-datepicker-buttonpane').css('width', size.width);
		this._box().find('.ui-flexcal-container').css('height'); // odd bug in Chrome: if I don't check the height, the next line doesn't transition, just runs
		this._box().find('.ui-flexcal-container').css(size);
		if (!animate || this._box().is(':hidden')){
			// if box is hidden, then we don't need to animate anything
			first.hide();
			second.css({top: 0, left: 0, opacity: 1}).show(); // make sure we correct any leftover css from the transition effects
			nextSlide();
		}else{
			first.add(second).stop (true, true); // make sure that the new calendar is available to show
			self.options.transition.call(self.element, first, second, self._rev);
			nextSlide();
			if (self.options.reposition) self.position(); // adjust position for new size
		}
	}
});

// predefined button classes
$('body').on('click', '.ui-flexcal button.today', function(){
	var instance = $.data(this.parentNode, 'flexcal').instance;
	if (this.classList.contains('commit')){
		instance._commit(new Date);
	}else{
		instance._setDate(new Date);
	}
});
$('body').on('click', '.ui-flexcal button.close', function(){
	var instance = $.data(this.parentNode, 'flexcal').instance;
	if (this.classList.contains('commit')){
		instance._commit();
	}else{
		instance.hide();
	}
});


function addDay(d, n){
	if (n === undefined) n = 1;
	return new Date(d.getFullYear(), d.getMonth(), d.getDate()+n);
}

// calendar algorithms
// takes a Date object
// and returns an object with the following fields: first: Date of the first of the month, Last: Date of the last of the month, prev: Date of one month ago,
// next: one month from now, m: month number (0 indexed), y: year number, dow: day of the week (0 indexed)
function toDate (d) {return new Date (d.y, d.m, d.d)}
$.bililite.flexcal.calendars = {
	gregorian: function(d){
		var m = d.getMonth(), y = d.getFullYear(), date = d.getDate(), first = new Date (y, m, 1);
		var prev = new Date (y, m-1, date), next = new Date (y, m+1, date);
		if (prev.getDate() != date) prev = new Date (y, m, 0); // adjust for too-short months
		if (next.getDate() != date) next = new Date (y, m+2, 0);
		var nextYearDate = m == 1 && date == 29 ? 28 : date;
		return {
			first: first,
			last: new Date (y, m+1, 0),
			prev: prev,
			next: next,
			prevYear: new Date (y-1, m, nextYearDate),
			nextYear: new Date (y+1, m, nextYearDate),
			m: m,
			y: y,
			d: d.getDate(),
			dow: first.getDay(),
			toDate: toDate
		};
	},
	jewish: function(d){
		var h = civ2heb(d);
		var roshchodesh = addDay(d, -h.d+1);
		var daysinlastmonth = Math.max(civ2heb(addDay(roshchodesh,-1)).daysinmonth, h.d); //  the min/max() correct for the possibility of other month being too short
		var daysintonextmonth = Math.min(civ2heb(addDay(roshchodesh, h.daysinmonth)).daysinmonth, h.d);
		return {
			first: roshchodesh,
			last: addDay(roshchodesh, h.daysinmonth-1),
			prev: addDay(d, -daysinlastmonth),
			next: addDay(roshchodesh, h.daysinmonth+daysintonextmonth-1),
			prevYear: heb2civ($.extend({}, h, {y: h.y-1})),
			nextYear: heb2civ($.extend({}, h, {y: h.y+1})),
			m: h.m,
			y: h.y,
			d: h.d,
			dow: roshchodesh.getDay(),
			toDate: heb2civ
		};
	}
};

// need to add to the default after all this is defined
$.extend($.bililite.flexcal.prototype, {
	_l10n: tol10n(),
	_firstL10n: tol10n()
});
$.extend(
	$.bililite.flexcal.prototype.options.l10n,
	$.datepicker.regional[''], // use the jQuery UI defaults where possible
	{
		calendar: $.bililite.flexcal.calendars.gregorian,
		years: function(n) {return n.toString()},
		fromYears: undefined,
		dates: function(n) {return n.toString()},
		fromDates: undefined,
		todayText: 'Today'
	}
);

function archaicNumbers(arr){
	// arr is assumed to be ordered in the order desired for formatting
	// for parsing we want to read the longest string first.
	var arrParse = arr.slice().sort(function (a,b) {return b[1].length - a[1].length});
	return {
		format: function(n){
			var ret = '';
			$.each(arr, function(){
				var num = this[0];
				if (parseInt(num) > 0){
					for (; n >= num; n -= num) ret += this[1];
				}else{
					ret = ret.replace(num, this[1]);
				}
			});
			return ret; 
		},
		parse: function (s){
			var ret = 0;
			$.each (arrParse, function(){
				var num = this[0], letter = this[1];
				if (parseInt(num) > 0 && letter.length > 0){ // only translate things which have numeric value
					var re = new RegExp(this[1], 'g'); // assumption: none of the replacement strings have RegExp special characters
					s = s.replace(re, function (match){
						ret += num;
						return '';
					});
				}
			});
			return ret;
		}
	}
}
$.bililite.flexcal.archaicNumbers = archaicNumbers;

var latin2hebrew = archaicNumbers([
	[1000,''], // over 1000 is ignored
	[400,'ת'],
	[300,'ש'],
	[200,'ר'],
	[100,'ק'],
	[90,'צ'],
	[80,'פ'],
	[70,'ע'],
	[60,'ס'],
	[50,'נ'],
	[40,'מ'],
	[30,'ל'],
	[20,'כ'],
	[10,'י'],
	[9,'ט'],
	[8,'ח'],
	[7,'ז'],
	[6,'ו'],
	[5,'ה'],
	[4,'ד'],
	[3,'ג'],
	[2,'ב'],
	[1,'א'],
	[/יה/, 'ט״ו'], // special cases for 15 and 16
	[/יו/, 'ט״ז'],
	[/([א-ת])([א-ת])$/, '$1״$2'], // gershayim (what I always called "choopchiks"--the double or single hash marks
	[/^([א-ת])$/, "$1׳"] // geresh
]);

var l10n = $.bililite.flexcal.l10n = {
	en: {
		name: 'English',
	},
	jewish: {
		name: 'Jewish',
		calendar: $.bililite.flexcal.calendars.jewish,
		monthNames: ['Nisan', 'Iyar', 'Sivan', 'Tammuz', 'Av', 'Elul',
			'Tishrei', 'Cheshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar',
			'Adar I', 'Adar II'],
		dayNamesMin: ['Su','Mo','Tu','We','Th','Fr','ש']
	},
	'he-jewish': {
		name: 'עברית',
		calendar: $.bililite.flexcal.calendars.jewish,
		monthNames:  [
			"ניסן",
			"אייר",
			"סיון",
			"תמוז",
			"אב",
			"אלול",
			"תשרי",
			"חשון",
			"כסלו",
			"טבת",
			"שבט",
			"אדר",
			"אדר א׳",
			"אדר ב׳"
		],
		dayNamesMin: ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','שבת'],
		isRTL: true,
		prevText: 'הקודם',
		nextText: 'הבא',
		todayText: 'היום',
		closeText: 'סגור',
		years: latin2hebrew.format,
		dates: latin2hebrew.format
	}
};

// highly modified version of Kaluach routines. Used with permission
/* Copyright (C) 5760,5761 (2000 CE), by Abu Mami and Yisrael Hersch.
 *   All Rights Reserved.
 *   All copyright notices in this script must be left intact.
 * Based on the formula by Gauss
 * Terms of use:
 *   - Permission will be granted to use this script on personal
 *     web pages. All that's required is that you please ask.
 *     (Of course if you want to send a few dollars, that's OK too :-)
 *   - Use on commercial web sites requires a $50 payment.
 * website: http://www.kaluach.net
 * email: abumami@kaluach.net
 */

function Gauss(year) {
	var a,b,c;
	var m;
	var	Mar;	// "day in March" on which Pesach falls (return value)

	a = Math.floor((12 * year + 17) % 19);
	b = Math.floor(year % 4);
	m = 32.044093161144 + 1.5542417966212 * a +  b / 4.0 - 0.0031777940220923 * year;
	if (m < 0)
		m -= 1;
	Mar = Math.floor(m);
	if (m < 0)
		m++;
	m -= Mar;

	c = Math.floor((Mar + 3 * year + 5 * b + 5) % 7);
	if(c == 0 && a > 11 && m >= 0.89772376543210 )
		Mar++;
	else if(c == 1 && a > 6 && m >= 0.63287037037037)
		Mar += 2;
	else if(c == 2 || c == 4 || c == 6)
		Mar++;

	Mar += Math.floor((year - 3760) / 100) - Math.floor((year - 3760) / 400) - 2;
	return Mar;
}

function leap(y) {
	return ((y % 400 == 0) || (y % 100 != 0 && y % 4 == 0));
}

// takes a Date object, returns an object with {m: hebrewmonth, d: date, y: year, daysinmonth: number of days in this Hebrew month}
function civ2heb(date) {
	var d = date.getDate();
	var	m = date.getMonth()+1;
	var y = date.getFullYear();
	var hy;
	var pesach;
	var anchor;
	var adarType;

	m -= 2;
	if (m <= 0) { // Jan or Feb
		m += 12;
		y -= 1;
	}

	d += Math.floor(7 * m / 12 + 30 * (m - 1)); // day in March
	hy = y + 3760;	// get Hebrew year
	pesach = Gauss(hy);
	if (d <= pesach - 15) { // before 1 Nisan
		anchor = pesach;
		d += 365;
		if(leap(y))
			d++;
		y -= 1;
		hy -= 1;
		pesach = Gauss(hy);
	}
	else
		anchor = Gauss(hy + 1);

	d -= pesach - 15;
	anchor -= pesach - 12;
	y++;
	if(leap(y))
		anchor++;

	for(m = 0; m < 11; m++) {
		var days;
		if(m == 7 && anchor % 30 == 2)
			days = 30; // Cheshvan
		else if(m == 8 && anchor % 30 == 0)
			days = 29; // Kislev
		else
			days = 30 - m % 2;
		if(d <= days)
			break;
		d -= days;
	}

	adarType = 0;			// plain old Adar
	if (m == 11) days = 29;
	if (m == 11 && anchor >= 30) {
		if (d > 30) {
			adarType = 2;	// Adar 2
			d -= 30;
		}else{
			adarType = 1;	// Adar 1
			days = 30;
		}
	}

	if(m >= 6)		// Tishrei or after?
		hy++;		// then bump up year

	if(m == 11)			// Adar?
		m += adarType;	// adjust for Adars
	return {d:d, m:m, y:hy, daysinmonth: days};
}

// takes a hebrew date in the object form above and returns a Date object
// assumes that the months are valid, except for the following:
// for type==1, m==11 becomes m=12 in leap years (plain Adar translates to Adar I). In regular years, both m==12 and m==13 become m=11 (Adar I and Adar II translate to Adar).
// for type==2, m==11 becomes m=13 in leap years (plain Adar translates to Adar II). In regular years, both m==12 and m==13 become m=11 (Adar I and Adar II translate to Adar).
function heb2civ(h, type){
	type = type || 2; // for most calendarical calculations, use type==2
	// dates through Cheshvan are completely determined by pesach
	if (h.m < 6) return new Date (h.y-3760, 2, Gauss(h.y)-15+h.d+Math.ceil(h.m*29.5));
	if (h.m < 8) return new Date (h.y-3761, 2, Gauss(h.y-1)-15+h.d+Math.ceil(h.m*29.5));
	var pesach = Gauss(h.y-1);
	var yearlength = Gauss(h.y)-pesach+365+(leap(h.y-3760)?1:0);
	var yeartype = yearlength%30-24; // -1 is chaser, 0 is ksidrah, +1 is male
	var isleap = yearlength > 360;
	var m = h.m;
	if (isleap && m==11){
		m += type;
	}else if (!isleap && m>11){
		m = 11;
	}
	var day = pesach-15+h.d+Math.ceil(m*29.5)+yeartype;
	if (m > 11) day -= 29; // we added an extra month in there (in years with an Adar I or II, there is no plain Adar)
	var d = new Date (h.y-3761, 2, day);
	// if the hebrew date was valid but wrong (Cheshvan or Kislev 30 in a haser year; Adar I 30 in a non-leap year) then move it back a day to the 29th
	// we won't try to correct an actually invalid date 
	if (h.d < 30 || civ2heb(d).m == m) return d; // it worked
	return new Date (h.y-3761, 2, day-1);
}

// create a localization object from a description.
// Allow the use of the standard jquery ui datepicker localization (all gregorian calendars)
// Allow Keith Wood's calendar system (http://keith-wood.name/calendars.html)
// TODO: use the jQuery foundation's Globalize tools (https://github.com/jquery/globalize)

function tol10n (name, defaultL10n){
	return $.extend(true, {}, defaultL10n || $.bililite.flexcal.prototype.options.l10n, partialL10n(name));
};
$.bililite.flexcal.tol10n = tol10n;

function partialL10n (name){
	if (name == null) return {};
	if ($.isPlainObject(name)) return name;
	if ($.isArray(name)) return name.reduce( function (previous, current){ // fold all the elements into an empty object
		return $.extend(previous, partialL10n(current));
	}, {});
	if (l10n[name]) return l10n[name];
	for (var loc in tol10n.localizers){
		var ret = tol10n.localizers[loc](name);
		if (ret){
			l10n[name] = ret;
			return ret;
		}
	}
	// Does not match a localization; assume this is just the name
	return {name: name.toString()}
};

tol10n.localizers = {
	datepicker: function (name){
		ret = $.datepicker.regional[name];
		// jQuery UI datepicker uses what I feel is the wrong notation
		if (ret) ret.todayText = ret.currentText;
		return ret;
	}
};

if ($.calendars) tol10n.localizers.woodsCalendar = function (name){
	var calendarSystem, language;
	if (name in $.calendars.calendars){
		calendarSystem = name;
		language = '';
	}else if (name in $.calendars.calendars.gregorian.prototype.regionalOptions){
		calendarSystem = 'gregorian';
		language = name;
	}else if (name.indexOf('-') > -1){
		var nameparts = name.split('-');
		calendarSystem = nameparts.pop();
		language = nameparts.join('-'); // could have localization with more '-' in it
	}
	if (!(calendarSystem in $.calendars.calendars)) return;
	if (!(calendarSystem in $.bililite.flexcal.calendars)){
		// create a flexcal-specific calendar system
		var c = $.calendars.instance(calendarSystem);
		$.bililite.flexcal.calendars[calendarSystem] = function (d){
			var cdate = c.fromJSDate(d), y = cdate.year(), m = cdate.month(), d = cdate.day();
			var first = c.newDate(y, m, 1).toJSDate();
			var last = c.newDate(y, m, c.daysInMonth(y,m)).toJSDate();
			function toDate (d) { return c.newDate(d.y, d.m+1, d.d).toJSDate() };
			return {
				first: first,
				last: last,
				prev: cdate.newDate().add(-1, 'm').toJSDate(),
				next: cdate.newDate().add(+1, 'm').toJSDate(),
				prevYear: cdate.newDate().add(-1, 'y').toJSDate(),
				nextYear: cdate.newDate().add(+1, 'y').toJSDate(),
				y: y,
				m: m-1, // Wood's code uses 1-based counting
				d: d,
				dow: first.getDay(),
				toDate: toDate
			}
		}
	}
	var region = $.calendars.calendars[calendarSystem].prototype.regionalOptions; // where the details are stored
	if (!(language in region)) return;
	var ret = $.extend({}, region[''], region[language]);
	ret.calendar = $.bililite.flexcal.calendars[calendarSystem];
	// some details are in the date picker, not the language localization
	if (language in $.calendarsPicker.regionalOptions){
		ret = $.extend(ret, $.calendarsPicker.regionalOptions[language]);
	};
	return ret;	
};

// TODO: the Globalize routines
	
$.bililite.flexcal.format = function (d, format, l10n){
	// the l10n is for possible extension
	return format.
		replace (/dd/g, pad(d.getDate(), 2)).
		replace (/d/g, d.getDate()).
		replace (/mm/g, pad(d.getMonth()+1, 2)).
		replace (/m/g, d.getMonth()+1).
		replace (/yyyy/g, pad(d.getFullYear(), 4)).
		replace (/yy/g, d.getFullYear()); // jQuery UI datepicker uses yy for the 4-digit year
};

$.bililite.flexcal.localize = function (text, l10n){
	return l10n[text+'Text'] || '';
};

$.bililite.flexcal.parse = function (s, format, l10n){
	// I want to accept as many inputs as possible; we just look for 3 numbers in the right order
	// the l10n is for possible extension
	var ymd = format. // determine the order of year-month-day
		replace(/[^ymd]/g,'').
		replace(/y+/g,'y').
		replace(/m+/g,'m').
		replace(/d+/g,'d');
	var match = s.match(/(\d+)/g); // get the numbers
	if (!match) return new Date(NaN); // invalid Date
	return new Date(match[ymd.indexOf('y')], match[ymd.indexOf('m')]-1, match[ymd.indexOf('d')]);
};

})(jQuery);
