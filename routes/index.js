// routes/index.js
// app.js 서버의 라우터
// 서버에 만들 API 목록

module.exports = function(app, User, Image, upload)
{
    let fs = require("fs");
    let mime = require('mime');

    function findByFieldThen(field, target, res, callback) {
        User.find()
            .where(field)
            .equals(target)
            .exec()
            .then((result) => {
                callback(result);
            })
            .catch((err) => {
                return res.status(500).json({error: err});
            });
    }

    function findByField(field, target, res) {
        findByFieldThen(field, target, res, function(result) {
            // target과 일치하는 field를 가진 user가 없을 때
            if(!result) return res.status(404).json({error: 'the user does not exist'});
            res.json(result);
        } );
    }

    function findOneByFieldThen(field, target, res, callback) {
        User.findOne()
            .where(field)
            .equals(target)
            .exec()
            .then((result) => {
                callback(result);
            })
            .catch((err) => {
                return res.status(500).json({error: err});
            });
    }

    function findOneByField(field, target, res) {
        findOneByFieldThen(field, target, res, function(result) {
            // target과 일치하는 field를 가진 user가 없을 때
            if(!result) return res.status(404).json({error: 'the user does not exist'});
            res.json(result);
        } );
    }

    function updateOneUser(filter, doc, res) {
        User.updateOne(filter, doc)
            .exec()
            .then((result) => {
                if(!result) return res.status(404).json( { error : 'user not found'} );
                res.json({message: 'user updated'});
            })
            .catch((err) => {
                return res.status(500).json({ error: "database failure" });
            });
    }

    function findOneByFieldAndSelect(field, target, selection, res) {
        User.findOne()
            .where(field)
            .equals(target)
            .select(selection)
            .exec()
            .then((result) => {
                // target과 일치하는 field를 가진 user가 없을 때
                if(!result) return res.status(404).json({error: 'the user does not exist'});
                res.json(result);
            })
            .catch((err) => {
                return res.status(500).json({error: err});
            });
    }

    // --------------------[CRUD API (Non-file data)]--------------------
    // CREATE USER
    app.post('/api/users', function(req, res){

        var user = new User(req.body);

        user.save(function (err) {
            if(err) {
                console.error(err);
                res.json( { result: 0 } );
                return;
            }
            res.json( { result: 1 } );
        });

    });

    // GET ALL Users
    app.get('/api/users', function(req, res) {

        User.find(function(err, users) {
            if(err) return res.status(500).send({error: 'database failure'});
            res.json(users);
        });

    });

    // GET SINGLE User BY Email
    app.get('/api/users/:user_email', function(req, res) {

        findOneByField('email', req.params.user_email, res);

    });

    // GET (maybe) MULTIPLE Users BY NAME
    app.get('/api/users/by_name/:user_name', function(req, res) {

        findByField('name', req.params.user_name, res);

    });

    // GET SINGLE User BY PhoneNum
    app.get('/api/users/by_phone_num/:user_phoneNum', function(req, res) {

        findOneByField('phoneNum', req.params.user_phoneNum, res);

    });

    // GET SINGLE User BY Email (same with '/api/users/:user_email'
    app.get('/api/users/by_email/:user_email', function(req, res) {

        findOneByField('email', req.params.user_email, res);

    });

    // GET position of single user by email
    app.get('/api/users/position/:user_email', function(req, res) {

        findOneByFieldAndSelect('email', req.params.user_email, 'position', res);

    });

    // GET state of single user by email
    app.get('/api/users/state/:user_email', function(req, res) {

        findOneByFieldAndSelect('email', req.params.user_email, 'state', res);

    });

    // UPDATE THE USER
    app.put('/api/users/:user_email', function(req, res) {

        updateOneUser({ email: req.params.user_email }, { $set: req.body }, res);

    });

    // UPDATE THE USER - add friend by email
    app.put('/api/users/friend/:user_email/:friend_email', function(req, res) {

        const userEmail = req.params.user_email;
        const friendEmail = req.params.friend_email;

        // 자기 자신을 친구로 할 수 없음
        if(userEmail === friendEmail)
            return res.status(400).json({error: "user_email and friend_email should be distinct"}); // 400 Bad Request

        // user_email을 가진 user의 friendsList에 friend_email 추가
        updateOneUser({email: userEmail}, {$addToSet: {'friendsList': friendEmail}}, res);


        /* 원래 의도와는 다르게 작동하여 일단은 폐기

        // friend_email이 DB상에 존재하는지 확인
        User.findOne()
            .where('email')
            .equals(friendEmail)
            .exec()
            .then( (result) => {
                if(!result) {
                    // does not exist
                    return res.status(404).json({error: 'friend user not found'});
                }
                // user_email을 가진 user의 friendsList에 friend_email 추가
                return User.updateOne({email: userEmail}, {$addToSet: {'friendsList': friendEmail}}).exec();
            })
            .catch((err) => {
                return res.status(500).json({error: err});
            });
        */

    });

    // UPDATE THE USER - add to like list
    app.put('/api/users/likeList/:user_email', function(req, res) {

        const userEmail = req.params.user_email;
        const item = req.body.restaurant;

        // user_email을 가진 user의 friendsList에 friend_email 제거
        updateOneUser({email: userEmail}, {$addToSet: {'likeList': item}}, res);

    });

    // UPDATE THE USER - delete in like list
    app.put('/api/users/likeList/:user_email', function(req, res) {

        const userEmail = req.params.user_email;
        const item = req.body.restaurant;

        // user_email을 가진 user의 friendsList에 friend_email 제거
        updateOneUser({email: userEmail}, {$pull: {'likeList': item}}, res);

    });

    // DELETE SINGLE USER BY EMAIL
    app.delete('/api/users/:user_email', function(req, res){

        User.deleteOne()
            .where('email')
            .equals(req.params.user_email)
            .exec()
            .then((result) => {
                res.json({message: 'user removal request accepted'});
                res.status(204).end(); // 204 NO CONTENTS
            })
            .catch((err) => {
                return res.status(500).json({ error: "database failure" });
            });

    });

    // UPDATE THE USER - delete friend by email
    app.delete('/api/users/friend/:user_email/:friend_email', function(req, res) {

        const userEmail = req.params.user_email;
        const friendEmail = req.params.friend_email;

        // user_email을 가진 user의 friendsList에 friend_email 제거
        updateOneUser({email: userEmail}, {$pull: {'friendsList': friendEmail}}, res);

    });

    // --------------------[ABOUT FILES]--------------------
    // 업로드 요청 처리
    app.post('/api/files/upload', upload.single("imgFile"),function(req, res) {
        const title = req.body.title;
        const description = req.body.description;
        const fileObj = req.file; // multer 모듈 덕분에 사용 가능한 req의 field
        const orgFileName = fileObj.originalname; // 원본 파일명을 저장한다.
        const saveFileName = fileObj.filename; // 저장된 파일명
        const size = fileObj.size;

        // 추출한 데이터들을 Object로 묶는다
        const obj = {
            "title": title,
            "orgFileName": orgFileName,
            "saveFileName": saveFileName,
            "description": description,
            "size": size
        };

        // Image 객체에 담는다
        const newImage = new Image(obj);
        // DB에 저장한다
        newImage.save(function(err) {
            if(err) {
                res.send(err);
                return res.status(500).json({error: err});
            }

            res.end("File upload success");
        });

    });

    // DB 상의 파일 목록을 GET
    app.get('/api/files', function(req, res) {
        Image.find(function(err, images) {
            if(err) return res.status(500).send({error: 'database failure'});
            res.json(images);
        });
    });

    // 다운로드 요청 처리 (by saveFileName)
    app.get('/api/files/download/:saveFileName', function(req, res) {

        const saveFileName = req.params.saveFileName;
        const filePath = __dirname + "/../images/" + saveFileName; // 다운로드할 파일의 경로

        try {
            if (fs.existsSync(filePath)) { // 파일 존재 여부 체크
                const mimeType = mime.getType(filePath);

                res.setHeader('Content-disposition', 'attachment; filename=' + saveFileName); // 다운받아질 파일명 설정
                res.setHeader('Content-type', mimeType); // 파일 형식 지정

                const fileStream = fs.createReadStream(filePath)
                fileStream.pipe(res);
            }  else {
                res.status(404).send('해당 파일이 없습니다.');
            }
        } catch (e) {
            console.log(e);
            res.status(500).send('파일을 다운로드하는 중에 에러가 발생하였습니다.');
        }

    });

    // 이미지 파일 삭제하기
    app.delete('/api/files/:saveFileName', function(req, res) {
        const saveFileName = req.params.saveFileName;


        Image.deleteOne()
            .where('saveFileName')
            .equals(saveFileName)
            .exec()
            .then((result) => {
                res.json({message: 'user removal request accepted'});
                fs.unlink(__dirname + "/../images/" + saveFileName, function(err) {
                    if (err) {
                        res.status(500).json({ error: "file delete failure" });
                        throw err;
                    }
                });
                res.status(204).end(); // 204 NO CONTENTS
            })
            .catch((err) => {
                return res.status(500).json({ error: "database failure" });
            });

    });

}
