// flexcal: a multi-calendar date picker 

// Version 3.1.1

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
$.fn.extend({
	// utility function to look for elements in the jQuery object ($.fn.filter) and elements that are children of the jQuery object ($.fn.find)
	findandfilter: function(selector){
		var ret = this.filter(selector).add(this.find(selector));
		ret.prevObject = ret.prevObject.prevObject; // maintain the filter/end chain correctly (the filter and the find both push onto the chain). 
		return ret;
	},
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
	tableSize: function(topParent){
		// Get the "natural" dimensions of a table; the browser normally squeezes it to fit the container no matter what .
		// Hack it by displaying all ancestors with infinite width, the way jQuery itself does for invisible elements.
		// and it seems that offsetHeight for a table does not include the caption, at least in Firefox
		// returns the offset dimension (content + padding + border); you need to parse the margin CSS if you want that.
		// topParent is the top-most ancestor that we need to hack
		topParent = topParent || $('body')[0];
		function truesize (e, parent){
			var ret = {};
			if (!parent || parent == topParent) return {width: e.offsetWidth, height: trueheight(e)};
			$.swap (
				parent,
				{width:'9999px',  display:'block'},
				function() { ret = truesize(e, parent.parentNode) }
			);
			return ret;
		}
		function trueheight(e){
			for (var child = e.firstChild; child; child = child.nextSibling){ 
					if (child.nodeName.toLowerCase() == 'caption'){ 
							e.removeChild(child); 
							var h = e.offsetHeight; 
							e.insertBefore(child, e.firstChild); 
							return h + child.offsetHeight; 
					} 
			} 
			return e.offsetHeight;
		}
		return this.length ? truesize (this[0], this[0].parentNode) : {height: 0, width: 0} ;
	}
});

// correct for IE not expanding <UL>s to fill the container if they have layout
if ($.support.ULwidth=== undefined){
	$.support.ULwidth = (function(){
		var test = $('<div style="position: absolute;"><ul class="" style="height: 1%;"></ul><p style="width: 100px"></p></div>').appendTo('body');
		var ret = test.find('ul').width() > 0;
		test.remove();
		return ret;
	})();
}

var oneDay = 86400000; // milliseconds/day
// for internal use; requires ECMAScript 5 (no IE 8!)
// must have parseISO(ISOdate(d)).getTime() === d.getTime()
// Can't just use new Date() for parseISO() because new Date('2015-02-27') assumes UTC, which gets converted to 
// a local time, which (for those of us in the Western hemisphere) is the day before.
function ISOdate(d) { return d.toISOString().slice(0,10) } 
function parseISO(s) {var m = s.match(/(\d+)/g); return new Date(m[0],m[1]-1,m[2]); }
// from http://stackoverflow.com/a/1268377 . Assumes whole positive numbers; too-long numbers are left as is
function pad(n, p) {
	var zeros = Math.max(0, p - n.toString().length );
	return Math.pow(10,zeros).toString().substr(1) + n;
}

var defaultURL = 'data:,' +
['<div class="ui-tabs ui-widget ui-widget-content ui-corner-all ui-datepicker ui-flexcal">',
'	<ul class="ui-tabs-nav ui-helper-reset ui-helper-clearfix ui-widget-header ui-corner-all"></ul>',
'	<div class="ui-flexcal-container">',
'		<div class="ui-flexcal-pane"></div>',
'		<div class="ui-flexcal-pane"></div>',
'	</div>',
'</div>'].join('\n');

