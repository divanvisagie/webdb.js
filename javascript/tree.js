define( 'tree' , ['jquery'] , function( $ ){


    function tree(data) {

        var ostring = '<ul>\n';
        if (typeof(data) == 'object') {

            for ( var x in data ){

                ostring += '<li> <a href="#">'+ x +'</a>' +  tree(data[x])+ ' </li>\n';
            }
            ostring += '</ul>';

            return ostring;

        }
        else {

            ostring += '<li> <a href="#">'+ data +'</a>'+ ' </li>\n';
            ostring += '</ul>';
            return ostring;
        }
    }


    return {

        loadDbTree : function( name , dbObject ){

            var obj = {};
            obj[name] = dbObject;


            var t =  tree( obj );

            $( '#tree' ).html( t );

            $(function () {

                $( '.tree li' ).hide();
                $( '.tree li:first' ).show();
                $( '.tree li' ).on('click', function (e) {
                    var children = $(this).find('> ul > li');
                    if (children.is( ':visible' )){
                        children.hide( 'fast' );
                    }
                    else {
                        children.show( 'fast' );
                    }
                    e.stopPropagation();
                });
            });
        }
    };

} );
