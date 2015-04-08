QUnit.test( "parse", function( assert ) {
	var p = $.bililite.flexcal.parse;
	var d = new Date(2015,1,12);
	assert.equal(p('2/12/2015', {dateFormat: 'm/d/yyyy'}).getTime(), d.getTime(), "parse 'm/d/yyyy'" );
	assert.equal(p('02/12/2015', {dateFormat: 'm/d/yyyy'}).getTime(), d.getTime(), "parse 'm/d/yyyy' liberally" );
	assert.equal(p('12.02.2015', {dateFormat: 'dd.mm.yyyy'}).getTime(), d.getTime(), "parse 'dd.mm.yyyy'" );
	assert.equal(p('12/2/2015', {dateFormat: 'dd.mm.yyyy'}).getTime(), d.getTime(), "parse 'dd.mm.yyyy' liberally" );
});

QUnit.test( "format", function( assert ) {
	var f = $.bililite.flexcal.format;
	var d = new Date(2015,1,12);
	assert.equal(f(d, {dateFormat: 'm/d/yyyy'}), '2/12/2015', "format 'm/d/yyyy'" );
	assert.equal(f(d, {dateFormat: 'dd.mm.yyyy'}), '12.02.2015', "format 'dd.mm.yyyy'" );
});

// from the flexcal code. Not DRY
function ISOdate(d) { return d.toISOString().slice(0,10) } 
QUnit.test( "datepicker", function( assert ) {
	var fixture = $( "#qunit-fixture" );
	var target = $('<input>').appendTo(fixture);
	target.flexcal();
	target.val('2/12/2015');
	target.flexcal('show'); 
	var d = new Date(2015,1,12);
	var current = target.flexcal('option', 'current');
	assert.equal(ISOdate(current), ISOdate(d), 'current set');
	d = new Date(2015,2,13);
	target.flexcal('commit', d);
	assert.equal(target.val(), '3/13/2015', 'commit');
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
	var convertToRoman = $.bililite.flexcal.archaicNumbers(roman);
	assert.equal(convertToRoman.format(2015), 'MMXV');
	assert.equal(convertToRoman.parse('MMXV'), 2015);
	assert.equal(convertToRoman.format(409), 'CDIX');
	assert.equal(convertToRoman.parse('CDIX'), 409);
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
	var convertToHebrew = $.bililite.flexcal.archaicNumbers(hebrew);
	assert.equal(convertToHebrew.format(5775), 'תשע״ה');
	assert.equal(convertToHebrew.parse('תשע״ה'), 775);
});