$.widget('bililite.flexcal', $.bililite.ajaxpopup, {
	options: {
		url: defaultURL,
		calendars: ['en'],
		current: undefined,
		filter: undefined,
		hidetabs: 'conditional',
		l10n: {
			name: 'flexcal',
			monthNames: ['January','February','March','April','May','June',
				'July','August','September','October','November','December'],
			dayNamesMin: ['Su','Mo','Tu','We','Th','Fr','Sa'],
			prevText: 'Previous',
			nextText: 'Next',
			isRTL: false,
			firstDay: 0,
			years: function(n) {return n.toString()},
			fromYears: undefined,
			dates: function(n) {return n.toString()},
			fromDates: undefined,
			dateFormat: 'm/d/yyyy' // TODO: use toLocaleDateString
		},
		reposition: true,
		tab: 0,
		transition: function(o){
			o.elements.eq(o.currSlide).hide();
			o.elements.eq(1-o.currSlide).show();
		}
	},
	commit: function(d){
		console.log('committing');
		this.options.current = d;
		this.element.val(this.format(d));
		this._trigger('commit', 0, d);
	},
	_commit: function(d){
		// commit to the date, then close the calendar
		this.commit(d);
		this.element[0].focus(); 
		console.log('after focus');
		this.hide();
	},
	format: function (d){ // external formatting; the this.element.val is set to this.format(d) on commit
		var o = this.options;
		var l10n = tol10n(o.calendars[0], o.l10n); // use the first calendar
		return $.bililite.flexcal.format(d, l10n);
	},
	parse: function (d){ // external string (this.element.val) to a date
		if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return parseISO(d); // always allow ISO date strings
		var o = this.options;
		if (typeof d === 'string'){
			var l10n = tol10n(o.calendars[0], o.l10n); // use the first calendar
			d = $.bililite.flexcal.parse (d, l10n);
		}
		if (!(d instanceof Date)) d = new Date(d);
		if (isNaN(d.getTime())) d = this.options.current;
		return d;
	}, 
	show: function(){
		var $cont = this.box().find('.ui-flexcal-container');
		this.o.$cont = $cont;
		this.o.elements = this.o.$cont.children();
		this._setTabs();
		this._makeCurrentCalendar(this.options.tab);
		this._setDate(this.element.val());
		this._super();
	},
	_init: function(){
		var self = this;
		this.options.current = this.parse(this.options.current || new Date);
		this.o = $.extend({before: [], after: []}, this.options.transitionOptions); // create an "options" object for the cycle plugin
		this.o.$cont = this.o.elements = this.tabs = $([]); // create dummy elements until AJAX can get the real ones
		if (this.options.filter){
			// the filter option returns true for elements to allow, but _adjustHTML expects a filter that returns true for elements to disable
			this.o.excludefilter = function(){
				return !(self.options.filter.call(this, parseISO(this.rel)));
			}
		}
		this.o.currSlide = 0;
		this._setL10n(); // create a default localization
	},
	_fill: function(box){
		var self = this;
		this._super(box); // start getting the HTML as soon as possible
		this.element.bind(this.widgetEventPrefix+'shown', function(){
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
		box.click(function(e){
			var $target = $(e.target).closest('a');
			if ($target.length == 0 || $target.is('[href]')){
				return; // allow real links to work
			}else if ($target.is('.go')){
				self._setDate($target.attr('rel'));
			}else if ($target.is('.commit')){
				self._commit(parseISO($target.attr('rel')));
			}else if ($target.is('.ui-tabs-nav li:not(.ui-tabs-selected) a')){
				self._makeCurrentCalendar(self.tabs.index($target.parent())); // the click is on the <a> but the data is on the <li>
				self._setDate(undefined, true);
			}
			return false; // and don't leave the page (or even change to a /# page)
		}).keydown(function (e){
			// from http://dev.aol.com/dhtml_style_guide#datepicker plus respecting isRTL, and changing control-keys to alt keys (FF uses ctrl-page up/down to switch tabs)
			// alt-arrow keys switches calendars
			var dir = self.o.l10n.isRTL ? -1 : 1;
			function offsetDate(d) { self._setDate(new Date (self.options.current.getTime()+d*oneDay)); return false; }
			function calendarDate(which) { self._setDate(self.o.l10n.calendar(self.options.current)[which], true); return false; }
			if (!e.ctrlKey && !e.altKey) switch (e.keyCode){
				case $.ui.keyCode.ENTER: self._commit(self.options.current); return false;
				case $.ui.keyCode.RIGHT: return offsetDate(dir);
				case $.ui.keyCode.LEFT: return offsetDate(-dir);
				case $.ui.keyCode.UP: return offsetDate(-self.o.l10n.dayNamesMin.length);
				case $.ui.keyCode.DOWN: return offsetDate(self.o.l10n.dayNamesMin.length);
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
					self._makeCurrentCalendar((self.options.tab+1)%self.tabs.length);
					self._setDate(undefined, true);
					return false;
				case $.ui.keyCode.LEFT:
					self._makeCurrentCalendar((self.options.tab+self.tabs.length-1)%self.tabs.length);
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
		});
	},
	_adjustHTML: function(cal){
		cal.findandfilter('a:not([href])')['ui-clickable']();
		cal.filter('a.go').removeClass('ui-state-default') // ui-datepicker has its own styling
			.each(function(){ this.title = $(this).text() }); // when we use image replacement for the prev/next buttons, leave the text as a tooltip title
		// allow for using either the jQuery UI icons or the FontAwesome icon font
		cal.filter('a.ui-datepicker-prev').find('span.ui-icon').addClass('ui-icon-circle-triangle-w fa fa-chevron-circle-left');
		cal.filter('a.ui-datepicker-next').find('span.ui-icon').addClass('ui-icon-circle-triangle-e fa fa-chevron-circle-right');
		if (this.o.l10n.isRTL) cal.filter('table').css('direction', 'rtl');
		if (this.o.excludefilter) cal.find('a.commit').filter(this.o.excludefilter).
		  removeClass('commit')['ui-unclickable']().addClass('ui-state-disabled');
		return cal;
	},
	_createTabs: function(){
		var self = this;
		return this.box().find('ul.ui-tabs-nav')
			.html($.map(this.options.calendars, function(n,i){
				return $([
					'<li class="ui-corner-top" style="list-style: none"><a>', // odd bug: occasionally I get a list-style-image showing if I don't remove it on each tab
					tol10n(n, self.options.l10n).name,
					'</a></li>'
					].join('')).data('flexcal.l10n', n)[0];
			}));
	},
	_generateCalendar: function(d){
		// TODO: implement some kind of caching
		var today = ISOdate(this.parse(this.element.val())); // compare strings rather than Dates to avoid having the time be part of the comparison
		var thisd = ISOdate(this.options.current);
		var ret = [], l10n = this.o.l10n;
		var cal = l10n.calendar(d);
		var daysinweek = l10n.dayNamesMin.length, dow = cal.dow;
		ret.push (
			'<a class="go ',
			l10n.isRTL ? 'ui-datepicker-next ' : 'ui-datepicker-prev ',
			'ui-corner-all" rel="', ISOdate(cal.prev) ,'">',
			'<span class="ui-icon">',
			'<span>'+l10n.prevText || 'Previous'+'</span>', // internal span for icon replacement
			'</span>',
			'</a>'
		);
		ret.push (
			'<a class="go ',
			l10n.isRTL ? 'ui-datepicker-prev ' : 'ui-datepicker-next ',
			'ui-corner-all" rel="', ISOdate(cal.next),'">',
			'<span class="ui-icon">',
			'<span>'+l10n.nextText || 'Next'+'</span>', // internal span for icon replacement
			'</span>',
			'</a>'
		);
		ret.push(
			'<table class="ui-widget-content" style="border: none">',
			'<caption class="ui-datepicker-header ui-widget-header ui-corner-all">',
			'<span class="ui-datepicker-month">',
			l10n.monthNames[cal.m],
			'</span> <span class="ui-datepicker-year">',
			l10n.years(cal.y),
			'</span></caption>'
		);
		if ((cal.last - cal.first)/1000/60/60/24 > daysinweek){
			// short "months" are only present in calendars that add days that are not part of the week (see the French Revolutionary calendar)
			ret.push('<thead><tr><th>',l10n.dayNamesMin.join('</th><th>'),'</th></tr></thead>');
		}
		ret.push('<tbody>');
		if (dow > 0) ret.push('<tr>');
		for (var i = 0; i < dow; ++i) ret.push ('<td class="ui-datepicker-other-month ui-state-disabled"></td>');
		for (i = 1, d = cal.first; d <= cal.last; ++i, ++dow, d.setDate(d.getDate()+1)){
			var dstring = ISOdate(d);
			if (dow == 0) ret.push('<tr>');
			ret.push(
				'<td><a class="',
				dstring == today ? 'ui-state-active ' : (dstring == thisd ? 'ui-state-focus ' : ''),
				'commit" rel="',
				dstring,
				'" title="',
				dstring, // I think it would take too much time to run every single day through this.format. TODO: check this!
				'">',
				l10n.dates(i),
				'</a></td>'
			);
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
	_makeCurrentCalendar: function (n){
		this.tabs.eq(this.options.tab).removeClass('ui-tabs-selected ui-state-active')
			.children()['ui-clickable']();
		n = Math.min(this.tabs.length-1, Math.max (0, n)) || 0; // correct the parameters
		var tab = this.tabs.eq(n).addClass('ui-tabs-selected ui-state-active') // mark the tab as current
			.children()['ui-unclickable']().end(); // and remove the clickable indication
		this._setL10n(tab.data('flexcal.l10n'));
		this.o.rev = (n < this.options.tab) ^ !!this.o.l10n.isRTL; // true if the transition should indicate backwards
		this.options.tab = n;
	},
	_setDate: function(d, animate){
		// d is the date we want to change to; if undefined just redraws the calendar
		// set animate == true to force the animated transition, false to prevent it.
		// if undefined, only animate if the new date is not on the currently visible calendar
		var currCalendar = this.o.elements.eq(this.o.currSlide).find('table');
		d = this.parse(d);
		// the find(..) looks for a date element with the desired date (stored in the rel attribute). If it's there, then the new date is showing and we can use it
		if (animate == null) animate = currCalendar.find('a[rel="'+ISOdate(d)+'"]').length == 0;
		if (!animate){
			currCalendar.find('a').removeClass('ui-state-focus').filter('[rel="'+ISOdate(d)+'"]').addClass('ui-state-focus');
		}else{
			if (this.options.current.getTime() != d.getTime()) this.o.rev = this.options.current > d; // if the date is unchanged, we may be transitioning calendars, so leave the rev flag alone
			var cal = this._generateCalendar(d);
			var slide = this.o.elements.eq(1-this.o.currSlide).html(cal);
			this._adjustHTML(cal);
			var size = slide.find('table').tableSize(this.box().parent()[0]);
			slide.css(size);
			this._transition(size);
		}
		this._trigger('set', 0, [d, this.options.current]);
		this.options.current = d;
	},
	_setL10n: function(name){
		this.o.l10n = tol10n(name, this.options.l10n);
		this._trigger('l10n', 0, name);
	},
	_setTabs: function(){
		this.tabs = this._createTabs().children();
		var hidetabs = this.options.hidetabs;
		this.tabs.children()['ui-clickable'](); // the <a>'s are the clickable elements
		if (hidetabs === true || (hidetabs =='conditional' && this.options.calendars.length == 1)){
			this.tabs.parent().hide();
		}else{
			this.tabs.parent().show();
			this._makeCurrentCalendar(this.options.tab);
		}
	},
	_setOption: function(key, value) {
		if (key == 'current'){
			this._setDate(value);
			return; // _setDate records the new date in options.current; we want a valid date, not whatever the user passed in
		}
		this._super(key, value);
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
			this._setTabs();
			this._makeCurrentCalendar(value);
			this._setDate(undefined, true);
		}
		if (key == 'transitionOptions') $.extend (this.o, value); // actually change the transition options
	},
	_transition: function(size){
		var next = 1-this.o.currSlide, first = this.o.elements.eq(this.o.currSlide), second = this.o.elements.eq(next), self = this;
		function nextSlide(){
			self.o.currSlide = next;
			// IE won't set the tab size correctly, so we do it by hand. 
			if (!$.support.ULwidth){
				var tabbar = self.tabs.parent();
				var width = size.width;
				$.each(['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'],
					function(){ width -= parseFloat(tabbar.css(this.toString())) });
				tabbar.width(width);
			}
		}
		if (this.box().is(':hidden')){
			// if box is hidden, then we don't need to animate anything
			first.hide();
			second.css({top: 0, left: 0, opacity: 1}).show(); // make sure we correct any leftover css from the transition effects
			self.o.$cont.css(size);
			nextSlide();
		}else{
			// Make the parent sized correctly then animate to the larger size before and to the smaller size after the transition
			this.o.$cont.animate(size, 100, function(){
				self.o.elements.stop (true, true); // make sure that the new calendar is available to show
				self.options.transition(self.o);
				nextSlide();
				if (self.options.reposition) self.position(); // adjust position for new size (this will jump rather than animate, but I'm not sure what to do about that.
			});
		}
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
			d: d,
			dow: first.getDay(),
			toDate: function (d) {return new Date (d.y, d.m, d.d)}
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

// need to add the default after it is defined
$.bililite.flexcal.prototype.options.l10n.calendar = $.bililite.flexcal.calendars.gregorian;

window.archaicNumbers = function(arr){
	return function(n){
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
	}
}

var arabic2hebrew = archaicNumbers([
	[1000,''], // over 1000 is ignored
	[400,'&#1514;'],
	[300,'&#1513;'],
	[200,'&#1512;'],
	[100,'&#1511;'],
	[90,'&#1510;'],
	[80,'&#1508;'],
	[70,'&#1506;'],
	[60,'&#1505;'],
	[50,'&#1504;'],
	[40,'&#1502;'],
	[30,'&#1500;'],
	[20,'&#1499;'],
	[10,'&#1497;'],
	[9,'&#1496;'],
	[8,'&#1495;'],
	[7,'&#1494;'],
	[6,'&#1493;'],
	[5,'&#1492;'],
	[4,'&#1491;'],
	[3,'&#1490;'],
	[2,'&#1489;'],
	[1,'&#1488;'],
	[/&#1497;&#1492;/, '&#1496;&#x05F4;&#1493;'], // special cases for 15 and 16
	[/&#1497;&#1493;/, '&#1496;&#x05F4;&#1494;'],
	/*
	[/&#1499;$/,'&#1498;'], // sofit letters; from my Israeli correspondents it seems that numbers do not use sofit letters
	[/&#1502;$/,'&#1501;'],
	[/&#1504;$/,'&#1503;'],
	[/&#1508;$/,'&#1507;'],
	[/&#1510;$/,'&#1509;'],
	*/
	[/(&#\d{4};)(&#\d{4};)$/, '$1&#x05F4;$2'], // gershayim (what I always called "choopchiks"--the double or single hash marks
	[/^(&#\d{4};)$/, "$1&#x05F3;"] // geresh
]);

$.bililite.flexcal.l10n = {
	en: {
		name: 'English'
	},
	jewish: {
		name: 'Jewish',
		calendar: $.bililite.flexcal.calendars.jewish,
		monthNames: ['Nisan', 'Iyar', 'Sivan', 'Tammuz', 'Av', 'Elul',
			'Tishrei', 'Cheshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar',
			'Adar I', 'Adar II'],
		dayNamesMin: ['Su','Mo','Tu','We','Th','Fr','&#1513;']
	},
	'he-jewish': {
		name: '&#1506;&#1489;&#1512;&#1497;&#1514;',
		calendar: $.bililite.flexcal.calendars.jewish,
		monthNames:  [
			"&#1504;&#1497;&#1505;&#1503;",
			"&#1488;&#1497;&#1497;&#1512;",
			"&#1505;&#1497;&#1493;&#1503;",
			"&#1514;&#1502;&#1493;&#1494;",
			"&#1488;&#1489;",
			"&#1488;&#1500;&#1493;&#1500;",
			"&#1514;&#1513;&#1512;&#1497;",
			"&#1495;&#1513;&#1493;&#1503;",
			"&#1499;&#1505;&#1500;&#1493;",
			"&#1496;&#1489;&#1514;",
			"&#1513;&#1489;&#1496;",
			"&#1488;&#1491;&#1512;",
			"&#1488;&#1491;&#1512; &#1488;'",
			"&#1488;&#1491;&#1512; &#1489;'"
		],
		dayNamesMin: ['&#1488;&#x05F3;','&#1489;&#x05F3;','&#1490;&#x05F3;','&#1491;&#x05F3;','&#1492;&#x05F3;',
			'&#1493;&#x05F3;','&#1513;&#1489;&#1514;'],
		isRTL: true,
		prevText: '&#1492;&#1511;&#1493;&#1491;&#1501;',
		nextText: '&#1492;&#1489;&#1488;',
		years: arabic2hebrew,
		dates: arabic2hebrew
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
	return $.extend(true, {}, $.bililite.flexcal.prototype.options.l10n, defaultL10n, partialL10n(name));
};
$.bililite.flexcal.tol10n = tol10n;

function partialL10n (name){
	if (name == null) return {};
	if ($.isPlainObject(name)) return name;
	if ($.isArray(name)) return name.reduce( function (previous, current){ // fold all the elements into an empty object
		return $.extend(previous, partialL10n(current));
	}, {});
	if ($.bililite.flexcal.l10n[name]) return $.bililite.flexcal.l10n[name];
	for (var loc in tol10n.localizers){
		var ret = tol10n.localizers[loc](name);
		if (ret){
			$.bililite.flexcal.l10n[name] = ret;
			return ret;
		}
	}
	// Does not match a localization; assume this is just the name
	return {name: name.toString()}
};

$.bililite.flexcal.tol10n.localizers = {
	datepicker: function (name){
		return $.datepicker.regional[name];
	}
};

if ($.calendars) $.bililite.flexcal.tol10n.localizers.woodsCalendar = function (name){
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
				dow: first.getDay()
			}
		}
	}
	var region = $.calendars.calendars[calendarSystem].prototype.regionalOptions; // where the details are stored
	if (!(language in region)) return;
	var ret = $.extend({}, region[''], region[language]);
	ret.calendar = $.bililite.flexcal.calendars[calendarSystem];
	// next and prev text are in the date picker, not the language localization
	if (language in $.calendarsPicker.regionalOptions){
		// jQuery UI standards say don't include the little arrows, which calendarsPicker often does
		var next = $.calendarsPicker.regionalOptions[language].nextText.replace (/&#x3e;/g,'');
		var prev = $.calendarsPicker.regionalOptions[language].prevText.replace (/&#x3c;/g,'');
		if (next) ret.nextText = next;
		if (prev) ret.prevText = prev;
	};
	return ret;	
};

// TODO: the Globalize routines
	
$.bililite.flexcal.format = function (d, l10n){
	return l10n.dateFormat.
		replace (/dd/g, pad(d.getDate(), 2)).
		replace (/d/g, d.getDate()).
		replace (/mm/g, pad(d.getMonth()+1, 2)).
		replace (/m/g, d.getMonth()+1).
		replace (/yyyy/g, d.getFullYear());
};

$.bililite.flexcal.parse = function (d, l10n){
	// I want to accept as many inputs as possible; we just look for 3 numbers in the right order
	var ymd = l10n.dateFormat. // determine the order of year-month-day
		replace(/[^ymd]/g,'').
		replace(/y+/g,'y').
		replace(/m+/g,'m').
		replace(/d+/g,'d');
	var match = d.match(/(\d+)/g); // get the numbers
	if (!match) return new Date(NaN); // invalid Date
	return new Date(match[ymd.indexOf('y')], match[ymd.indexOf('m')]-1, match[ymd.indexOf('d')]);
};

})(jQuery);
