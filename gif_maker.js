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
        this.width = this.clamp(width, 150, 900) /2;
        this.height = this.clamp(height, 150, 500) /2;
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

    clamp: function(number, min, max){
        return Math.max(min, Math.min(number, max));
    },

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

    encode: function(timeResult, cb){
        let enc = this.encoder;
        let ctx = this.ctx;
        let tmpDir = '/tmp/'

        if (!fs.existsSync(tmpDir)){
            fs.mkdirSync(tmpDir);
        }
        
        let filePath = tmpDir + this.name + '.gif';

        let imageStream = enc
                .createReadStream()
                    .pipe(fs.createWriteStream(filePath));

        imageStream.on('finish', () => {
            typeof cb === 'function' && cb(filePath);
        });

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        enc.start();
        enc.setRepeat(0);
        enc.setDelay(1000);
        enc.setQuality(10);

        if(typeof timeResult === 'object'){
            for(let i = 0; i < this.frames; i++){
                let days = Math.floor(timeResult.asDays());
                let hours = Math.floor(timeResult.asHours() - (days * 24));
                let minutes = Math.floor(timeResult.asMinutes()) - (days * 24 * 60) - (hours * 60);
                let seconds = Math.floor(timeResult.asSeconds()) - (days * 24 * 60 * 60) - (hours * 60 * 60) - (minutes * 60);
                
                days = (days.toString().length == 1) ? '0' + days : days;
                hours = (hours.toString().length == 1) ? '0' + hours : hours;
                minutes = (minutes.toString().length == 1) ? '0' + minutes : minutes;
                seconds = (seconds.toString().length == 1) ? '0' + seconds : seconds;
                
                let string = [days, '일 ', hours, '시간 ', minutes, '분 ', seconds, '초'].join('');
                
                ctx.fillStyle = '#221900';
                ctx.fillRect(0, 0, this.width, this.height);

                const numberFont = 'normal normal bold 30px arial'
                const timeFont = 'normal normal bold 20px arial'
                const titleFont = 'normal normal bold 18px arial'
                const buttonFont = 'normal normal bold 20px arial'
                // 일 숫자
                ctx.font = numberFont
                ctx.fillStyle = this.textColor;
                ctx.fillText(days.toString(), 176/2, 130/2)
                // 시간 숫자
                ctx.font = numberFont
                ctx.fillStyle = this.textColor;
                ctx.fillText(hours.toString(), 328/2, 130/2)
                // 분 숫자
                ctx.font = numberFont
                ctx.fillStyle = this.textColor;
                ctx.fillText(minutes.toString(), 518/2, 130/2)
                // 초 숫자
                ctx.font = numberFont
                ctx.fillStyle = this.textColor;
                ctx.fillText(seconds.toString(), 671/2, 130/2)

                // 일 한글
                ctx.font = timeFont
                ctx.fillStyle = this.textColor;
                ctx.fillText('일', 230/2, 135/2)
                // 시간 한글
                ctx.font = timeFont
                ctx.fillStyle = this.textColor;
                ctx.fillText('시간', 397/2, 135/2)
                // 분 한글
                ctx.font = timeFont
                ctx.fillStyle = this.textColor;
                ctx.fillText('분', 578/2, 135/2)
                // 초 한글
                ctx.font = timeFont
                ctx.fillStyle = this.textColor;
                ctx.fillText('초', 731/2, 135/2)

                // 제목
                ctx.font = titleFont
                ctx.fillStyle = this.textColor;
                ctx.fillText('프로모션 종료까지', 450/2, 60/2)

                // 늦기전에 사러가기 버튼
                ctx.fillStyle = '#FF007B';
                roundRect(ctx, 135, 90, 180, 40, 10/2, true);

                // 늦기전에 사러가기
                ctx.font = buttonFont
                ctx.fillStyle = this.textColor;
                ctx.fillText('늦기전에 사러가기', 450/2, 110)

                // 왼쪽 빨강이
                ctx.fillStyle = '#FF007B';
                ctx.beginPath();
                ctx.moveTo(0,0)
                ctx.lineTo(0,300/2)
                ctx.lineTo(33/2, 300/2)
                ctx.lineTo(98/2,0)
                ctx.fill();

                // 오른쪽 빨강이
                ctx.fillStyle = '#FF007B';
                ctx.beginPath();
                ctx.moveTo(900/2,0)
                ctx.lineTo(900/2,300/2)
                ctx.lineTo(802/2, 300/2)
                ctx.lineTo(867/2,0)
                ctx.fill();

                enc.addFrame(ctx);
                timeResult.subtract(1, 'seconds');
            }
        } else {

            ctx.fillStyle = '#221900';
            ctx.fillRect(0, 0, this.width, this.height);

            const titleFont = 'normal normal bold 26px arial'

            // 제목
            ctx.font = titleFont
            ctx.fillStyle = this.textColor;
            ctx.fillText('종료된 프로모션입니다.', 450/2, 75)

            // 왼쪽 빨강이
            ctx.fillStyle = '#FF007B';
            ctx.beginPath();
            ctx.moveTo(0,0)
            ctx.lineTo(0,300/2)
            ctx.lineTo(33/2, 300/2)
            ctx.lineTo(98/2,0)
            ctx.fill();

            // 오른쪽 빨강이
            ctx.fillStyle = '#FF007B';
            ctx.beginPath();
            ctx.moveTo(900/2,0)
            ctx.lineTo(900/2,300/2)
            ctx.lineTo(802/2, 300/2)
            ctx.lineTo(867/2,0)
            ctx.fill();

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