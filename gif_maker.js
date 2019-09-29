'use strict';

const fs = require('fs');
const path = require('path');
const GIFEncoder = require('gifencoder');
const { createCanvas, loadImage } = require('canvas')
const moment = require('moment');

module.exports = {
    /**
     * Initialise the GIF generation
     * @param {string} time
     * @param {number} width
     * @param {number} height
     * @param {string} color
     * @param {string} bg
     * @param {string} name
     * @param {number} frames
     * @param {requestCallback} cb - The callback that is run once complete.
     */
    init: function(time, width=200, height=200, color='ffffff', bg='000000', name='default', frames=30, cb){
        // Set some sensible upper / lower bounds
        this.width = this.clamp(width, 150, 900);
        this.height = this.clamp(height, 150, 500);
        this.frames = this.clamp(frames, 1, 90);

        this.bg = '#' + bg;
        this.textColor = '#' + color;
        this.name = name;
        
        // loop optimisations
        this.halfWidth = Number(this.width / 2);
        this.halfHeight = Number(this.height / 2);
        
        this.encoder = new GIFEncoder(this.width, this.height);
        this.canvas = createCanvas(this.width, this.height);
        this.ctx = this.canvas.getContext('2d');
        
        // calculate the time difference (if any)
        let timeResult = this.time(time);
        // start the gif encoder
        this.encode(timeResult, cb);
    },
    /**
     * Limit a value between a min / max
     * @link http://stackoverflow.com/questions/11409895/whats-the-most-elegant-way-to-cap-a-number-to-a-segment
     * @param number - input number
     * @param min - minimum value number can have
     * @param max - maximum value number can have
     * @returns {number}
     */
    clamp: function(number, min, max){
        return Math.max(min, Math.min(number, max));
    },
    /**
     * Calculate the diffeence between timeString and current time
     * @param {string} timeString
     * @returns {string|Object} - return either the date passed string, or a valid moment duration object
     */
    time: function (timeString) {
        // grab the current and target time
        let target = moment(timeString);
        let current = moment();
        
        // difference between the 2 (in ms)
        let difference = target.diff(current);
        
        // either the date has passed, or we have a difference
        if(difference <= 0){
            return 'Date has passed!';
        } else {
            // duration of the difference
            return moment.duration(difference);
        }
    },
    /**
     * Encode the GIF with the information provided by the time function
     * @param {string|Object} timeResult - either the date passed string, or a valid moment duration object
     * @param {requestCallback} cb - the callback to be run once complete
     */
    encode: function(timeResult, cb){
        let enc = this.encoder;
        let ctx = this.ctx;
        let tmpDir = '/tmp/';

        // create the tmp directory if it doesn't exist
        if (!fs.existsSync(tmpDir)){
            fs.mkdirSync(tmpDir);
        }
        
        let filePath = tmpDir + this.name + '.gif';
        
        // pipe the image to the filesystem to be written
        let imageStream = enc
                .createReadStream()
                    .pipe(fs.createWriteStream(filePath));
        // once finised, generate or serve
        imageStream.on('finish', () => {
            // only execute callback if it is a function
            typeof cb === 'function' && cb(filePath);
        });
        
        // estimate the font size based on the provided width
        let fontSize = Math.floor(this.width / 12) + 'px';
        let fontFamily = 'Courier New'; // monospace works slightly better
        
        // set the font style
        ctx.font = [fontSize, fontFamily].join(' ');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // start encoding gif with following settings
        enc.start();
        enc.setRepeat(0);
        enc.setDelay(1000);
        enc.setQuality(10);

        // if we have a moment duration object
        if(typeof timeResult === 'object'){
            for(let i = 0; i < this.frames; i++){
                // extract the information we need from the duration
                let days = Math.floor(timeResult.asDays());
                let hours = Math.floor(timeResult.asHours() - (days * 24));
                let minutes = Math.floor(timeResult.asMinutes()) - (days * 24 * 60) - (hours * 60);
                let seconds = Math.floor(timeResult.asSeconds()) - (days * 24 * 60 * 60) - (hours * 60 * 60) - (minutes * 60);
                
                // make sure we have at least 2 characters in the string
                days = (days.toString().length == 1) ? '0' + days : days;
                hours = (hours.toString().length == 1) ? '0' + hours : hours;
                minutes = (minutes.toString().length == 1) ? '0' + minutes : minutes;
                seconds = (seconds.toString().length == 1) ? '0' + seconds : seconds;
                
                // build the date string
                let string = [days, '일 ', hours, '시간 ', minutes, '분 ', seconds, '초'].join('');
                
                // paint BG
                ctx.fillStyle = '#221900';
                ctx.fillRect(0, 0, this.width, this.height);

                const numberFont = 'normal normal bold 60px arial'
                const timeFont = 'normal normal bold 40px arial'
                const titleFont = 'normal normal bold 24px arial'
                const buttonFont = 'normal normal bold 24px arial'
                // 일 숫자
                ctx.font = numberFont
                ctx.fillStyle = this.textColor;
                ctx.fillText(days.toString(), 176, 140)
                // 시간 숫자
                ctx.font = numberFont
                ctx.fillStyle = this.textColor;
                ctx.fillText(hours.toString(), 328, 140)
                // 분 숫자
                ctx.font = numberFont
                ctx.fillStyle = this.textColor;
                ctx.fillText(minutes.toString(), 518, 140)
                // 초 숫자
                ctx.font = numberFont
                ctx.fillStyle = this.textColor;
                ctx.fillText(seconds.toString(), 671, 140)

                // 일 한글
                ctx.font = timeFont
                ctx.fillStyle = this.textColor;
                ctx.fillText('일', 230, 145)
                // 시간 한글
                ctx.font = timeFont
                ctx.fillStyle = this.textColor;
                ctx.fillText('시간', 397, 145)
                // 분 한글
                ctx.font = timeFont
                ctx.fillStyle = this.textColor;
                ctx.fillText('분', 578, 145)
                // 초 한글
                ctx.font = timeFont
                ctx.fillStyle = this.textColor;
                ctx.fillText('초', 731, 145)

                // 제목
                ctx.font = titleFont
                ctx.fillStyle = this.textColor;
                ctx.fillText('프로모션 종료까지', 450, 73)

                // 늦기전에 사러가기 버튼
                ctx.fillStyle = '#FF007B';
                roundRect(ctx, 325, 196, 250, 60, 10, true);

                // 늦기전에 사러가기
                ctx.font = buttonFont
                ctx.fillStyle = this.textColor;
                ctx.fillText('늦기전에 사러가기', 450, 226)

                // 왼쪽 빨강이
                ctx.fillStyle = '#FF007B';
                ctx.beginPath();
                ctx.moveTo(0,0)
                ctx.lineTo(0,300)
                ctx.lineTo(33, 300)
                ctx.lineTo(98,0)
                ctx.fill();

                // 오른쪽 빨강이
                ctx.fillStyle = '#FF007B';
                ctx.beginPath();
                ctx.moveTo(900,0)
                ctx.lineTo(900,300)
                ctx.lineTo(802, 300)
                ctx.lineTo(867,0)
                ctx.fill();

                // add finalised frame to the gif
                enc.addFrame(ctx);
                
                // remove a second for the next loop
                timeResult.subtract(1, 'seconds');
            }
        } else {
            // Date has passed so only using a string
            
            // BG
            ctx.fillStyle = this.bg;
            ctx.fillRect(0, 0, this.width, this.height);
            
            // Text
            ctx.fillStyle = this.textColor;
            ctx.fillText(timeResult, this.halfWidth, this.halfHeight);
            enc.addFrame(ctx);
        }
        
        // finish the gif
        enc.finish();
    }
};

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === 'undefined') {
        stroke = true;
    }
    if (typeof radius === 'undefined') {
        radius = 5;
    }
    if (typeof radius === 'number') {
        radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
        var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
        for (var side in defaultRadius) {
            radius[side] = radius[side] || defaultRadius[side];
        }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
        ctx.fill();
    }
    if (stroke) {
        ctx.stroke();
    }

}