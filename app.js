// app.js
// user 데이터를 조회·수정·삭제 하는 간단한 RESTful 웹서버

// [LOAD PACKAGE]
var express = require('express'); // express 넷 프레임워크 불러오기
var app = express(); // 변수 app에 프레임워크 할당
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

// [CONFIGURE APP TO USE bodyParser]
app.use(bodyParser.urlencoded( { extended: true } ));
app.use(bodyParser.json());

// [CONFIGURE SERVER PORT]
var port = process.env.PORT || 8080; // process.env.PORT가 0이면 8080

// [CONFIGURE mongoose]

// CONNECT TO MONGODB server
var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function() {
  // CONNECTED TO MONGODB SERVER
  console.log("Connected to mongodb server");
});

mongoose.connect('mongodb://localhost/mongodb_tutorial');

// DEFINE MODEL
var User = require('./models/user');

// [CONFIGURE ROUTER]
var router = require('./routes')(app, User);

// [RUN SERVER]
var server = app.listen(port, function() {
  console.log("Express server has started on port " + port);
});
