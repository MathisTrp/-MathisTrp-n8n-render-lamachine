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

  // Construit, pour un calendrier, une map date -> liste d'événements qui
  // touchent cette date (utile pour que les événements sur plusieurs jours
  // apparaissent sur chacun de leurs jours, pas seulement le premier).
  function etalerEvenements(courses) {
    var parJour = {};
    courses.forEach(function (course) {
      var debut = new Date(course.date + 'T00:00:00');
      var fin = new Date((course.dateFin || course.date) + 'T00:00:00');
      if (isNaN(debut.getTime())) return;
      if (isNaN(fin.getTime()) || fin < debut) fin = debut;

      var curseur = new Date(debut.getTime());
      while (curseur <= fin) {
        var key = dateToKey(curseur.getFullYear(), curseur.getMonth(), curseur.getDate());
        if (!parJour[key]) parJour[key] = [];
        parJour[key].push(course);
        curseur.setDate(curseur.getDate() + 1);
      }
    });
    return parJour;
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
      if (evenements.length) classes += ' avec-cours';

      html += '<button type="button" class="' + classes + '" data-date="' + key + '">';
      html += '<span class="calendrier-numero">' + jour + '</span>';

      // Sépare les événements d'un seul jour (pastille) de ceux qui
      // s'étalent sur plusieurs jours (barre continue).
      var pointsSimples = [];
      var barres = [];
      evenements.forEach(function (e) {
        if ((e.dateFin || e.date) === e.date) {
          pointsSimples.push(e);
        } else {
          barres.push(e);
        }
      });

      var typesPresents = ['cours', 'stage'].filter(function (type) {
        return pointsSimples.some(function (e) { return (e.type || 'cours') === type; });
      });
      typesPresents.forEach(function (type) {
        var duType = pointsSimples.filter(function (e) { return (e.type || 'cours') === type; });
        var complet = duType.every(function (e) { return e.complet; });
        var seule = typesPresents.length === 1 ? ' seule' : '';
        html += '<span class="calendrier-pastille pastille-' + type + seule + (complet ? ' complet' : '') + '"></span>';
      });

      barres.forEach(function (e) {
        var type = e.type || 'cours';
        var position = e.date === key ? 'debut' : ((e.dateFin || e.date) === key ? 'fin' : 'milieu');
        html += '<span class="calendrier-barre barre-' + type + ' barre-' + position + (e.complet ? ' complet' : '') + '"></span>';
      });

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

  global.CalendrierPorcelaine = { creer: creerCalendrier, dateToKey: dateToKey, etalerEvenements: etalerEvenements };
})(window);
