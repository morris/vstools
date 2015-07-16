VSTOOLS.Logger = function ( options ) {

	options = options || {};

	this.log = options.log || console.log.bind( console );
	this.filter = options.filter || function () { return false; };

};

VSTOOLS.Logger.prototype.extend = function ( obj ) {

	var self = this;

	obj.logger = this;
	obj.log = function () {

		if ( self.filter( obj ) ) {

			self.log.apply( undefined, arguments );

		}

	};

};
