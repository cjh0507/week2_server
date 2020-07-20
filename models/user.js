// User.js
// User의 schema 정의

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name : {
    type : String,
    required: [true, '이름이 누락되었습니다'],
    maxlength: 50
  },
  phoneNum : {
    type : String,
    match:[/^\d{3}-\d{3,4}-\d{4}$/, '전화번호 양식이 맞지 않습니다 ex) 010-1234-5678, 061-123-4567'],
    unique: [true,'이미 DB상에 존재하는 전화번호입니다.' ],
    sparse: true // phoneNum 필드가 존재하지 않을 때는 unique하지 않아도 되게 하기 위함
  },
  email : {
    type : String, required: [true, '이메일이 누락되었습니다'],
    unique: [true, '이미 DB상에 존재하는 이메일입니다.'],
    sparse: true,
    lowercase: true, trim: true, maxlength: [50, '이메일 글자 수 제한 초과.'],
    match: [/^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i, '이메일 양식이 맞지 않습니다'],
    immutable: true
  },
  password: {
    type : String,
    required: [true, '비밀번호가 누락되었습니다'],
    trim: true, maxlength: 15,
    match: [/^.*(?=^.{8,15}$)(?=.*\d)(?=.*[a-zA-Z])(?=.*[!@#$%^&+=]).*$/, '비밀번호 양식이 맞지 않습니다']
  }, // 특수문자 / 문자(알파벳) / 숫자 포함 형태의 8~15자리 이내의 암호 정규식
  position : {
    type: [Number],
    default: [36.372333, 127.360411],
    validate: [positionLimit, '{PATH} does not satisfies the position form, which is [x:Number btwn -90 ~ 90, y:Number btwn -180 ~ 180]']
  }, // default는 kaist 위치
  state : {
    type: String,
    default : "want to find friends",
    maxlength : 50
  }, // state는 몇 가지 약속을 정해놓을 필요가 있을듯
  likeList : {
    type: [{ type: String, maxlength: 100 }],
    default:[],
    validate: [arrayLimit, '{PATH} exceeds the limit of 1000']
  },
  friendsList : { // 친구들의 이메일 list
    type: [{
      type: String,
      lowercase: true,
      trim: true,
      maxlength: 50,
      match:  [/^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i, '이메일 양식이 맞지 않습니다']
    }],
    default: [],
    validate: [arrayLimit, '{PATH} exceeds the limit of 1000']
  },
});

function positionLimit(arr) {

  if (arr.length !== 2) {
    return false;
  }

  const x = arr[0]; // latitude
  const y = arr[1]; // longitude

  if ( !(-90 <= x && x <= 90)) {
    return false;
  }

  if ( !(-180 <= y && y <= 180)) {
    return false;
  }

  return true;
}

function arrayLimit(arr) {
  return arr.length < 1000;
}

userSchema.index( {email : 1, name : 1} ); // email과 name은 빨리 검색할 수 있도록 mongoDB index를 생성함.

userSchema.methods.comparePassword = function(pw, callback) {
  if ((this.password !== pw)) {
    callback('password 불일치');
  } else {
    callback(null, true);
  }
};

// 새로운 데이터를 Create 하고 저장할 때 required한 요소가 전부 있는지 체크
userSchema.pre('save', function(next) {
  if(!this.email) {
    throw 'save() - 이메일이 누락되었습니다';
  }
  if(!this.name) {
    throw 'save() - 이름이 누락되었습니다';
  }
  if(!this.password) {
    throw 'save() - 비밀번호가 누락되었습니다';
  }
  next();
});

userSchema.set('toJson');

module.exports = mongoose.model('user', userSchema);