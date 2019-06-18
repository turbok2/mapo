var mysql = require('mysql');

module.exports = mysql.createPool( {
    // host     : 'mydbinstance1.c55tgacrmryx.ap-northeast-2.rds.amazonaws.com',
    host     : 'mapolist2.cigw3pflis4f.us-east-2.rds.amazonaws.com',
    user     : 'root',
    // password : 'zkqhs1004',
    password : '12345678',
    port     : 3306,
    // database : 'mytest'
    database : 'mydata'
});