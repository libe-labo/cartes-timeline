/* jshint globalstrict: true, eqnull: true */
/* globals $, _, noUiSlider, Tsv, document, window, moment, d3 */

'use strict';

$(function() {
    $.get('assets/data.tsv', function(rawData) {
        var data = _.filter(d3.tsv.parse(rawData, function(d) {
            return {
                rawDate : d.Date,
                date : moment(d.Date, 'DD/MM/YYYY'),
                displayDate : d['Date affichée'],
                text : d.Texte,
                time : parseInt(d.time || 1000),
                pic : d.Image
            };
        }), function(d) {
            return d.rawDate != null && d.text != null;// && d.rawDate !== '01/01/1993'; // TMP
        });

        data = _.chain(data).groupBy('rawDate').values().map(function(d) {
            return {
                rawDate : d[0].rawDate,
                date : d[0].date,
                displayDate : d[0].displayDate,
                pic : d[0].pic,
                texts : _.pluck(d, 'text'),
                time : _.sum(d, 'time')
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

        var start = function() {
            noUiSlider.create(slider, {
                start : 0,
                snap : true,
                range : range
            });
            slider.noUiSlider.on('update', function(values) {
                var currentIndex = _.findIndex(data, { percent : parseFloat(values[0]) });
                current = data[currentIndex];

                $('.date').text(current.displayDate);
                var containerWidth = $('.date').parent().innerWidth(),
                    dateWidth = $('.date').outerWidth();
                $('.date').css('left', Math.max(
                    0,
                    Math.min(
                        containerWidth - dateWidth,
                        (containerWidth * (current.percent / 100)) - (dateWidth / 2)
                    )
                ));

                $('.text').html(current.texts.join('<br><br>'));

                $('.maps__top-layer').attr('src', 'assets/' + current.pic + '.svg')
                                     .css('width', String($('.container').innerWidth()) + 'px');

                $('.steps__step').removeClass('current');
                $($('.steps__step').get(currentIndex)).addClass('current');
            });

            $('#slider').parent().removeClass('hidden');

            $('.start').parent().addClass('hidden');
        };


        /*
        ** Controls
        */
        var timer,
            playPause = function(play) {
                if (play) {
                    window.clearTimeout(timer);
                    timer = window.setTimeout(function() {
                        $('.next').click();
                    }, current.time);
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
                playPause(timer != null);
            }
        });

        $('.next').click(function() {
            var currentIndex = _.findIndex(data, current);

            if (currentIndex < data.length - 1) {
                slider.noUiSlider.set(data[currentIndex + 1].percent);
                playPause(timer != null && currentIndex < data.length - 2);
            } else {
                playPause(false);
            }
        });

        $('.playpause').click(function() {
            playPause(timer == null);
        });

        $('.start').click(start);
    });
});
