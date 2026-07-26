(function (global) {
  var JOURS_SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  var MOIS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function dateToKey(year, month, day) {
    return year + '-' + pad(month + 1) + '-' + pad(day);
  }

  function creerCalendrier(config) {
    var container = config.container;
    var year = config.year;
    var month = config.month;
    var eventsParJour = config.eventsParJour || {};

    var today = new Date();
    var todayKey = dateToKey(today.getFullYear(), today.getMonth(), today.getDate());

    var premierJourMois = new Date(year, month, 1);
    var nbJours = new Date(year, month + 1, 0).getDate();
    var indexPremierJour = (premierJourMois.getDay() + 6) % 7; // 0 = lundi

    var html = '<div class="calendrier-entete">';
    html += '<button type="button" class="calendrier-nav" data-nav="prev" aria-label="Mois précédent">&larr;</button>';
    html += '<h3>' + MOIS[month] + ' ' + year + '</h3>';
    html += '<button type="button" class="calendrier-nav" data-nav="next" aria-label="Mois suivant">&rarr;</button>';
    html += '</div>';

    html += '<div class="calendrier-grille calendrier-jours-semaine">';
    JOURS_SEMAINE.forEach(function (j) {
      html += '<div class="calendrier-jour-semaine">' + j + '</div>';
    });
    html += '</div>';

    html += '<div class="calendrier-grille">';
    for (var i = 0; i < indexPremierJour; i++) {
      html += '<div class="calendrier-case calendrier-case-vide"></div>';
    }
    for (var jour = 1; jour <= nbJours; jour++) {
      var key = dateToKey(year, month, jour);
      var evenements = eventsParJour[key] || [];
      var classes = 'calendrier-case';
      if (key === todayKey) classes += ' aujourdhui';
      if (config.dateSelectionnee === key) classes += ' selectionne';

      if (evenements.length) {
        var ouvert = evenements.some(function (e) { return !e.complet; });
        classes += ' avec-cours ' + (ouvert ? 'cours-ouvert' : 'cours-complet');
      }

      html += '<button type="button" class="' + classes + '" data-date="' + key + '">';
      html += '<span class="calendrier-numero">' + jour + '</span>';
      if (evenements.length) {
        html += '<span class="calendrier-pastille"></span>';
      }
      html += '</button>';
    }
    html += '</div>';

    container.innerHTML = html;

    container.querySelectorAll('[data-nav]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.getAttribute('data-nav') === 'prev') {
          config.onPrev();
        } else {
          config.onNext();
        }
      });
    });

    container.querySelectorAll('.calendrier-case[data-date]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        config.onDayClick(btn.getAttribute('data-date'));
      });
    });
  }

  global.CalendrierPorcelaine = { creer: creerCalendrier, dateToKey: dateToKey };
})(window);
