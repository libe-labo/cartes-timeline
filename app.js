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
            midDate = moment('01/05/2015', 'DD/MM/YYYY'),
            maxDate = _.max(_.pluck(data, 'date'), function(d) { return d.unix(); }),
            totalDays = maxDate.diff(minDate, 'days');

        var range = { },
            scale1 = d3.scale.linear().domain([minDate.unix(), maxDate.unix()]).range([0, 10]),
            scale2 = d3.scale.linear().domain([midDate.unix(), maxDate.unix()]).range([10, 100]);
        _.each(data, function(d, i) {
            if (d.date.isBefore(midDate)) {
                d.percent = _.round(scale1(d.date.unix()), 2);
            } else {
                d.percent = _.round(scale2(d.date.unix()), 2);
            }

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
            current = _.find(data, { percent : parseFloat(values[0]) });
            $('.text').html(current.texts.join('<br><br>'));
        });

        /*
        ** Controls
        */
        var timer;

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
                window.clearTimeout(timer);
            }
        });

        $('.playpause').click(function() {
            if (timer != null) {
                window.clearTimeout(timer);
                timer = null;
                $(this).text('|>');
            } else {
                timer = window.setInterval(function() {
                    $('.next').click();
                }, 1000);
                $(this).text('||');
            }
        });
    });
});
