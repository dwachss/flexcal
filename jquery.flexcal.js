// flexcal: a multi-calendar date picker 

// Version 4.0

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

jQuery.bililite = jQuery.bililite || {}; // create namespace
(function($, bililite){
	
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
// must have parseISO(formatISO(d)).getTime() === d.getTime()
// Can't just use new Date() for parsing because new Date('2015-02-27') assumes UTC, which gets converted to 
// a local time, which (for those of us in the Western hemisphere) can be the day before.
// Similarly, formatting with toISOString.
function formatISO(d) {
	if (isNaN(d.getTime())) return 'Invalid   ';
	return bililite.pad(d.getFullYear(), 4)+'-'+bililite.pad(d.getMonth()+1, 2)+'-'+bililite.pad(d.getDate(), 2)
} 
function parseISO(s) {
	var m = s.match(/(\d+)/g);
	return bililite.newDate(m[0],m[1]-1,m[2]);
}

bililite.newDate = function (y, m, d){
	// new Date bug assumes 2-digit years are in the 1900's. 
	var d = new Date(y, m, d);
	d.setFullYear(y);
	return d;
}

bililite.addDay = function (d, n){
	if (n === undefined) n = 1;
	d.setDate(d.getDate()+n);
	return d;
}


//**********************************************************
// calendar algorithms
function toDate (d) {return new Date (d.y, d.m, d.d)}
bililite.calendars = {
	gregorian: function(d){
		var m = d.getMonth(), y = d.getFullYear(), date = d.getDate(), first = new Date (y, m, 1);
		var prev = new Date (y, m-1, date), next = bililite.newDate (y, m+1, date);
		if (prev.getDate() != date) prev = bililite.newDate (y, m, 0); // adjust for too-short months
		if (next.getDate() != date) next = bililite.newDate (y, m+2, 0);
		var nextYearDate = m == 1 && date == 29 ? 28 : date;
		return {
			first: first,
			last: new Date (y, m+1, 0),
			prev: prev,
			next: next,
			prevYear: bililite.newDate (y-1, m, nextYearDate),
			nextYear: bililite.newDate (y+1, m, nextYearDate),
			m: m,
			y: y,
			d: d.getDate(),
			dow: first.getDay(),
			toDate: toDate
		};
	}
};

//**********************************************************
// localization objects 
bililite.l10n = {
	'': $.extend(
		{
			name: 'flexcal',
			calendar: bililite.calendars.gregorian,
			years: function(n) {return n.toString()},
			fromYears: undefined,
			dates: function(n) {return n.toString()},
			fromDates: undefined,
			todayText: 'Today'
		},
		$.datepicker.regional[''] // use the jQuery UI defaults where possible
	),
	en: {
		name: 'English'
	}
}


// create a localization object from a description.
function tol10n (name){
	return $.extend({}, bililite.l10n[''], partialL10n(name));
};
bililite.tol10n = tol10n;

function partialL10n (name){
	if (name == null) return {};
	if ($.isPlainObject(name)) return name;
	if ($.isArray(name)) return name.reduce( function (previous, current){ // fold all the elements into an empty object
		return $.extend(previous, partialL10n(current));
	}, {});
	// get the first localization that is not undefined (note that this is an intentional use of assignment)
	if (bililite.localizers.some( function(f) {return bililite.l10n[name] = f(name)} )) return bililite.l10n[name];
	// Does not match a localization; assume this is just the name
	return {name: name.toString()}
};

bililite.localizers = [
	function (name){ // predefined in flexcal
		return bililite.l10n[name];
	},
	function (name){ // jQuery UI datepicker
		ret = $.datepicker.regional[name];
		// datepicker uses what I feel is the wrong notation
		if (ret) ret.todayText = ret.currentText;
		return ret;
	}
];

//**********************************************************
// Date formatting and parsing

// from http://stackoverflow.com/a/1268377 . Assumes whole positive numbers; too-long numbers are left as is
bililite.pad = function (n, p) {
	var zeros = Math.max(0, p - n.toString().length );
	return Math.pow(10,zeros).toString().substr(1) + n;
}

bililite.format = function (d, format, l10n){
	d = l10n.calendar(d);
	return format.
		replace (/dd/g, bililite.pad(d.d, 2)).
		replace (/d/g, d.d).
		replace (/mm/g, bililite.pad(d.m+1, 2)).
		replace (/m/g, d.m+1).
		replace (/yyyy/g, bililite.pad(d.y, 4)).
		replace (/yy/g, d.y); // jQuery UI datepicker uses yy for the 4-digit year
};

bililite.localize = function (text, l10n){
	return l10n[text+'Text'] || '';
};

bililite.parse = function (s, format, l10n){
	// I want to accept as many inputs as possible; we just look for 3 numbers in the right order.
	// The l10n argument is for possible extension
	var d = l10n.calendar(new Date); // an arbitrary date to get the toDate function
	var ymd = format. // determine the order of year-month-day
		replace(/[^ymd]/g,'').
		replace(/y+/g,'y').
		replace(/m+/g,'m').
		replace(/d+/g,'d');
	var match = s.match(/(\d+)/g); // get the numbers
	if (!match) return new Date(NaN); // invalid Date
	// make sure to coerce these into numbers
	return d.toDate({y: match[ymd.indexOf('y')]*1, m: match[ymd.indexOf('m')]-1, d: match[ymd.indexOf('d')]*1});
};

//**********************************************************
// Single month calendar widget

$.widget ('bililite.flexcalpage', {
	options: {
		current: undefined,
		value: undefined,
		filter: undefined,
		l10n: {},
		otherClasses: {
			'td a': 'ui-state-default',
			'td:not(.ui-datepicker-other-month) a': 'commit',
			'td.ui-datepicker-other-month > *': 'ui-priority-secondary',
			'.ui-datepicker-other-month a': 'hidden'
		},
		switchPage: function (d){ this._setOption('current', d); }
	},
	// public methods 
	format: function (d, format, l10n){
		if (typeof format !== 'string'){
			l10n = format;
			format = undefined;
		}
		l10n = l10n || this._l10n;
		format = format || l10n.dateFormat;
		return $.bililite.flexcal.format(d, format, l10n);
	},
	go: function (d){
		// setting the current option changes the calendar page if necessary. This function
		// calls options.switchPage instead.
		if (this.isDateShowing(d)){
			this._setOption('current', d);
		}else{
			this._trigger ('beforeswitchPage', event, d);
			this.options.switchPage.call(this, d);
		}
	},		
	isDateShowing: function (d){
		return this._elementForDate(d).closest('td').is(':not(.ui-datepicker-other-month)');
	},
	parse: function (d, format, l10n){
		if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return parseISO(d); // always allow ISO date strings
		if (typeof d === 'string'){
			if (typeof format !== 'string'){
				l10n = format;
				format = undefined;
			}
			// special case: parse(d) alone uses the first calendar format
			l10n = l10n || this._l10n;
			format = format || l10n.dateFormat;
			d = $.bililite.flexcal.parse (d, format, l10n);
		}
		if (!(d instanceof Date)) d = new Date(d);
		return d;
	},
	// protected members
	_l10n: tol10n(),
	// protected methods
	_addHandlers: function(){
		// widget._on sets 'this' correctly. Nice
		this.element.attr('tabindex', 0); // make sure we accept focus
		this._on({
			'click .commit': function (event){
				this._setOption('value', this._dateForElement(event.currentTarget));
			},
			'click .go': function (event){
				this.go(this._dateForElement(event.currentTarget));
			},
			'keydown': function (event) {
				// largely from http://oaa-accessibility.org/example/15/ plus respecting isRTL, and changing control-keys to alt keys (FF uses ctrl-page up/down to switch tabs)
				var dir = this._l10n.isRTL ? -1 : 1;
				var offsetDate = (function (n) {
					this.go(bililite.addDay(new Date(this.options.current), n));
					return false;
				}).bind(this);
				var calendarDate = (function (which) {
					this.go(this._l10n.calendar(this.options.current)[which]);
					return false;
				}).bind(this);
				if (!event.ctrlKey && !event.altKey) switch (event.keyCode){
					case $.ui.keyCode.ENTER:
					case $.ui.keyCode.SPACE:this._setOption('value', this.options.current); return false;
					case $.ui.keyCode.RIGHT: return offsetDate(dir);
					case $.ui.keyCode.LEFT: return offsetDate(-dir);
					case $.ui.keyCode.UP: return offsetDate(-this._l10n.dayNamesMin.length);
					case $.ui.keyCode.DOWN: return offsetDate(this._l10n.dayNamesMin.length);
					case $.ui.keyCode.PAGE_UP: return calendarDate('prev');
					case $.ui.keyCode.PAGE_DOWN: return calendarDate('next');
					case $.ui.keyCode.HOME: return calendarDate('first');
					case $.ui.keyCode.END: return calendarDate('last');
				}
				if (event.altKey) switch (event.keyCode){
					case $.ui.keyCode.PAGE_UP: return calendarDate('prevYear');
					case $.ui.keyCode.PAGE_DOWN: return calendarDate('nextYear');
				}
			}
		});
	},
	_adjustHTML: function(){
		var self = this;
		// _generateCalendar just creates a structural calendar. This sets the active elements
		$.each(this.options.otherClasses, function (selector, classes){
			$(selector, self.element).addClass(classes);
		});
		// the following are the states from jQuery UI datepicker
		$('a', this.element).removeClass ('ui-state-highlight ui-state-focus ui-state-active');
		this._elementForDate(new Date).addClass('ui-state-highlight');
		this._elementForDate(this.options.current).addClass('ui-state-focus');
		this._elementForDate(this.options.value).addClass('ui-state-active');
		this._hoverable ($('.go, .commit', this.element));
	},
	_dateForElement(e){
		return this.parse($(e).attr('aria-label'));
	},
	_destroy: function(){
		this.element.removeAttr('dir').removeClass('flexcalpage').empty();
	},
	_elementForDate: function (d, context){
		return $('td a[aria-label='+formatISO(d)+']', context || this.element);
	},
	_init: function (){
		this._setL10n(this.options.l10n);
		this.options.value = this.parse(this.options.value);
		if (isNaN(this.options.value.getDate())) this.options.value = new Date;
		this.options.current = this.parse(this.options.current);
		if (isNaN(this.options.current.getDate())) this.options.current = this.options.value;
		this._draw(this.options.current);
		this._addHandlers();
	},
	_draw: function(d){
		var cal = this._l10n.calendar(d);
		this.element.
			attr('dir', this._l10n.isRTL ? 'rtl' : 'ltr').
			addClass('flexcalpage').
			empty().
			append(this._generateNav(cal, d)).
			append(this._generateCalendar(cal, d));
		this._adjustHTML();
		var table = this.element.find('table');
		var size = {width: table.trueWidth(), height: table.trueHeight() };
		this.element.css(size);
	},
	_generateCalendar: function (cal, d){
		return $('<table>').
			append(this._generateCaption(cal, d)).
			append(this._generateWeekHeader(cal, d)).
			append(this._generateCalendarBody(cal, d));
	},
	_generateCalendarBody: function (cal, d){
		var l10n = this._l10n;
		var daysinweek = l10n.dayNamesMin.length;
		var cal = l10n.calendar(d);
		var dow = (cal.dow - l10n.firstDay + daysinweek) % daysinweek; // mod operator (% fails for negative dividends)
		var body = $('<tbody>')
		var rows = [], row = [];
		// TODO: get the right number for i!
		d = bililite.addDay(new Date(cal.first), -dow); // start of visible month
		for (var i = l10n.calendar(d).d; d < cal.first ; ++i, bililite.addDay(d)){
			row.push(this._generateOtherDate(cal, d, i));
		}
		for (i = 1; d <= cal.last; ++i, ++dow, bililite.addDay(d)){
			row.push (this._generateDate(cal, d, i));
			if (dow >= daysinweek-1){
				rows.push($('<tr>').append(row));
				row = [];
				dow=-1;
			}
		}
		if (dow > 0){
			for (i = 1; dow < daysinweek; ++i, ++dow, bililite.addDay(d)){
				row.push(this._generateOtherDate(cal, d, i));
			}
		}
		rows.push($('<tr>').append(row)); // catch that last week;
		return body.append(rows);
	},
	_generateCaption: function (cal, d){
		return $('<caption>').
			addClass("ui-datepicker-header ui-widget-header ui-corner-all").
			append (this._generateCaptionText(cal, d));
	},
	_generateCaptionText: function(cal, d){
		return this._l10n.monthNames[cal.m]+'&nbsp;'+this._l10n.years(cal.y);
	},
	_generateDate: function(cal, d, i){
		var dstring = formatISO(d);
		return $('<td>').append($('<a>').
			attr('aria-label', dstring).
			attr('title', dstring).
			text(this._generateDateText(cal, d, i))
		);
	},
	_generateDateText: function(cal, d, i){
		return this._l10n.dates(i);
	},
	_generateWeekHeader: function (cal, d){
		var dayNames = this._listDaysOfWeek (cal.first, cal.dow);
		// short "months" are only present in calendars that add days that are not part of the week (see the French Revolutionary calendar)
		var hideWeekHeader = (cal.last - cal.first)/oneDay < dayNames.length;
		var header = $('<thead>').append(dayNames.map (function(day){
			return $('<th>').append($('<span>').text(day));
		}));
		if (hideWeekHeader) header.css({visibility: 'hidden', lineHeight: 0});
		return header;
	},
	_generateNav: function (cal, d){
		// TODO: next/prev buttons
		return $('<nav>');
	},
	_generateOtherDate: function(cal, d, i){
		// TODO: allow for other month dates
		return this._generateDate(cal,d,i).addClass('ui-datepicker-other-month');
	},
	_listDaysOfWeek: function (d, dow){
		// returns an array of days of the week, starting at the localized first day of the week
		// uses the week centered around d, which is on dow day of the week.
		// not used in this version, but allows for localized formatting
		var dayNames = this._l10n.dayNamesMin.slice(); // copy
		for (var i = 0; i < this._l10n.firstDay; ++i) dayNames.push(dayNames.shift()); // rotate the names
		return dayNames;
	},
	_setL10n: function (l10n){
		this._l10n = tol10n(l10n);
		this._trigger('setL10n', null, this._l10n);
	},
	_setOption: function(key, value) {
		if (key == 'value' || key == 'current'){
			value = this.parse(value);
			if (isNaN(value.getDate())) return; // reject invalid dates
		}
		this._super.apply(this, [key, value]);
		if (key == 'l10n'){
			this._draw(this.options.current);
		}else if (key == 'value' || key == 'otherClasses'){
			this._adjustHTML();
			if (key == 'value') this._trigger('commit', null, this.options.value);
		}else if (key == 'current'){
			if (this.isDateShowing(this.options.current)){
				this._adjustHTML(); // just change the focused date
			}else{
				this._draw(this.options.current); // redraw the whole calendar
			}
			this._trigger('go', null, this.options.current);
		}
	}
});

})(jQuery, jQuery.bililite);
