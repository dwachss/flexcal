// Keith Wood's calendar localizations for flexcal
(function ($, bililite){
	
bililite.localizers.push(function (name){
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
	if (!(calendarSystem in bililite.calendars)){
		// create a flexcal-specific calendar system
		var c = $.calendars.instance(calendarSystem);
		bililite.calendars[calendarSystem] = function (d){
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
	ret.calendar = bililite.calendars[calendarSystem];
	// some details are in the date picker, not the language localization
	if (language in $.calendarsPicker.regionalOptions){
		ret = $.extend(ret, $.calendarsPicker.regionalOptions[language]);
	};
	return ret;	
});

})(jQuery, jQuery.bililite);
