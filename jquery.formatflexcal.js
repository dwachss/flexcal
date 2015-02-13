// formatflexcal: a date picker with selectable formatting
// Version 1.0
// Copyright (c) 2010 Daniel Wachsstock
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
	
function format(d){
	return this.formatCalendar.formatDate(
		this.options.formatTemplate,
		this.formatCalendar.fromJSDate(d),
		this.options.formatSettings
	);
}

$.ui.flexcal.subclass('bililite.formatflexcal', {
	options: {
		formatTemplate: 'm/d/yyyy',
		formatCalendar: 'gregorian',
		formatLanguage: 'en',
		formatSettings: {}
	},
	_init: function(){
		this._resetFormatter();
	},
	_setOption: function(key, value){
		_super(key, value);
		if (/^format/.test(key)){
			this._resetFormatter();
			this._setDate(undefined, true);
		}
	},
	format: format,
	_date2string: format,
	_createDate: function (d, oldd){
		if (d instanceof String) try{
			return this.formatCalendar.parseDate (
				this.options.formatTemplate,
				d,
				this.options.formatSettings
			).toJSDate();
		}catch(e){
			return oldd || new Date;
		}
		// not a string. See if Date can handle it.
		if (d === null) console.error('null date');
		d = new Date(d);
		if (isNaN(d.getTime())) return oldd || new Date;
		return d;
	},
	_resetFormatter: function(){
		this.formatCalendar = $.calendars.instance(this.options.formatCalendar, this.options.formatLanguage);
	}
});

})(jQuery);
