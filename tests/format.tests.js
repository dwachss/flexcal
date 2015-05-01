QUnit.test( "format.parse", function( assert ) {
	var p = $.bililite.parse;
	var l = $.bililite.tol10n();
	var d = new Date(2015,1,12);
	assert.equal(p('2/12/2015', 'm/d/yyyy', l).getTime(), d.getTime(), "parse 'm/d/yyyy'" );
	assert.equal(p('02/12/2015','m/d/yyyy', l).getTime(), d.getTime(), "parse 'm/d/yyyy' liberally" );
	assert.equal(p('12.02.2015', 'dd.mm.yyyy', l).getTime(), d.getTime(), "parse 'dd.mm.yyyy'" );
	assert.equal(p('12/2/2015', 'dd.mm.yyyy', l).getTime(), d.getTime(), "parse 'dd.mm.yyyy' liberally" );
	assert.equal(p('12 February 2015', 'dd MM yyyy', l).getTime(), d.getTime(), "parse 'dd MM yyyy'" );
	assert.equal(p('12Feb2015', 'dd MM yyyy', l).getTime(), d.getTime(), "parse 'dd MM yyyy' with short month name" );
	assert.equal(p('12/2/2015', 'dd.mm.yyyy', l).getTime(), d.getTime(), "parse 'dd MM yyyy' liberally" );
});

QUnit.test( "format.format", function( assert ) {
	var l = $.bililite.tol10n();
	var f = $.bililite.format;
	var d = new Date(2015,1,12);
	assert.equal(f(d, 'm/d/yyyy', l), '2/12/2015', "format 'm/d/yyyy'" );
	assert.equal(f(d, 'dd.mm.yyyy', l), '12.02.2015', "format 'dd.mm.yyyy'" );
	assert.equal(f(d, "'{today}': dd.mm.yyyy", l), 'Today: 12.02.2015', "format '{today}: dd.mm.yyyy'" );
	assert.equal(f(d, 'd MM YYYY', l), '12 February 2015', "format 'd MM YYYY' works with fancy formatting" );

	var he = $.bililite.tol10n('he');
	assert.equal (f(d, 'D, dddd MM YYYY', he), 'ה\', 12 פברואר 2015', "format Hebrew 'D, dddd MM YYYY'");
	assert.equal (f(d, "'{today}': dddd MM YYYY", he), 'היום: 12 פברואר 2015', "format Hebrew '{today}: dddd MM YYYY'");
	assert.equal (f(d, 'יום DDDD, dddd MM YYYY', he), "יום חמישי, 12 פברואר 2015", "format Hebrew 'יום DDDD, dddd MM YYYY'");
	
	var jewish =  $.bililite.tol10n('jewish');
	assert.equal (f(d, 'DDDD, dddd MM YYYY', jewish), 'Thursday, 23 Shevat 5775', "format Jewish 'DDDD, dddd MM YYYY'");

	var test = $.bililite.tol10n({testText: "''yields falsehood when quined'' yields falsehood when quined"});
	assert.equal(f(d, "'{test}'", test), "'yields falsehood when quined' yields falsehood when quined", 'Format quine');
	assert.equal(f(d, "{test}", test), "'yiel12s falsehoo12 when quine12' yiel12s falsehoo12 when quine12", 'Format unquoted quine');
});
