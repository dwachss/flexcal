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