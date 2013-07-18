/*
	Created By: Divan Visagie
*/

/* Shim for non amd modules */
requirejs.config({
    appDir: '.',
    baseUrl: 'javascript',
    paths: {

        'jquery': ['jquery.min'],
        'bootstrap': ['../bootstrap/js/bootstrap.min'],
        'knockout': ['knockout.min'],
        'codemirror' : ['../codemirror/lib/codemirror'],
        'cmjs' : ['../codemirror/mode/javascript/javascript'],
        'cmsql' : ['../codemirror/mode/sql/sql'],
        'webdb' : ['../webdb']

    },
    shim: {
        /* Set bootstrap dependencies (just jQuery) */
        'bootstrap' : ['jquery'],
        'cmjs' : ['codemirror'],
        'cmsql' : ['codemirror']
    }
});


require( [

	'tree',
	'sqlParser',
	'jquery',

	/* The following dont require variable representatives */
	'bootstrap',
	'codemirror',
	'cmjs',
	'knockout',
	'webdb'
],
function( tree , sqlParser , $ ){

	/* Table initialization stuff */
	$('#outputTab a[href="#home"]').tab('show');

	$('#outputTab a').click(function (e) {
		e.preventDefault();
		$(this).tab('show');
	});



	/* Knockout models */
	function Table( data ){

		var self = this;

		self.Title = data.title || 'Table';
		self.id = data.id || 'outputTable';
		self.headings = ko.observableArray( data.headings || [] );
		self.rows = ko.observableArray( data.rows || [] );

		self.idHash = ko.computed( function(){

			return '#' + this.id;
		} , this );
	}


	function OutputViewModel(){

		var self = this;

		self.tables = ko.observableArray([

			new Table( {
				title : 'Output',
				id : 'outputTable',
				rows : [{ name:'testname' , detail:'testdetail' }]
			} )
		]);

		self.addTable = function( table ){

			self.tables.push( table );
		};

		self.resetTables = function(){

			self.tables([]);
		};

	}

	var outputModel = new OutputViewModel();
	ko.applyBindings( outputModel );

	/* Custom code  */

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

		webdb.use( $( '#dbName' ).val() );
		refreshSideBar();
	} );

	$( '#dbRefresh' ).on( 'click' , refreshSideBar );


	$( '#file-open' ).on( 'click', function(){

		if (window.File && window.FileReader && window.FileList && window.Blob) { //supported?

			/* create input element and trigger file open */
			var inp = document.createElement( 'input' );
			inp.type = 'file';
			$( inp ).trigger( 'click' );

			$( inp ).on( 'change' , function( ev ){

				//var oEvent = ev.originalEvent;

				var files = ev.originalEvent.target.files;

				var file = files[0];

				var reader = new FileReader();

				reader.onload = function( e ){

					var content = e.target.result;

					console.log( content );

					editor.setValue( content );
				};

				reader.readAsText( file );

			} );

		} else {
			alert('The File APIs are not fully supported in this browser.');
		}
	} );


	$( '#run' ).on( 'click' , function(){

		$('#outputTab a[href="#home"]').tab('show');

		var codeText = editor.getValue(); /* Get the full code text */

		/* remove all the old stuff */
		$( '#outputTab' ).html( '<li><a href="#home">Output</a></li>' );
		$( '#outputTable' ).html( '' );
		$( '#outputTabContent' ).children( 'div:not(:first)' ).remove(); //removes all except first child


		var lines = sqlParser.getLines( codeText );

		webdb.open();

		/* 
			The following contains a quick hack to determine the difference between a
			query and an execution, this logic or something better should be 
			dropped to webdb.js itself 
		*/

		var err_handler = function( res ){

			var row = document.createElement( 'tr' );
			if ( res.hasOwnProperty( 'error' ) ){

				row.className = 'error';

				row.innerHTML += '<td>' + this.query + '</td> <td>'+ res.error.message +'</td>';

				$( '#outputTable' ).append( row );

				return;
			}else {


				console.log(  'yeah dawg' );

				row.className = 'success';

				row.innerHTML += '<td>' + this.query + '</td> <td>'+ 'Command Executed successfully' +'</td>';

				$( '#outputTable' ).append( row );

			}

		};


		var output = [];
		var count = 0;
		var transaction_handler = function( res ){

			var row = document.createElement( 'tr' );
			if ( res.hasOwnProperty( 'error' ) ){

				row.className = 'error';

				row.innerHTML += '<td>' + this.query + '</td> <td>'+ res.error.message +'</td>';

				$( '#outputTable' ).append( row );

				return;
			}else {

				console.log(  'yeah dawg' );

				row.className = 'success';

				row.innerHTML += '<td>' + this.query + '</td> <td>'+ 'Command Executed successfully' +'</td>';

				$( '#outputTable' ).append( row );

			}

			output.push( res );

			var oElement = $( '#output' );

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
