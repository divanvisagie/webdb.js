
var editor = CodeMirror.fromTextArea( document.querySelector( '#code' ), {
	lineNumbers: true,
	theme : 'solarized dark'
});

function attachTextListener(input, func) {
    if (window.addEventListener) {
        input.addEventListener( 'input' , func, false);
    } else
        input.attachEvent( 'onpropertychange', function() {
        func.call(input);
    });
}