VSTOOLS.Logger = function( options ) {

	options = options || {};

	this.log = options.log || console.log.bind( console );
	this.filter = options.filter || function() { return false };
	this.filterMax = options.filterMax || 100;

	this.filtered = 0;

};

VSTOOLS.Logger.prototype.extend = function( obj ) {

	var self = this;

	obj.logger = this;
	obj.log = function() {

		if ( self.filter( obj ) ) {

			self.log.apply( undefined, arguments );

		} else {

			++self.filtered;

			if ( self.filtered >= self.filterMax ) {

				self.log( '... filtered ' + self.filtered + ' log messages' );
				self.filtered = 0;

			}

		}

	};

};
