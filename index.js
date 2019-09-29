const GifMaker = require('./gif_maker')

var express = require('express');
var app = express();

// respond with "hello world" when a GET request is made to the homepage
app.get('/', function(req, res) {
    const date = req.query.date
    GifMaker.init(date || '2019-10-18',900, 300, 'ffffff', '000000', 'default', 30,(a)=>{
        res.sendFile(a)
    })
});

app.listen(4000)