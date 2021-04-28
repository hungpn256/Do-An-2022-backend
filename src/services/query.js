const stopwords = require('vietnamese-stopwords');

module.exports.queryVar = function(str) {
    let q = str.replace( /\r\n/g, '').replace(/^\s+|\s+$/, '').replace(/[^a-z\s]+/gi, '').replace(/\s+$/, '');

    let parts = q.split(/\s/);
    let terms = [];
    parts.forEach(part => {
        if(stopwords.indexOf(part) === -1) {
            terms.push(part);
        }
    });
    let query = {'$and': []};
    terms.forEach(term => {
       let queryFrag = {fullName: {'$regex': term, '$options': 'i'}};
       query['$and'].push(queryFrag);
    });
    return query;
};