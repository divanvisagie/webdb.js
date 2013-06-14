
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

$( '#run' ).on( 'click' , function(){

	var codeText = editor.getValue(); /* Get the full code text */


	var lines = codeText.split('\n');
	console.log( 'processing' ,  lines );

	webdb.open();

	/* 
		The following contains a quick hack to determine the difference between a
		query and an execution, this logic or something better should be 
		dropped to webdb.js itself 
	*/

	var output = [];

	for ( var k in lines ){

		if ( lines[k].toUpperCase().indexOf( 'SELECT' ) > -1 ){ //its probably a select

			webdb.executeTransaction( lines[k] , [] , function( res ){

				output.push( res );

				var oElement = $( '#output' );
				oElement.html( oElement.html() + JSON.stringify(res) + '<br/>' );

				console.log( '}}-->>' , res );
			} );

		} else { //its just an execution


			webdb.execute( lines[k] );

		}
	}

	


} );