var req = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var jar = req.jar();
var request = req.defaults({jar: jar});
var favourites = [];

var username = 'TWOJ_NICK';
var password = 'TWOJE_HASLO';

var api = {
    getFavourites: 'http://strims.pl/u/' + username + '/lubiane?strona=',
    login: 'http://strims.pl/zaloguj',
    root: 'http://strims.pl'
};

function login(user, pass) {
    getToken(function(token) {
        request.post({
            url: api.login, 
            form: {name: username, password: password, token: token, '_external[remember]': 1}
        }, function(err, resp, body){
            var cookies = jar.getCookies(api.login);
            console.log("zalogowany...");
            //brak kontroli bledow
            //skrypt zaklada, ze logowanie sie powiodlo i tego nie sprawdza
            getFavourites();
        });
    });
}

function getToken(cb) {
    request(api.root, function(err, resp, body) {
        if (err) return console.error(err);
        var $ = cheerio.load(body);
        var token = $('#login_menu_inner input[name="token"]').val();
        console.log("Token:", token);
        cb(token);
    });
}

function getFavourites(page) {
    page = page || 1;
    request.get(api.getFavourites + page, function(err, resp, body){
        if (err) return console.log(err);
        var $ = cheerio.load(body);
        $('#contents_users_page ul.contents_list > li').each(function(i, elem) {
            var item = $(elem).find('.content_inner h2');
            var link = $(item).find('a.content_title');
            var strim = $(item).find('.content_strim_flair').attr('href');
            var title = link.text();
            var href = link.attr('href');
            var localUrl = $(elem).find('.content_info_actions li').eq(0).find('a').attr('href');
            console.log("%s: %s [%s]", ((page - 1) * 40 + i + 1), title, strim);
            //console.log("   " + href);
            //console.log("   " + localUrl);

            favourites.push({
                title: title,
                strim: strim,
                localUrl: api.root + localUrl,
                url: href
            });
        });
        if ($('a.pagination_next').length !== 0) {
            getFavourites(page + 1);
        } else {
            console.log('juz prawie...');
            fs.writeFileSync("ulubione.json", JSON.stringify(favourites));
            console.log('Zrobione, zpisane!!!');
        }
    });
}

login();