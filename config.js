var config = {
	// Elastic Search host
  host: 'http://46.101.188.112:9200',
  // Archivist host
  archive: 'http://ost.d4s.io'
};

console.log();
console.log('#####################################');
console.log('Elastic Search Host:');
console.log(config.host);
console.log('#####################################');
console.log('Archivist Host:');
console.log(config.archive);
console.log('#####################################');
console.log();

module.exports = config;