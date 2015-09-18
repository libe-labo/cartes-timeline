/* jshint globalstrict: true, eqnull: true */
/* globals $, _, noUiSlider, Tsv, document, window, moment, d3 */

'use strict';

$(function() {
    $.get('assets/data.tsv', function(rawData) {
        var data = _.filter(d3.tsv.parse(rawData, function(d) {
            return {
                rawDate : d.Date,
                date : moment(d.Date, 'DD/MM/YYYY'),
                text : d.Texte
            };
        }), function(d) {
            return d.rawDate != null && d.text != null;// && d.rawDate !== '01/01/1993'; // TMP
        });

        data = _.chain(data).groupBy('rawDate').values().map(function(d) {
            return {
                rawDate : d[0].rawDate,
                date : d[0].date,
                texts : _.pluck(d, 'text')
            };
        }).value();

        var current = data[0];

        var minDate = _.min(_.pluck(data, 'date'), function(d) { return d.unix(); }),
            maxDate = _.max(_.pluck(data, 'date'), function(d) { return d.unix(); }),
            totalDays = maxDate.diff(minDate, 'days');

        var range = { },
            scale = d3.scale.linear().domain([minDate.unix(), maxDate.unix()]).range([0, 100]);
        _.each(data, function(d, i) {
            d.percent = _.round(scale(d.date.unix()), 2);

            // Slider
            var name = i === 0 ? 'min'
                               : ((i === data.length - 1) ? 'max' : (String(d.percent) + '%'));
            range[name] = d.percent;

            // Steps
            $('.steps').append($('<span>').addClass('steps__step')
                                          .css('left', String(d.percent) + '%'));
        });

        var slider = document.getElementById('slider');
        noUiSlider.create(slider, {
            start : 0,
            snap : true,
            range : range
        });
        slider.noUiSlider.on('update', function(values) {
            var currentIndex = _.findIndex(data, { percent : parseFloat(values[0]) });
            current = data[currentIndex];
            $('.text').html(current.texts.join('<br><br>'));
            $('.steps__step').removeClass('current');
            $($('.steps__step').get(currentIndex)).addClass('current');
        });

        /*
        ** Controls
        */
        var timer,
            playPause = function(play) {
                if (play) {
                    window.clearTimeout(timer);
                    timer = window.setInterval(function() {
                        $('.next').click();
                    }, 1000);
                    $('.playpause').find('i.fa').removeClass('fa-play').addClass('fa-pause');
                } else {
                    window.clearTimeout(timer);
                    timer = null;
                    $('.playpause').find('i.fa').removeClass('fa-pause').addClass('fa-play');
                }
            };

        $('.prev').click(function() {
            var currentIndex = _.findIndex(data, current);

            if (currentIndex > 0) {
                slider.noUiSlider.set(data[currentIndex - 1].percent);
            }
        });

        $('.next').click(function() {
            var currentIndex = _.findIndex(data, current);

            if (currentIndex < data.length - 1) {
                slider.noUiSlider.set(data[currentIndex + 1].percent);
            } else {
                playPause(false);
            }
        });

        $('.playpause').click(function() {
            playPause(timer == null);
        });
    });
});
