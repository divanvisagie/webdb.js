
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



/* creates a table from a json array */
function tblWithJSONArr( jsonArr ){

	//console.log( headings );

	var table = document.createElement( 'table' );
	table.className = 'table table-bordered';

	var head = document.createElement( 'thead' );
	table.appendChild( head );

	/* get table headings */
	console.log( 'table with:' , jsonArr );

	var hrow = document.createElement( 'tr' );
	for ( var j in jsonArr[0] ){

		hrow.innerHTML += '<th>' + j + '</th>';
	}

	head.appendChild( hrow );

	/* table body */
	var tbody = document.createElement( 'tbody' );

	for ( var i in jsonArr ){

		var brow = document.createElement( 'tr' );
		for ( var k in jsonArr[i] ){

			brow.innerHTML += '<td>' + jsonArr[i][k] + '</td>';
		}
		tbody.appendChild( brow );
	}

	table.appendChild( tbody );

	return table;

}


$( '#run' ).on( 'click' , function(){

	var codeText = editor.getValue(); /* Get the full code text */

	$( '#output' ).html('');


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
				//oElement.html( oElement.html() + JSON.stringify(res) + '<br/>' );

				var tbl = tblWithJSONArr( res );


				$( '#output' ).append( tbl );
				console.log("-->",tbl);
			} );

		} else { //its just an execution


			webdb.execute( lines[k] );

		}
	}
} );