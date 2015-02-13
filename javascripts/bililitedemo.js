// simple javascripts for demos
$(document).ready(function(){
	// set up the demos
	$('code.demo.language-html').each(function(){
		var pre = $(this).parents('pre'); // insert after the enclosing "pre" if it exists
		var target = pre.length ? pre : this
		$($(this).text()).insertAfter(target);
	});
	$('code.demo.language-css').each(function(){
		$('<style>'+$(this).text()+'</style>').appendTo('head');
	});
	eval($('code.demo.language-javascript').text());
	
	
	// Prism uses a different notation (language-markup rather than language-html)
	Prism.languages.html = Prism.languages.markup;
	// Add jquery-specific markup 
	Prism.languages.insertBefore("javascript", "keyword", {jquery: /\$|\bjQuery\b/});
	// quick whitespace trimming plugin
	Prism.hooks.add('before-highlight', function(env){
		env.code = env.code.trim();
	});
	// and we use my line numbering plugin; add line numbers to long code samples
	$('code').each(function(){
		if (this.textContent.split('\n').length > 10 && !this.hasAttribute('data-linenumber')) this.setAttribute('data-linenumber',0);
	});
	Prism.highlightAll();
	
});
