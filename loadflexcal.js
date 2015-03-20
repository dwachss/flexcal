// loadflexcal.js
/* This is far more complicated than is usually necessary. I just want this to be kept up to date with the
	cutting-edge version, so it uses my jquery.repo routines to load.
	Normally, just use
		<link rel="stylesheet" href="flexcal.css" />
	in your <head>, and include
		<script src="jquery.ui.subclass.js"></script>
		<script src="jquery.textpopup.js"></script>
		<script src="jquery.flexcal.js"></script>
	after including jQuery UI
*/
$.ajaxSetup({
  cache: true // no reason not to cache scripts
});
$.getScript('https://cdn.rawgit.com/dwachss/jquery.repo/v1.1.1/jquery.repo.js').then(function(){
	return $.repo('dwachss/flexcal');
}).then(function (repo){
	$('head').append('<link rel=stylesheet href="'+repo+'/flexcal.css" />');
	return $.getScripts([
		repo+'/jquery.ui.subclass.js',
		repo+'/jquery.textpopup.js',
		repo+'/jquery.flexcal.js'
	]);
}).then(function(){
	return $.ready;
}).then(function(){
	return $.getScript ('javascripts/bililitedemo.js');
});
$.get('pages.json').then(function(pages){
	if (typeof pages === 'string') pages = JSON.parse(pages);
	for (page in pages){
		$('<p>').append($('<a>').text(page).attr('href', pages[page])).appendTo('nav');
	}
});

