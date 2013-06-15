require( ['tree'] , function( tree ){

	//tree = tr;


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
			var tables = {},
				indexes = {},
				other = {},
				tableCount = 0,
				indexCount = 0,
				otherCount = 0;

			for ( var i in rs ){

				if ( rs[i].type === 'table' ){
					tables[ rs[i].tableName ] = rs[i];
					tableCount++;
				}
				else if ( rs[i].type === 'index' ){
					indexes[ rs[i].tableName ] = rs[i];
					indexCount++;
				}
				else{
					other[ rs[i].tableName ] = rs[i];
					otherCount++;
				}
			}

			var obj = {};

			if ( tableCount > 0 )
				obj.Tables = tables;
			if ( indexCount > 0 )
				obj.Indexes = indexes;
			if ( otherCount > 0 )
				obj.Other = other;

			// var obj = {

			// 	Tables : tables,
			// 	Indexes : indexes,
			// 	Other : other
			// };

			tree.loadDbTree( webdb.dbDetails.name , obj );

		} );
	}

	refreshSideBar();


	/* creates a table from a json array */
	function tblWithJSONArr( jsonArr ){

		//console.log( headings );

		var table = document.createElement( 'table' );
		table.className = 'table table-bordered';
		table.style['background-color'] = 'white';
		table.style['border-radius'] = 0;

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

		//webdb.use( $( '#dbName' ).val() );
		refreshSideBar();
	} );

	$( '#dbRefreshButton' ).on( 'click' , refreshSideBar );



	$( '#run' ).on( 'click' , function(){

		$('#outputTab a[href="#home"]').tab('show');

		var codeText = editor.getValue(); /* Get the full code text */

		$( '#outputTab' ).html( '<li><a href="#home">Output</a></li>' );
		$( '#outputTable' ).html( '' );


		var lines = codeText.split('\n');
		console.log( 'processing' ,  lines );

		webdb.open();

		/* 
			The following contains a quick hack to determine the difference between a
			query and an execution, this logic or something better should be 
			dropped to webdb.js itself 
		*/

		var err_handler = function( res ){

			if ( res.hasOwnProperty( 'error' ) ){

				var row = document.createElement( 'tr' );
				row.className = 'error';

				row.innerHTML += '<td>' + this.query + '</td> <td>'+ res.error.message +'</td>';

				$( '#outputTable' ).append( row );

				return;
			}else {


				console.log(  'yeah dawg' );

				var row = document.createElement( 'tr' );
				row.className = 'success';

				row.innerHTML += '<td>' + this.query + '</td> <td>'+ 'Command Executed successfully' +'</td>';

				$( '#outputTable' ).append( row );

			}

		};


		var output = [];
		var count = 0;
		var transaction_handler = function( res ){

			if ( res.hasOwnProperty( 'error' ) ){

				var row = document.createElement( 'tr' );
				row.className = 'error';

				row.innerHTML += '<td>' + this.query + '</td> <td>'+ res.error.message +'</td>';

				$( '#outputTable' ).append( row );

				return;
			}else {


				console.log(  'yeah dawg' );

				var row = document.createElement( 'tr' );
				row.className = 'success';

				row.innerHTML += '<td>' + this.query + '</td> <td>'+ 'Command Executed successfully' +'</td>';

				$( '#outputTable' ).append( row );

			}

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

				webdb.executeTransaction( lines[k] , [] , transaction_handler.bind( { query : lines[k] } ) );

			} else { //its just an execution

				if( lines[k] === '' ) continue; //skip the blanks
				webdb.executeTransaction( lines[k] , [] , err_handler.bind( { query : lines[k] } ) );
			}
		}


	} );

} );
