// Extend flexcal with better formatting
// 
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

/*
 Designed to be flexible in parsing (http://en.wikipedia.org/wiki/Robustness_principle).
Proposal: similar to http://keith-wood.name/calendars.html#format , using ' to mark literals and '' for a single quote,
d - day of the month (no leading zero)
dd - day of the month (two digit)
dddd - day number formatted (result of l10n.dates(d))
D - day name, min
DD - day name, short
DDDD - day name, full
m - month of the year (no leading zero)
mm - month of the year (two digit)
M - month name, short (monthNamesShort then monthNames)
MM - month name, long (monthNames then monthNamesShort)
yy - year (full year but not padded digit; no two-year dates)
yyyy - year (four digit)
YYYY - formatted year (result of l10n.years(yyyy))

no julian dates or timestamps; no day of the year or week of the year for now.
No predefined formats for now.
*/

(function($, f){

// from http://stackoverflow.com/a/1268377 . Assumes whole positive numbers; too-long numbers are left as is
function pad(n, p) {
	var zeros = Math.max(0, p - n.toString().length );
	return Math.pow(10,zeros).toString().substr(1) + n;
}

f.localize = function (name, l10n){
	return l10n[name+'Text'] || '';
}

f.format = function (d, l10n){
	// I am aware that regular expressions are not a parser, but this will serve for now.
	// http://stackoverflow.com/questions/1732348/regex-match-open-tags-except-xhtml-self-contained-tags/1732454#1732454
	d = l10n.calendar(d); // convert to the localized date
	var dow = (d.dow + d.d - 1) % l10n.dayNames.length; // d.dow is the day of week of the first day of the month
	// replace text in braces
	var ret = l10n.dateFormat.replace(/{(\w+)}/g, function(match, name){
		return f.localize(name, l10n);
	});

	return ret.replace(/'((?:[^']|'')*)'|[dmy]{4}|[dmy]{1,2}/ig, function(match, part1){
		switch (match){
			case 'dddd': return l10n.dates(d.d);
			case 'dd': return pad(d.d, 2);
			case 'd': return d.d;
			case 'DDDD': return l10n.dayNames[dow];
			case 'DD': return l10n.dayNamesShort[dow];
			case 'D': return l10n.dayNamesMin[dow];
			case 'mm': return pad(d.m+1, 2);
			case 'm': return d.m+1;
			case 'MM': return l10n.monthNames[d.m];
			case 'M': return l10n.monthNamesShort[d.m];
			case 'yyyy': return pad(d.y, 4);
			case 'yy': return d.y; // jQuery UI datepicker uses yy for the 4-digit year
			case 'YYYY': return l10n.years(d.y);
			case "''": return "'";
			default: return part1 ? part1.replace (/''/g, "'") : match; // remove doubled quotes
		}
	});
};

f.parse = function (s, l10n){
	// replace text in braces
	var dateFormat = l10n.dateFormat.replace(/{(\w+)}/g, function(match, name){
		return f.localize(name, l10n);
	});
	// to allow for as generous a parse as possibe, simplify the format to just look for date parts
	// note that we ignore capital D; no way to parse days of the week meaningfully
	dateFormat = dateFormat.replace(/'((?:[^']|'')*)'|[dmMyY]+|./g, function(match, part1){
		if (/^d+$/.test(match)){
			return 'd';
		}else if (/^m+$/i.test(match)){
			return 'm';
		}else if (/^y+$/i.test(match)){
			return 'y';
		}else{
			return ' ';
		}
	}).replace (/[^dmy]+/g, '');
	var d, m, y;
	var index = 0; // track how far we have parsed
	// parse date format somehow
	dateFormat.split('').forEach(function(which){
		switch (which){
			case 'd': d = parseDate(); break;
			case 'm': m = parseMonth(); break;
			case 'y': y = parseYear(); break;
		}
	});
	return l10n.calendar(new Date).toDate({d: d, m: m, y: y});
	
	function parseDate (){
		if (checkError()) return;
		var d = parseNumber();
		if (d != undefined) return d;
		d = parseDateString(s.length);
		if (d != undefined) return d;
		++index; // skip this character and try again
		return parseDate();
	}
	function parseDateString(length){
		// look for the longest string that actually corresponds to a date string
		if (!l10n.fromDates) return; // no algorithm for parsing date strings
		if (length == index) return;
		var d = l10n.fromDates(s.substring(index, length));
		if (d != undefined) return d;
		return parseDateString(length-1);
	}
	function parseMonth (){
		if (checkError()) return;	
		var m = parseNumber();
		if (m != undefined) return m-1;
		m = parseMonthString(s.length);
		if (m != undefined) return m;
		++index;
		return parseMonth();
	}
	function parseMonthString(length){
		if (length == index) return;
		// do this
		var m = findMonthName(s.substring(index, length));
		if (m != undefined) return m;
		return parseMonthString(length-1);
	}
	function findMonthName(name){
		for (key in l10n) if (key.indexOf('month') == 0 && $.isArray(l10n[key])){
			var m = l10n[key].indexOf(name);
			if (m >= 0) return m;
		}
	}
	function parseYear (){
		if (checkError()) return;
		var y = parseNumber();
		if (y != undefined) return y;
		y = parseYearString(s.length);
		if (y != undefined) return y;
		++index;
		return parseYear();
	}	
	function parseYearString(length){
		// look for the longest string that actually corresponds to a year string
		if (!l10n.fromYears) return; // no algorithm for parsing date strings
		if (length == index) return;
		var d = l10n.fromYears(s.substring(index, length));
		if (d != undefined) return d;
		return parseYearString(length-1);
	}
	function checkError(){
		return index >= s.length;
	}
	function parseNumber(){
		var ret = undefined;
		while (/\d/.test(s.charAt(index))){
			ret = (ret == undefined) ? 0 : ret*10;
			ret += parseInt(s.charAt(index), 10);
			++index;
		}
		return ret;
	}
};

})(jQuery, jQuery.bililite.flexcal);
