// routes/index.js
// 서버에 만들 API 목록

module.exports = function(app, User)
{

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

    function userExists(target, res) {

        findOneByFieldThen('email', target, res, function(result) {
            // callback 함수에서 returnV의 값을 설정

            if (result) {
                // exists
                BOOL = true;
            } else {
                // doesn't exist
                BOOL = false;
            }
        });

    }

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

}
