

// Language selector
//--------------------------------------------------
var langSelector = querySelector('.lang-selector');

function closeLangSelector() {
  langSelector.classList.remove('js-show-lang-selector');
}
function toggleLangSelector(ev) {
  langSelector.classList.toggle('js-show-lang-selector');
  ev.stopPropagation();
}

langSelector.addEventListener('click', function(event) {
  toggleLangSelector(event);
});

body.addEventListener('click', function() {
  closeLangSelector();
});