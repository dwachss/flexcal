// Jewish calendar localization for flexcal
(function($, bililite){

bililite.archaicNumbers = function (arr){
	// arr is assumed to be ordered in the order desired for formatting
	// for parsing we want to read the longest string first.
	var arrParse = arr.slice().sort(function (a,b) {return b[1].length - a[1].length});
	function valid(s){
		// simple function to determine that a string would be a valid result of format(n)
		// assumes that any character present in the output strings is valid.
		// assumes no regexp-special characters in the strings
		var chars = arr.map( function (item) { return item[1] }).join('');
		return new RegExp('^['+chars+']+$').test(s); 
	}
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
			if (!valid(s)) return;
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
		},
		valid: valid
	}
};

bililite.calendars.jewish =  function(d){
	var h = civ2heb(d);
	var roshchodesh = bililite.addDay(new Date(d), -h.d+1);
	var daysinlastmonth = Math.max(civ2heb(bililite.addDay(new Date(roshchodesh),-1)).daysinmonth, h.d); //  the min/max() correct for the possibility of other month being too short
	var daysintonextmonth = Math.min(civ2heb(bililite.addDay(new Date(roshchodesh), h.daysinmonth)).daysinmonth, h.d);
	return {
		first: roshchodesh,
		last: bililite.addDay(new Date(roshchodesh), h.daysinmonth-1),
		prev: bililite.addDay(new Date(d), -daysinlastmonth),
		next: bililite.addDay(new Date(roshchodesh), h.daysinmonth+daysintonextmonth-1),
		prevYear: heb2civ($.extend({}, h, {y: h.y-1})),
		nextYear: heb2civ($.extend({}, h, {y: h.y+1})),
		m: h.m,
		y: h.y,
		d: h.d,
		dow: roshchodesh.getDay(),
		toDate: heb2civ
	};
};

var latin2hebrew = bililite.archaicNumbers([
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
// monkey patch since years do not include the thousands digit (Y6K problem)
latin2hebrew.parse = (function (orig){
	return function (s){ return orig(s) + 5000; }
})(latin2hebrew.parse);

$.extend (bililite.l10n, {
		jewish: {
		name: 'Jewish',
		calendar: bililite.calendars.jewish,
		monthNames: ['Nisan', 'Iyar', 'Sivan', 'Tammuz', 'Av', 'Elul',
			'Tishrei', 'Cheshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar',
			'Adar I', 'Adar II'],
		monthNamesShort: ['Nisan', 'Iyar', 'Sivan', 'Tammuz', 'Av', 'Elul',
			'Tishrei', 'Cheshvan', 'Kislev', 'Tevet', 'Shevat', 'Adar',
			'Adar I', 'Adar II'],
		dayNames: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','שבת'],
		dayNamesMin: ['Su','Mo','Tu','We','Th','Fr','ש'],
		dayNamesShort: ['Sun','Mon','Tue','Wed','Thu','Fri','שבת'],
	},
	'he-jewish': {
		name: 'עברית',
		calendar: bililite.calendars.jewish,
		monthNames:  ["ניסן", "אייר", "סיון", "תמוז", "אב", "אלול",
			"תשרי", "חשון", "כסלו", "טבת", "שבט", "אדר",
			"אדר א׳", "אדר ב׳"],
		monthNamesShort:  ["ניסן", "אייר", "סיון", "תמוז", "אב", "אלול",
			"תשרי", "חשון", "כסלו", "טבת", "שבט", "אדר",
			"אדר א׳", "אדר ב׳"],
		dayNames: ['יום א׳','יום ב׳','יום ג׳','יום ד׳','יום ה׳','יום ו׳','שבת'],
		dayNamesShort: ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','שבת'],
		dayNamesMin: ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','שבת'],
		isRTL: true,
		prevText: 'הקודם',
		nextText: 'הבא',
		todayText: 'היום',
		closeText: 'סגור',
		years: latin2hebrew.format,
		dates: latin2hebrew.format
	}
});

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

})(jQuery, $.bililite);
 