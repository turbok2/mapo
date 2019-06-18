var express = require("express");
var router = express.Router();
var mysql = require("mysql");
var fs = require("fs");
var ejs = require("ejs");
var bodyParser = require("body-parser");
var dbconfig = require('../config/database')
const crypto = require('crypto');

router.use(bodyParser.urlencoded({ extended: false }));

//게시판 페이징

router.get("/list/:cur", function(req, res) {
  //페이지당 게시물 수 : 한 페이지 당 10개 게시물
  var page_size = 10;
  //페이지의 갯수 : 1 ~ 10개 페이지
  var page_list_size = 10;
  //limit 변수
  var no = "";
  //전체 게시물의 숫자
  var totalPageCount = 0;

  var queryString = "select count(*) as cnt from post";
  getConnection().query(queryString, function(error2, data) {
    if (error2) {
      console.log(error2 + "메인 화면 mysql 조회 실패");
      return;
    }
    //전체 게시물의 숫자
    totalPageCount = data[0].cnt;
   
    //현제 페이지
    var curPage = req.params.cur;

    console.log("현재 페이지 : " + curPage, "전체 페이지 : " + totalPageCount);

    //전체 페이지 갯수
    if (totalPageCount < 0) {
      totalPageCount = 0;
    }

    var totalPage = Math.ceil(totalPageCount / page_size); // 전체 페이지수
    var totalSet = Math.ceil(totalPage / page_list_size); //전체 세트수
    var curSet = Math.ceil(curPage / page_list_size); // 현재 셋트 번호
    var startPage = (curSet - 1) * 10 + 1; //현재 세트내 출력될 시작 페이지
    var endPage = startPage + page_list_size - 1; //현재 세트내 출력될 마지막 페이지

    //현재페이지가 0 보다 작으면
    if (curPage < 0) {
      no = 0;
    } else {
      //0보다 크면 limit 함수에 들어갈 첫번째 인자 값 구하기
      no = (curPage - 1) * 10;
    }

    console.log(
      "[0] curPage : " +
        curPage +
        " | [1] page_list_size : " +
        page_list_size +
        " | [2] page_size : " +
        page_size +
        " | [3] totalPage : " +
        totalPage +
        " | [4] totalSet : " +
        totalSet +
        " | [5] curSet : " +
        curSet +
        " | [6] startPage : " +
        startPage +
        " | [7] endPage : " +
        endPage
    );

    var result2 = {
      curPage: curPage,
      page_list_size: page_list_size,
      page_size: page_size,
      totalPage: totalPage,
      totalSet: totalSet,
      curSet: curSet,
      startPage: startPage,
      endPage: endPage
    };

    fs.readFile("views/list.html", "utf-8", function(error, data) {
      if (error) {
        console.log("ejs오류" + error);
        return;
      }

      var queryString = "select * from post order by id desc limit ?, ?";
      getConnection().query(queryString, [no, page_size], function(
        error,
        result
      ) {
        if (error) {
          console.log(error);
          return;
        }
        console.log(result);
        res.send(
          ejs.render(data, {
            data: result,
            list: result2
          })
        );
      });
    });
  });
});

//메인화면
router.get("/", function(req, res) {
  console.log("메인화면");
  //main 으로 들어오면 바로 페이징 처리
  res.redirect("/list/" + 1);
});

//로그인화면
router.get("/login", function(req, res) {
  console.log("로그인화면")
  fs.readFile("views/login.html", "utf-8", function(error, data) {
    res.send(data)
  })
})
//포스트 데이터
router.post("/login", function(req, res) {
  console.log("포스트 데이터-로그인");
  var body = req.body;
  fs.readFile("views/login.html", "utf-8", function(error, data) {
    getConnection().query(
      "select * from userinfo where userid = ?",
      [body.userid],
      function(error, result) {
        console.log(result[0])
        console.log(result[0].passwd)
        let dbPassword = result[0].passwd;
        let inputPassword = body.passwd;
        let salt = result[0].salt;
        let hashPassword = crypto.createHash("sha512").update(inputPassword + salt).digest("hex");
        console.log(hashPassword)
        if (hashPassword!==dbPassword) {
          res.send(500,'비밀번호가 일치하지 않습니다.') 
        } else {
          res.redirect("/list/" + 1);
        }
      }
    );
  });
});
//가입화면
router.get("/register", function(req, res) {
  console.log("가입화면")
  fs.readFile("views/register.html", "utf-8", function(error, data) {
    res.send(data)
  })
})
//포스트 데이터
router.post("/register", function(req, res) {
  console.log("포스트 데이터-가입");
  var body = req.body;
  if (body.passwd!==body.passwd2) {
    console.log("비밀번호가 일치하지 않습니다.")
    // window.alert("비밀번호가 일치하지 않습니다.")
    res.send(500,'비밀번호가 일치하지 않습니다.') 
    //res.redirect("/register")
  } else {
    let inputPassword = body.passwd;
    let salt = Math.round((new Date().valueOf() * Math.random())) + "";
    let hashPassword = crypto.createHash("sha512").update(inputPassword + salt).digest("hex");

    getConnection().query(
      "insert into userinfo(username,userid,passwd,salt) values (?,?,?,?)",
      [body.username, body.userid, hashPassword, salt],
      function(err) {
        if (err) {
          res.send(500,'아이디가 중복되었습니다.') 
        } else
        //응답
        res.redirect("/login")
      }
    )
  }

})
//삭제
router.get("/delete/:id", function(req, res) {
  console.log("삭제 진행");

  getConnection().query(
    "delete from post where id = ?",
    [req.params.id],
    function() {
      res.redirect("/list/1");
    }
  );
});
//글쓰기 페이지
router.get("/insert", function(req, res) {
  console.log("insert page");

  fs.readFile("views/insert.html", "utf-8", function(error, data) {
    res.send(data);
  });
});
//포스트 데이터
router.post("/insert", function(req, res) {
  console.log("포스트 데이터");
  var body = req.body;
  getConnection().query(
    "insert into post(title,contents) values (?,?)",
    [body.title, body.contents],
    function() {
      //응답
      res.redirect("/list/1");
    }
  );
});
//수정 페이지
router.get("/edit/:id", function(req, res) {
  console.log("get 수정 페이지");

  fs.readFile("views/edit.html", "utf-8", function(error, data) {
    getConnection().query(
      "select * from post where id = ?",
      [req.params.id],
      function(error, result) {
        res.send(
          ejs.render(data, {
            data: result[0]
          })
        );
      }
    );
  });
});
//수정 포스터 데이터
router.post("/edit/:id", function(req, res) {
  console.log("수정");
  var body = req.body;
  getConnection().query(
    "update post set title = ?, contents = ? where id = ?",
    [body.title, body.contents, req.params.id],
    function() {
      res.redirect("/list/1");
    }
  );
});

//글상세보기
router.get("/detail/:id", function(req, res) {
  console.log("글읽기");

  fs.readFile("views/detail.html", "utf-8", function(error, data) {
    getConnection().query(
      "select * from post where id = ?",
      [req.params.id],
      function(error, result) {
        res.send(
          ejs.render(data, {
            data: result[0]
          })
        );
      }
    );
  });
});

var getConnection =  ()=> {
  return dbconfig
}

module.exports = router
                


