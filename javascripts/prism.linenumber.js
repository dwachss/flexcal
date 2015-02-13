// Line wrapping plugin for Prism (to allow line numbering with CSS)
// Documentation: http://bililite.com/blog/2012/08/05/line-numbering-plugin-for-prism/
// Version: 2.1
// Copyright (c) 2013 Daniel Wachsstock
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

Prism.hooks.add('before-insert', function(env){
	var el = env.element;
	if (!(el.hasAttribute('data-linenumber'))) return;
	var startNumber = parseInt(el.getAttribute('data-linenumber'))||0;
	el.style.counterReset = getComputedStyle(el).counterReset.replace(/-?\d+/, startNumber-1);
	var line = '<span class=line >', endline = '</span>';
	// some highlighting puts newlines inside the span, which messes up the code below. Fix that. Newlines that are actually inside the span will still 
	// cause problems.
	var code = env.highlightedCode.replace(/\n<\/span>/g, '</span>\n');
	env.highlightedCode = line + code.split('\n').join(endline+'\n'+line) + endline;
});

