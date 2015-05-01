QUnit.test( "parse", function( assert ) {
	var p = $.bililite.parse;
	var l = $.bililite.tol10n();
	var d = new Date(2015,1,12);
	assert.equal(p('2/12/2015', 'm/d/yyyy', l).getTime(), d.getTime(), "parse 'm/d/yyyy'" );
	assert.equal(p('02/12/2015', 'm/d/yyyy', l).getTime(), d.getTime(), "parse 'm/d/yyyy' liberally" );
	assert.equal(p('12.02.2015', 'dd.mm.yyyy', l).getTime(), d.getTime(), "parse 'dd.mm.yyyy'" );
	assert.equal(p('12/2/2015', 'dd.mm.yyyy', l).getTime(), d.getTime(), "parse 'dd.mm.yyyy' liberally" );
});

QUnit.test( "format", function( assert ) {
	var f = $.bililite.format;
	var l = $.bililite.tol10n();
	var d = new Date(2015,1,12);
	assert.equal(f(d,  'm/d/yyyy', l), '2/12/2015', "format 'm/d/yyyy'" );
	assert.equal(f(d, 'dd.mm.yyyy', l), '12.02.2015', "format 'dd.mm.yyyy'" );
	assert.equal(f(d, 'd MM YYYY', l), '12 MM YYYY', "format 'd MM YYYY' fails with simple formatting" );
});

QUnit.test('archaicNumbers', function (assert){
	var roman = [ 
		[1000, 'M'], 
		[900, 'CM'], 
		[500, 'D'], 
		[400, 'CD'], 
		[100, 'C'], 
		[90, 'XC'], 
		[50, 'L'], 
		[40, 'XL'], 
		[10, 'X'], 
		[9, 'IX'], 
		[5, 'V'], 
		[4, 'IV'], 
		[1, 'I'] 
	];
	var convertToRoman = $.bililite.archaicNumbers(roman);
	assert.equal(convertToRoman.format(2015), 'MMXV');
	assert.equal(convertToRoman.parse('MMXV'), 2015);
	assert.equal(convertToRoman.format(409), 'CDIX');
	assert.equal(convertToRoman.parse('CDIX'), 409);
	assert.equal(convertToRoman.parse('CDIX ', undefined));
	var hebrew = [
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
		[/([א-ת])([א-ת])$/, '$1״$2'], // gershayim
		[/^([א-ת])$/, "$1׳"] // geresh
	];
	var convertToHebrew = $.bililite.archaicNumbers(hebrew);
	convertToHebrew.parse = (function (orig){ // monkey patch idiom
		return function (s){
			// simple hack for 3-digit years. We assume we don't really want early dates
			var ret = orig(s);
			if (ret < 1000) ret += 5000;
			return ret;
		}
	})(convertToHebrew.parse);
	assert.equal(convertToHebrew.format(5775), 'תשע״ה');
	assert.equal(convertToHebrew.parse('תשע״ה'), 5775);
	assert.equal(convertToHebrew.parse('תשע״ה '), undefined);
});

QUnit.test('woodsCalendar', function (assert){
	var p = $.bililite.parse;
	var f = $.bililite.format;
	var l = $.bililite.tol10n('ar-islamic');
	var d = new Date(2015,1,12);
	assert.equal(p('04/22/1436', 'm/d/yyyy', l).getTime(), d.getTime(), "parse 'm/d/yyyy' liberally" );
	assert.equal(f(d, 'dd.mm.yyyy', l), '22.04.1436', "format 'dd.mm.yyyy'" );	
});
