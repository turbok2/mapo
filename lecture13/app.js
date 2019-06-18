//모듈 임포트
var express = require('express');
var app = express()
var mysql = require('mysql') //mysql 임포트
var bodyParser = require('body-parser');
var path = require('path');


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('./public')) //정적 파일 폴더 위치 설정
//게시판
var mainRouter = require('./router/main.js')
app.use(mainRouter)
//var PORT = process.env.PORT || 3000
//서버 가동
app.listen(3000, function(){
console.log("서버가동")
})
