
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

function refreshSideBar(){

	webdb.getSchema( function ( rs ){


		/* filter the schema data so that the sidebar looks better */
		var tables = {};
		var other = {};

		for ( var i in rs ){

			if ( rs[i].type === 'table' )
				tables[ rs[i].tableName ] = rs[i];
			else
				other[ rs[i].tableName ] = rs[i];
		}

		var obj = {

			Tables : tables,
			Other : other
		};

		loadDbTree( webdb.dbDetails.name , obj );

	} );
}

refreshSideBar();


/* creates a table from a json array */
function tblWithJSONArr( jsonArr ){

	//console.log( headings );

	var table = document.createElement( 'table' );
	table.className = 'table table-bordered';
	table.style['background-color'] = 'white';

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


/* Handle click events */
$( '#dbNameButton' ).on( 'click' , function( ev ){

	webdb.use( $( '#dbName' ).val() );
	refreshSideBar();
} );



$( '#run' ).on( 'click' , function(){

	var codeText = editor.getValue(); /* Get the full code text */

	$( '#outputTab' ).html( '<li><a href="#home">Output</a></li>' );
	$( '#outputTabContent' ).html( '<div class="tab-pane" id="home"></div>' );


	var lines = codeText.split('\n');
	console.log( 'processing' ,  lines );

	webdb.open();

	/* 
		The following contains a quick hack to determine the difference between a
		query and an execution, this logic or something better should be 
		dropped to webdb.js itself 
	*/

	var output = [];
	var count = 0;
	var transaction_handler = function( res ){

		output.push( res );

		var oElement = $( '#output' );
		//oElement.html( oElement.html() + JSON.stringify(res) + '<br/>' );

		var tbl = tblWithJSONArr( res );


		console.log( '____' , count++ );

		var tabs = document.querySelector( '#outputTab' );
		tabs.innerHTML +=   '<li><a href="#r'+ count +'">Result ' + count + '</a></li>';

		var tabContent = document.querySelector( '#outputTabContent' );
		tabContent.innerHTML += '<div class="tab-pane" id="r'+ count +'">' + '</div>';

		$( '#r' + count ).append( tbl );

		/* refresher script */
		$('#outputTab a').click(function (e) {
			e.preventDefault();
			$(this).tab('show');
		});


		console.log("-->",tbl);
	};

	for (var k in lines ){

		if ( lines[k].toUpperCase().indexOf( 'SELECT' ) > -1 ){ //its probably a select

			webdb.executeTransaction( lines[k] , [] , transaction_handler );

		} else { //its just an execution

			webdb.execute( lines[k] );
		}
	}
} );