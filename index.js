const GifMaker = require('./gif_maker')

var express = require('express');
var app = express();

app.get('/', function(req, res) {
    const date = req.query.date
    GifMaker.init(date || '2019-10-18',900, 300, 'ffffff', '000000', new Date().getTime().toString(), 60,(a)=>{
        res.sendFile(a)
    })
});

app.listen(4000)