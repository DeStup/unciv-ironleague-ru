/**
 * RU/EN UI strings for Iron League site.
 * Policies/ideologies are stored in Russian (mod); beliefs often in English (Unciv).
 */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'ironleague_lang';

  /** Russian in-game terms → English (policies, ideologies, eras). */
  const TERM_EN = {
    // Policy branches / openers
    'Традиция': 'Tradition',
    'Вольность': 'Liberty',
    'Воля': 'Liberty',
    'Честь': 'Honor',
    'Благочестие': 'Piety',
    'Набожность': 'Piety',
    'Заступничество': 'Patronage',
    'Меценатство': 'Patronage',
    'Эстетика': 'Aesthetics',
    'Коммерция': 'Commerce',
    'Исследование': 'Exploration',
    'Рационализм': 'Rationalism',
    'Свобода': 'Freedom',
    'Порядок': 'Order',
    'Самодержавие': 'Autocracy',
    'Автократия': 'Autocracy',
    // Religion status
    'Пантеон': 'Pantheon',
    'Усилена': 'Enhanced',
    'Усиленная': 'Enhanced',
    // Eras
    'Древность': 'Ancient',
    'Античность': 'Classical',
    'Средневековье': 'Medieval',
    'Возрождение': 'Renaissance',
    'Индустриальная': 'Industrial',
    'Современность': 'Modern',
    'Атомная': 'Atomic',
    'Информационная': 'Information',
    'Будущее': 'Future',
  };

  /**
   * English Unciv/mod belief names → Russian (as in-game with the mod).
   * Built from Unciv Russian.properties + Iron League / BNW extras.
   */
  const BELIEF_RU = {
    'Altars of Worship': 'Алтари поклонения',
    'Alters of Worship': 'Алтари поклонения',
    'Ancestor Worship': 'Культ предков',
    'Apostolic Palace': 'Апостольский дворец',
    'Cathedrals': 'Соборы',
    'Ceremonial Burial': 'Ритуальное погребение',
    'Choral Music': 'Хоралы',
    'Church Property': 'Церковная собственность',
    'City of God': 'Град Божий',
    'Dance of the Aurora': 'Танец Авроры',
    'Dawah': 'Даава',
    'Defender of the Faith': 'Защитник веры',
    'Desert Folklore': 'Легенда пустыни',
    'Devoted Elite': 'Преданная элита',
    'Devout Performers': 'Набожные исполнители',
    'Dharma': 'Дхарма',
    'Disciples': 'Ученики',
    'Divine inspiration': 'Божественное вдохновение',
    'Divine Inspiration': 'Божественное вдохновение',
    'Earth Mother': 'Мать-Земля',
    'Feed the World': 'Накорми мир',
    'Followers of Refined Crafts': 'Последователи изящных ремёсел',
    'God of Craftsman': 'Бог ремесленников',
    'God of Craftsmen': 'Бог ремесленников',
    'God of the Open Sky': 'Бог открытого неба',
    'God of the Sea': 'Бог моря',
    'God of War': 'Бог войны',
    'God-King': 'Бог-царь',
    'Goddess of Love': 'Богиня любви',
    'Goddess of Protection': 'Богиня защиты',
    'Goddess of the Fields': 'Богиня полей',
    'Goddess of the Hunt': 'Богиня охоты',
    'Gurdwaras': 'Гурдвары',
    'Guruship': 'Наставничество',
    'Hajj': 'Хадж',
    'Harvest Festival': 'Праздник урожая',
    'Holy Warriors': 'Священные воины',
    'Houses of Worship': 'Дома поклонения',
    'Indulgences': 'Индульгенции',
    'Initiation Rites': 'Обряды посвящения',
    'Jesuit Education': 'Иезуитское образование',
    'Jizya': 'Джизья',
    'Just War': 'Справедливая война',
    'Karma': 'Карма',
    'Kotel': 'Котель',
    'Liturgical Drama': 'Литургическая драма',
    'Mandirs': 'Мандиры',
    'Messenger of the Gods': 'Посланник богов',
    'Messiah': 'Мессия',
    'Missionary Zeal': 'Миссионерское усердие',
    'Mithraea': 'Митреумы',
    'Mosques': 'Мечети',
    'Mystic Rituals': 'Мистические ритуалы',
    "Ocean's Bounty": 'Дары океана',
    'One with Nature': 'Единение с природой',
    'Oral Tradition': 'Устное предание',
    'Pagodas': 'Пагоды',
    'Peace Gardens': 'Сады мира',
    'Rain Dancing': 'Танец дождя',
    'Religious Art': 'Религиозное искусство',
    'Religious Center': 'Религиозный центр',
    'Religious Community': 'Религиозное сообщество',
    'Religious Idols': 'Религиозные идолы',
    'Religious Settlements': 'Религиозные поселения',
    'Religious Troubadours': 'Религиозные трубадуры',
    'Religious Unity': 'Религиозное единство',
    'Reliquary': 'Реликварий',
    'Rite of Spring': 'Весенний обряд',
    'Ritual Sacrifice': 'Ритуальное жертвоприношение',
    'Sacred Path': 'Священный путь',
    'Sacred Sites': 'Священные места',
    'Sacred Waters': 'Священные воды',
    'Salat': 'Салят',
    'Sanctified Innovations': 'Освящённые новшества',
    'Seafood Rituals': 'Ритуалы даров моря',
    'Spirit Animals': 'Духи-животные',
    'Spirit Trees': 'Духи деревьев',
    'Starlight Guidance': 'Звёздное водительство',
    'Stone Circles': 'Каменные круги',
    'Sun God': 'Бог солнца',
    'Swords into Ploughshares': 'Мечи на орала',
    'Synagogues': 'Синагоги',
    'Tears of the Gods': 'Слёзы богов',
    'Tithe': 'Десятина',
    'Underground Sect': 'Подпольная секта',
    'Unity of the Prophets': 'Единство пророков',
    'Viharas': 'Вихары',
    'Vision Quests': 'Поиски видений',
    'Work Ethic': 'Трудовая этика',
    'Work Spirituals': 'Трудовые спиричуэлы',
    'World Church': 'Всемирная церковь',
    'Zakat': 'Закят',
  };

  /** Spaceship buildings are stored in English in Games.json. */
  const SPACESHIP_RU = {
    'Apollo Program': 'Программа «Аполлон»',
    'SS Booster': 'Ускоритель КК',
    'SS Cockpit': 'Кабина КК',
    'SS Engine': 'Двигатель КК',
    'SS Stasis Chamber': 'Криокамера КК',
  };

  /** Map type labels (RU ↔ EN). */
  const MAP_EN = {
    'Пангея': 'Pangaea',
    'Внутреннее море': 'Inner Sea',
    'Шум Перлина': 'Perlin',
    'Шум перлина': 'Perlin',
    'Перлин': 'Perlin',
    'Фрактал': 'Fractal',
    'Архипелаги': 'Archipelago',
  };
  const MAP_RU = {
    Pangaea: 'Пангея',
    'Inner Sea': 'Внутреннее море',
    Perlin: 'Шум Перлина',
    Fractal: 'Фрактал',
    Archipelago: 'Архипелаги',
  };

  /**
   * Canonical English map type for dedupe / filters.
   * Канонический EN-тип карты для дедупа и фильтров.
   */
  function canonicalizeMap(name) {
    const raw = String(name || '').trim();
    if (!raw) return '';
    const lower = raw.toLowerCase();
    for (const [en, ru] of Object.entries(MAP_RU)) {
      if (en.toLowerCase() === lower || String(ru).toLowerCase() === lower) return en;
    }
    for (const [ru, en] of Object.entries(MAP_EN)) {
      if (String(ru).toLowerCase() === lower || String(en).toLowerCase() === lower) return en;
    }
    return raw;
  }

  function translateMap(name) {
    if (name == null || name === '') return name;
    const raw = String(name).trim();
    if (!raw) return name;
    const canon = canonicalizeMap(raw) || raw;
    if (lang === 'en') return canon;
    return MAP_RU[canon] || canon;
  }

  const I18N = {
    ru: {

      'nav.home': 'Главная',
      'title.home': 'Главная',
      'footer.home': 'Iron League — главная',
      'home.leagueTitle': 'О лиге',
      'home.leagueLead':
        'Iron League — закрытые FFA-игры в Unciv на моде RekMOD / RekMOD iron.',
      'home.league.1':
        'Периодические FFA в закрытом лобби; партии стабильно доигрываются до конца.',
      'home.league.2': 'В лобби обычно 6–10 игроков; старт через драфт наций.',
      'home.league.3':
        'Сессия в среднем 3–4 недели (около 5–15 полных ходов в день).',
      'home.league.4': 'Координация в отдельной Telegram-группе; все лобби 18+.',
      'home.league.5':
        'Telegram-бот уведомляет о наступлении хода и помогает с драфтом, FAQ и спектатором.',
      'home.siteTitle': 'Что есть на сайте',
      'home.card.archive': 'Реплеи, финалы, победители и карточки партий.',
      'home.card.stats': 'Винрейты, нации, институты, чудеса и верования.',
      'home.card.rating': 'Elo и очки лобби (шкала от 1000 или от нуля).',
      'home.card.tierlist': 'Оценка силы наций мода.',
      'home.card.records': 'Достижения и пики по архиву лиги.',
      'home.card.faq': 'Подключение, правила и типичные ошибки.',
      'home.downloadsTitle': 'Скачать',
      'home.downloadsHint':
        'Клиент Unciv и моды. Для лиги обычно нужен Iron-мод (ветка iron2).',
      'home.dl.unciv': 'Unciv',
      'home.dl.uncivMeta': 'Клиент (Windows / Android / …)',
      'home.dl.iron': 'RekMOD iron',
      'home.dl.ironMeta': 'Мод лиги (ветка iron2)',
      'home.dl.rekmod': 'RekMOD',
      'home.dl.rekmodMeta': 'Базовый мод (репозиторий)',
      'home.contactsTitle': 'Организаторы',
      'home.contactsHint':
        'Контакты появятся позже — сейчас только разметка блоков.',
      'home.contact.role1': 'Организатор',
      'home.contact.role2': 'Соорганизатор',
      'home.contact.role3': 'Связь по сайту / боту',
      'home.contact.placeholder': 'Имя / ник — скоро',
      'home.contact.linkPlaceholder': 'Telegram / Discord — скоро',
      'nav.archive': 'Архив игр',
      'nav.stats': 'Статистика',
      'nav.rating': 'Рейтинг',
      'nav.tierlist': 'Тирлист',
      'nav.records': 'Рекорды',
      'nav.faq': 'FAQ',
      'nav.aria': 'Разделы сайта',
      'title.archive': '⚔️ Архив игр 🛡️',
      'title.stats': '📊 Статистика лиги',
      'title.rating': '🏅 Рейтинг',
      'title.tierlist': '⭐ Тирлист наций',
      'title.records': '🏆 Рекорды',
      'title.faq': '❓ FAQ',
      'title.doc': 'Iron League — Unciv',
      'footer.archive': 'Данные обновляются автоматически',
      'footer.stats': 'Статистика по играм архива (без teams/scrap)',
      'footer.rating': 'Рейтинг: шкала от 1000 или от нуля',
      'footer.tierlist': 'Тирлист наций лиги',
      'footer.records': 'Рекорды и достижения (без teams/scrap)',
      'footer.faq': 'Частые вопросы',
      'footer.default': '📁 Хранилище реплеев | Нажмите на кнопку «Смотреть реплей», чтобы загрузить GIF',
      'filter.nation': 'Фильтр по нации',
      'filter.nationAll': 'Все нации',
      'filter.player': 'Игрок',
      'filter.playerAll': 'Все игроки',
      'filter.playerPh': 'Введите никнейм...',
      'filter.sort': 'Сортировка',
      'filter.newest': 'Сначала новые',
      'filter.oldest': 'Сначала старые',
      'filter.relevance': 'Неактуальные игры',
      'filter.relevanceAll': 'Все игры',
      'filter.relevanceHide': 'Скрыть teams/scrap',
      'filter.relevanceOnly': 'Только teams/scrap',
      'filter.victory': 'Тип победы',
      'filter.victoryAll': 'Все типы',
      'filter.map': 'Карта',
      'filter.mapAll': 'Все карты',
      'stats.tab.players': 'Игроки',
      'stats.tab.nations': 'Нации',
      'stats.tab.policies': 'Институты',
      'stats.tab.wonders': 'Чудеса',
      'stats.tab.religion': 'Религия',
      'stats.tab.maps': 'Карты',
      'stats.winnerNations': 'Нации-победители',
      'stats.winnerNationsHint': 'Сколько раз нация побеждала (поле winner), без teams/scrap. Колонка «Тирлист» — среднее из тирлиста; «—» значит, что нации ещё нет в тирлисте.',
      'stats.maps': 'Карты',
      'stats.mapsHint': 'Распределение партий по типу карты. Размер карты в архиве пока не хранится отдельно.',
      'stats.col.map': 'Карта',
      'stats.col.share': 'Доля',
      'stats.col.tierAvg': 'Тирлист',
      'stats.col.game': 'Игра',
      'stats.col.result': 'Итог',
      'stats.firstPolicyChart': 'Стартовые институты',
      'profile.back': '← К статистике',
      'profile.summary': 'Сводка',
      'profile.games': 'Игры',
      'profile.title': 'Профиль: {name}',
      'profile.win': 'Победа',
      'profile.loss': 'Поражение',
      'profile.achievements': 'Достижения',
      'profile.noAchievements': 'Пока нет рекордов лиги на этом игроке.',
      'profile.emblemAchievements': 'Рекордов: {n}',
      'profile.favNations': 'Любимые нации',
      'profile.favPolicies': 'Любимые первые институты',
      'profile.favWonders': 'Любимые чудеса',
      'profile.favIdeologies': 'Любимые идеологии',
      'profile.chartPolicies': 'Первые институты',
      'profile.chartIdeologies': 'Идеологии',
      'profile.chartNations': 'Нации',
      'profile.ratingElo': 'Elo (комбо)',
      'profile.ratingLobbyWin': 'Очки лобби (победа)',
      'profile.ratingLobbyAvg': 'Очки лобби (Avg)',
      'profile.avgHint': 'Ниже — средние показатели по финалам учтённых игр.',
      'profile.avgUnits': 'Юниты (среднее)',
      'profile.avgCities': 'Города (среднее)',
      'profile.avgPopulation': 'Население (среднее)',
      'profile.avgTechs': 'Технологии (среднее)',
      'profile.avgScience': 'Наука (среднее)',
      'profile.avgStrength': 'Сила (среднее)',
      'stats.tierMissing': 'нет в тирлисте',
      'title.profile': 'Профиль',
      'footer.profile': 'Профиль игрока',
      'chart.pie': 'Круговая',
      'chart.bar': 'Столбцы',
      'stats.showGameLinks': 'Показывать ссылки на игры в таблицах',
      'stats.playerDetail': 'Детали игроков',
      'stats.mapsChart': 'Диаграмма',
      'stats.mapsTable': 'Таблица',
      'stats.col.preview': 'Превью',
      'captured.wonders': 'Чудеса:',
      'captured.wondersUnknown': 'Нет данных по чудесам в этой столице',
      'stat.games': 'Всего игр',
      'stat.nations': 'Наций',
      'stat.players': 'Игроков',
      'loading': 'Загрузка данных...',
      'loading.tierlist': 'Загрузка тирлиста...',
      'loading.faq': 'Загрузка FAQ...',
      'error.load': '❌ Ошибка загрузки данных. Проверьте консоль (F12)',
      'error.tierlist': 'Не удалось загрузить тирлист',
      'error.faq': '❌ Не удалось загрузить FAQ',
      'empty.games': '😢 Игр не найдено',
      'badge.teams': 'Командная',
      'badge.scrap': 'Скрап',
      'badge.excluded': 'Не в стате/рейтинге',
      'card.expand': '⛶ На весь экран',
      'card.roster': 'Состав',
      'card.finale': 'Финал',
      'card.finaleFull': 'Финал (полная статистика)',
      'card.replay': '🎬 Смотреть реплей',
      'card.hideReplay': '🎬 Скрыть реплей',
      'card.winner': '🏆 ПОБЕДИТЕЛЬ:',
      'card.versionUnknown': 'Версия не указана',
      'card.noFinale': 'Нет данных о финале (появится после синка из сейва)',
      'card.noFinaleShort': 'Нет данных о финале',
      'modal.close': 'Закрыть',
      'modal.finish': 'Финиш',
      'modal.turn': 'ход',
      'modal.replay': 'Реплей',
      'replay.hint': 'Кликните по гифке, чтобы переиграть',
      'replay.title': 'Кликните, чтобы переиграть',
      'replay.previewTail': 'хвост реплея',
      'status.winner': '👑 Победитель',
      'status.eliminated': '💀 Выбыл',
      'status.barbarian': '🏴 Варвары',
      'flag.noCapital': 'Нет столицы',
      'flag.capitalTaken': 'Столицу захватил: {who}',
      'flag.eliminatedUnknown': 'Выбыл (столица уничтожена или неизвестна)',
      'flag.ideologyNone': 'идеология не принята',
      'captured.title': 'Захваченные столицы:',
      'wonders.title': 'Чудеса:',
      'wonders.none': 'Чудес нет',
      'wonders.built': 'Построенные чудеса:',
      'wonders.taken': 'Захваченные чудеса:',
      'stat.score': 'Очки',
      'stat.science': 'Наука',
      'stat.cities': 'Города',
      'stat.population': 'Население',
      'stat.techs': 'Технологии',
      'stat.policies': 'Институты',
      'stat.policyBranches': 'Ветки',
      'stat.spaceship': 'Корабль',
      'stat.militaryDeaths': 'Потери юнитов',
      'stat.firstPolicy': 'Первый институт',
      'stat.era': 'Эра',
      'stat.religion': 'Религия',
      'stat.ideology': 'Идеология',
      'stat.ideologyTurn': 'Ход идеологии',
      'stat.elimTurn': 'Ход выбывания',
      'stat.capitalLostTurn': 'Ход потери столицы',
      'stat.wars': 'Войны (объявлено / получено)',
      'stat.atWar': 'В войне с',
      'val.unknown': 'неизвестно',
      'val.notEliminated': 'не выбыл',
      'val.neverLostCapital': 'не терял',
      'val.ideologyNotAdopted': 'не принята',
      'cc.line': 'СС: {nation} (ход {turn})',
      'cc.for': 'за',
      'cc.against': 'против',
      'cc.abstain': 'воздержались',
      'league.draft': 'Драфт (выборы): {list}',
      'league.bans': 'Баны: {list}',
      'victory.science': 'Научная победа',
      'victory.culture': 'Культурная победа',
      'victory.domination': 'Военная победа',
      'victory.diplomatic': 'Дипломатическая победа',
      'victory.time': 'Победа по времени',
      'victory.cc': 'Досрочное окончание (СС)',
      'stats.toc': 'Разделы статистики',
      'stats.intro':
        'В статистику не входят игры с пометками «командная» (teams) и «скрап» (scrap): они остаются в архиве и показываются с бейджем, но не влияют на винрейт, средние и рейтинг. Фильтр архива позволяет скрыть или показать только такие игры.',
      'stats.winrate': 'Винрейт игроков',
      'stats.winrateHint':
        'Победы / участия только в актуальных играх (без teams/scrap). «Выжил» — alive=true в финале. Минимум 1 игра.',
      'stats.nations': 'Нации: пики и винрейт',
      'stats.nationsHint': 'Все нации мода. Не пикнутые — 0 пиков и 0% винрейта. Только актуальные игры.',
      'stats.detail': 'Игроки: нации и финал',
      'stats.detailHint':
        'Частая нация и идеология, сумма владеемых чудес, сумма своих чудес (wonders_built), захваченных столиц и боевых потерь юнитов (military_deaths) — по данным «Финал» (без teams/scrap).',
      'stats.averages': 'Игроки: средние показатели',
      'stats.averagesHint': 'Средние по финалу (survivors) только по актуальным играм. Топ‑3 первых институтов — по первому открытому институту.',
      'stats.policies': 'Институты и идеологии',
      'stats.policiesHint':
        'Первый институт, открытые ветки, полные связки веток (как в финале архива), пары «ветка + идеология» и сами идеологии.\n«Ср. место» — нормированное placeScore (1 = победа … 0 = последнее), чтобы уравнять лобби разного размера.\nВинрейт — доля побед среди пиков этой опции (не среди всех игроков партии).\nКоммерция не может быть первым институтом и исключается из таблицы «Первый институт».',
      'stats.firstPolicies': 'Первый институт',
      'stats.policyBranches': 'Ветки институтов',
      'stats.policyCombos': 'Связки институтов',
      'stats.policyCombosHint':
        'Полный набор открытых веток из финала (поле policy_branches), в том же порядке, что в карточке игрока. Одна строка = одна связка.\nДлинные связки сокращаются до первых двух веток (+N); полный список — в подсказке при наведении.\nЕсли были победы — рядом с числом побед ссылка на Game N (открывает финал).',
      'stats.policyFilterLabel': 'Фильтр',
      'stats.policyFilterAll': 'Все',
      'stats.policyFilterHideNoise': 'Скрыть разовые без побед',
      'stats.policyFilterMulti': 'Пиков ≥ 2',
      'stats.policyFilterWins': 'Только с победами',
      'stats.winGameOpen': 'Открыть игру с победой',
      'stats.winGamesMore': 'Побед в {n} разных играх; показана первая',
      'stats.policyIdeologyPairs': 'Пары институт + идеология',
      'stats.policyIdeologyPairsHint':
        'Каждая открытая ветка институтов вместе с принятой идеологией той же партии (если идеология есть).',
      'stats.ideologies': 'Идеологии',
      'stats.col.combo': 'Связка',
      'stats.col.pair': 'Пара',
      'stats.wonders': 'Чудеса',
      'stats.wondersSectionHint':
        'Две таблицы по финалу учтённых игр (без teams/scrap).\n«Ср. место» — среднее нормированного placeScore по лобби, где это чудо было у игрока: placeScore = (N−1−i)/(N−1), где i = 0 у победителя и N−1 у последнего (1 = победа … 0 = последнее). Чем выше число, тем лучше в среднем финишировали владельцы/строители чуда. Винрейт — доля побед среди таких пиков.',
      'stats.wondersBuilt': 'Построенные чудеса',
      'stats.wondersBuiltHint':
        'Только чудеса в городах, основанных этой цивилизацией (поле wonders_built).\nЗахваченные чудеса сюда не входят — см. таблицу «Чудеса во владении» ниже и блок «Захваченные чудеса» в финале архива.',
      'stats.wondersOwned': 'Чудеса во владении',
      'stats.wondersOwnedHint':
        'Все чудеса в городах цивилизации на финале (поле wonders): построенные своими руками и захваченные вместе с городами.\nКолонка «Владений» — сколько раз чудо было у игрока к финалу; винрейт и «Ср. место» считаются по этим же партиям.',
      'stats.beliefs': 'Религиозные верования',
      'stats.beliefsHint':
        'Пантеоны, верования основателя и последователей из финального сейва.\n«Ср. место» — то же нормированное placeScore, что в таблицах институтов.',
      'stats.pantheons': 'Пантеоны',
      'stats.founderBeliefs': 'Верования основателя',
      'stats.followerBeliefs': 'Верования последователей',
      'stats.col.player': 'Игрок',
      'stats.col.games': 'Игр',
      'stats.col.wins': 'Побед',
      'stats.col.winrate': 'Винрейт',
      'stats.col.capitalLosses': 'Потерь столицы',
      'stats.col.survived': 'Выжил',
      'stats.col.eliminated': 'Выбываний',
      'stats.col.nation': 'Нация',
      'stats.col.picks': 'Пиков',
      'stats.col.builds': 'Построек',
      'stats.col.owned': 'Владений',
      'stats.col.topNation': 'Чаще всего',
      'stats.col.topIdeology': 'Идеология',
      'stats.col.uniqueNations': 'Уник. наций',
      'stats.col.wonders': 'Чудес (сумма)',
      'stats.col.wondersBuilt': 'Построенных чудес',
      'stats.col.conquered': 'Столиц захвачено',
      'stats.col.militaryDeaths': 'Потерь юнитов',
      'stats.col.gamesWithStats': 'Игр со статой',
      'stats.col.score': 'Очки',
      'stats.col.units': 'Юниты',
      'stats.col.strength': 'Сила',
      'stats.col.science': 'Наука',
      'stats.col.cities': 'Города',
      'stats.col.population': 'Население',
      'stats.col.techs': 'Технологии',
      'stats.col.topPolicies': 'Топ‑3 института',
      'stats.col.item': 'Название',
      'stats.col.ideology': 'Идеология',
      'stats.col.wonder': 'Чудо',
      'stats.col.belief': 'Верование',
      'stats.col.avgPlaceNorm': 'Ср. место',
      'rating.intro':
        'Классический рейтинг считается в браузере из Games.json при каждой загрузке страницы.\n\nКакие игры входят\n• Только актуальные FFA без флагов teams / scrap (и без excludeFromStats).\n• Игры обрабатываются по номеру по возрастанию (хронология лиги).\n\nКак определяется место в одной партии\n1) Победитель (нация winner) — всегда 1-е место.\n2) Среди остальных: сначала живые, потом выбывшие.\n3) Внутри группы — по очкам финала (score) по убыванию; если очков нет — по нику.\n\nШкала «от 1000»\n• Все стартуют с 1000 (Elo FFA / pairwise).\n• Финиш мапится на ~1000 ± 400.\n• Сводный = среднее трёх методов на этой шкале.\n\nШкалу «от нуля» и очки лобби можно выбрать в выпадающем списке сверху.',
      'rating.introZero':
        'Рейтинг от нуля и очки лобби считаются в браузере из Games.json при каждой загрузке.\n\nКакие игры входят и как считается место — как на шкале «от 1000» (только FFA без teams/scrap; победитель → живые → выбывшие → score).\n\nЧто на этой шкале\n• Сводный Elo от нуля: FFA / pairwise стартуют с 0; финиш = среднее placeScore × 100 (без базы 1000).\n• Очки лобби (победа): всем +(N−1), победителю +(N−1)+10.\n• Очки лобби (Avg): всем +(N−1)+Avg (techs/policies/cities).\n\nФильтры\n• K — только для Elo FFA/pairwise в сводной таблице от нуля.\n• Штраф за выбывание (−5 при alive=false) — только для двух таблиц «Очки лобби»; по умолчанию выключен.',
      'rating.scaleLabel': 'Шкала',
      'rating.scale1000': 'от 1000',
      'rating.scaleZero': 'от нуля',
      'rating.scaleHint':
        'Выбор внутри вкладки «Рейтинг»: классический Elo (старт 1000) или шкала от нуля и очки лобби. Сохраняется в браузере.',
      'rating.toc': 'Разделы рейтинга',
      'rating.tocZero': 'Разделы рейтинга от нуля',
      'rating.combined': 'Сводный рейтинг',
      'rating.combinedHint':
        'Сводный рейтинг = среднее арифметическое трёх чисел: Elo FFA, Elo pairwise и рейтинга по финишу.\nКолонка «Ср. место» — среднее мест игрока в этих трёх таблицах (меньше — лучше).\nТакже показаны отдельные места в каждой методике, чтобы видеть расхождения.',
      'rating.ffa': 'Elo FFA (линейное место)',
      'rating.ffaHint':
        'Метод как в Google Sheet ratingv2 (линейное место).\n\nДля лобби из N игроков место i (0 = победитель, N−1 = последний) даёт Actual = (N−1−i) / (N−1): победитель = 1, последний = 0, остальные равномерно между ними.\n\nExpected для игрока A — среднее классических Elo-ожиданий против каждого соперника B:\nE(A,B) = 1 / (1 + 10^((Rb−Ra)/400)).\n\nОбновление после игры: Ra ← Ra + K × (Actual − Expected).\nСумма изменений по лобби не обязана быть нулевой (это не попарный zero-sum).\nСтарт на этой вкладке: 1000.',
      'rating.pairwise': 'Elo pairwise',
      'rating.pairwiseHint':
        'Классический FFA-Elo с нулевой суммой по парам.\n\nВ лобби из N игроков строится C(N,2) = N(N−1)/2 виртуальных дуэлей: каждый вышестоящий «побеждает» каждого нижестоящего.\nНа одну дуэль идёт k_pair = K / C(N,2), чтобы суммарный масштаб за игру оставался порядка K.\n\nДля пары (выше A, ниже B):\nΔA = k_pair × (1 − E(A,B)),  ΔB = k_pair × (0 − (1 − E(A,B))) = −ΔA,\nгде E(A,B) = 1 / (1 + 10^((Rb−Ra)/400)).\n\nИтог за игру — сумма Δ по всем парам. Сумма изменений рейтинга по всем игрокам партии = 0.\nСтарт на этой вкладке: 1000.',
      'rating.kLabel': 'Коэффициент K',
      'rating.kHint':
        'K задаёт «жёсткость» обновления Elo за одну игру для FFA и pairwise на этой вкладке (старт 1000).\n• 20 — спокойнее, меньше скачков.\n• 24 — значение по умолчанию.\n• 32 — как в старом Google Sheet ratingv2, сильнее реагирует на результат.\nНа «Рейтинг по финишу» K не влияет. Выбор сохраняется в браузере.',
      'rating.kHintZero':
        'K влияет только на Elo FFA / pairwise внутри «Сводного от нуля» (старт 0).\nНа финишную часть сводной и на «Очки лобби» K не влияет. Выбор общий с вкладкой «Рейтинг от 1000» и сохраняется в браузере.',
      'rating.elimLabel': 'Штраф за выбывание',
      'rating.elimOff': 'Выкл',
      'rating.elimOn': '−5',
      'rating.elimHint':
        'Только для таблиц «Очки лобби (победа)» и «Очки лобби (Avg)».\nЕсли включено: при alive=false (смерть / выбывание в финале) с начисленных за игру очков снимается 5.\nПо умолчанию выключено — выбывшие получают те же очки участия, что и живые не-победители. Выбор сохраняется в браузере.',
      'rating.minGamesLabel': 'Минимум игр',
      'rating.minGamesOff': 'Все',
      'rating.minGamesOn': '≥5',
      'rating.minGamesHint':
        'Скрыть игроков с числом учтённых игр меньше порога во всех таблицах рейтинга на обеих вкладках.\nПо умолчанию показаны все. Места (#) пересчитываются среди видимых. Выбор сохраняется в браузере.',
      'rating.finish': 'Рейтинг по финишу',
      'rating.finishHint':
        'Не Elo, а оценка среднего финиша на шкале ~1000.\n\nВ каждой игре место даёт placeScore = (N−1−i)/(N−1) (1 = победа … 0 = последнее).\nСчитается среднее placeScore по всем учтённым играм игрока: avg.\nЦелевой рейтинг: target = 1000 + 400 × (avg − 0.5)\n(стабильно первые ≈ 1200, стабильно последние ≈ 800).\n\nСмешивание с текущим значением: вес w = min(1, games/8), R ← R×(1−w) + target×w — чем больше игр, тем ближе к долгосрочному среднему.\nK на этот метод не влияет.',
      'rating.zero': 'Рейтинг от нуля',
      'rating.zeroCombined': 'Сводный рейтинг от нуля',
      'rating.zeroHint':
        'Среднее трёх методов без стартовой константы 1000.\n• Elo FFA / pairwise: старт = 0. Формулы Expected и K те же.\n• Финиш: среднее placeScore × 100 (примерно 0…100), без target 1000±400 и без смешивания w = games/8.\n• Сводная = среднее трёх zero-based чисел.\nКолонки мест — как в классической сводной.',
      'rating.lobbyWin': 'Очки лобби (победа)',
      'rating.lobbyWinHint':
        'Накопительный рейтинг от нуля (не Elo). N — число игроков в лобби этой партии.\n\nЗа каждую учтённую игру:\n• всем участникам: +(N − 1)\n• победителю дополнительно: +10\n• бонус аутсайдера: если форма победителя (рейтинг/игры) ниже формы соперников, добавляется среднее (форма_оппа − форма_я) по всем, кто сильнее.\n\nЕсли включён «Штраф за выбывание»: при alive=false дополнительно −5 за эту игру.\nElo K сюда не входит.',
      'rating.lobbyAvg': 'Очки лобби (Avg)',
      'rating.lobbyAvgHint':
        'Накопительный рейтинг от нуля: за игру (N − 1) + Avg,\nгде Avg — среднее доступных techs / policies / cities из финала (если данных нет — Avg = 0).\nПобедителю дополнительно бонус аутсайдера по форме (рейтинг/игры), как в «Очки лобби (победа)».\n\nЕсли включён «Штраф за выбывание»: при alive=false дополнительно −5.\nНет отдельного +10 за победу. Elo K не влияет.',
      'rating.col.place': '#',
      'rating.col.player': 'Игрок',
      'rating.col.rating': 'Рейтинг',
      'rating.col.perGame': 'За игру',
      'rating.col.games': 'Игр',
      'rating.col.avgPlace': 'Ср. место',
      'rating.col.pFfa': 'Место FFA',
      'rating.col.pPair': 'Место pair',
      'rating.col.pFin': 'Место finish',
      'records.intro':
        'Рекорды считаются из архива при каждой загрузке. Игры с флагами teams / scrap не учитываются.',
      'records.toc': 'Разделы рекордов',
      'records.empty': 'Пока нет данных для этого раздела.',
      'records.section.glory': 'Слава',
      'records.section.war': 'Война',
      'records.section.veteran': 'Ветеран',
      'records.section.style': 'Стиль',
      'records.section.peaks': 'Пики финала',
      'records.section.curious': 'Курьёзы',
      'records.item.most_wins.title': 'Больше всего побед',
      'records.item.most_wins.flavor': 'Пришёл. Увидел. Победил.',
      'records.item.most_wins.body':
        '{player} лидирует по числу побед: {value} (из {games} учтённых игр).',
      'records.item.best_winrate.title': 'Наибольший винрейт',
      'records.item.best_winrate.flavor': 'Остановите его кто-нибудь',
      'records.item.best_winrate.body':
        '{player} лидирует по винрейту: {value} ({wins}/{games}).',
      'records.item.longest_win_streak.title': 'Стрик побед',
      'records.item.longest_win_streak.flavor': 'And again. And again.',
      'records.item.longest_win_streak.body':
        'У {player} самый длинный стрик побед подряд: {value}.',
      'records.item.longest_play_streak.title': 'Ветеран',
      'records.item.longest_play_streak.flavor': 'Железная явка',
      'records.item.longest_play_streak.body':
        'У {player} самый длинный стрик игр подряд без пропуска: {value} (из {games} учтённых).',
      'records.item.fastest_win.title': 'Самая быстрая победа',
      'records.item.fastest_win.flavor': 'Блицкриг',
      'records.item.fastest_win.body':
        '{player} закрыл Game {game} на ходу {value}.',
      'records.item.slowest_win.title': 'Самая долгая победа',
      'records.item.slowest_win.flavor': 'Дорогу осилит идущий',
      'records.item.slowest_win.body':
        '{player} дожал Game {game} аж на ходу {value}.',
      'records.item.most_achievements.title': 'Самый титулованный',
      'records.item.most_achievements.flavor': 'Чей-чей генерал?',
      'records.item.most_achievements.body':
        '{player} держит больше всего рекордов лиги сразу: {value}. Орденская планка не выдерживает.',
      'records.item.wins_all_with_caps.title': 'Победы только с трофеями',
      'records.item.wins_all_with_caps.flavor': 'Без столиц не бывает',
      'records.item.wins_all_with_caps.body':
        'У {player} все {value} побед — с захватом хотя бы одной чужой столицы.',
      'records.item.most_caps_single_win.title': 'Триумфальный разгром',
      'records.item.most_caps_single_win.flavor': 'Один ход — империя',
      'records.item.most_caps_single_win.body':
        '{player} в одной победе (Game {game}) забрал больше всего столиц: {value}.',
      'records.item.most_caps.title': 'Охотник за столицами',
      'records.item.most_caps.flavor': 'Карта перекрашена',
      'records.item.most_caps.body':
        '{player} суммарно захватил больше всего столиц: {value}.',
      'records.item.most_wars_declared.title': 'Ястреб войны',
      'records.item.most_wars_declared.flavor': 'Дипломатия по-спартански',
      'records.item.most_wars_declared.body':
        '{player} объявил больше всего войн живым игрокам: {value} (по данным финала).',
      'records.item.most_wars_received.title': 'Наживка',
      'records.item.most_wars_received.flavor': 'Я вам что? А?',
      'records.item.most_wars_received.body':
        'На {player} чаще всего объявляли войну: {value} раз(а).',
      'records.item.zeus_statue_win.title': 'Построить Статую Зевса и победить',
      'records.item.zeus_statue_win.flavor': 'Олимпийский контракт',
      'records.item.zeus_statue_win.body':
        '{player} выиграл партию, построив Статую Зевса (Game {game}).',
      'records.item.zeus_statue_win.bodyVacant':
        'Пока никто не получил: в архиве нет победы с собственно построенной Статуей Зевса. Гром ждёт своего полководца.',
      'records.vacantPlayer': 'Пока никого',
      'records.item.most_military_deaths.title': 'Мясорубка',
      'records.item.most_military_deaths.flavor': 'Мясной штурм',
      'records.item.most_military_deaths.body':
        '{player} потерял больше всего юнитов в бою: {value}.',
      'records.item.fewest_military_deaths.title': 'Бережливый полководец',
      'records.item.fewest_military_deaths.flavor': 'Юниты на вес золота',
      'records.item.fewest_military_deaths.body':
        '{player} потерял в бою меньше всего юнитов среди игроков с данными минимум по 5 партиям: {value} потерь за {games} игр.',
      'records.item.piety_first_count.title': 'Свидетель Иегов',
      'records.item.piety_first_count.flavor': 'Amen.',
      'records.item.piety_first_count.body':
        '{player} чаще всех открывал первым институт «Набожность»: {value} раз(а).',
      'records.item.piety_first_streak.title': 'Жили в лесу, молились колесу',
      'records.item.piety_first_streak.flavor': 'Amen. Again.',
      'records.item.piety_first_streak.body':
        'У {player} самый длинный стрик игр с первым институтом «Набожность»: {value}.',
      'records.item.tradition_first_count.title': 'Адепт Традиции',
      'records.item.tradition_first_count.flavor': 'Классика жанра',
      'records.item.tradition_first_count.body':
        '{player} чаще всех открывал первым институт «Традиция»: {value} раз(а).',
      'records.item.liberty_first_count.title': 'Адепт Воли',
      'records.item.liberty_first_count.flavor': 'Воля к расширению',
      'records.item.liberty_first_count.body':
        '{player} чаще всех открывал первым институт «Воля»: {value} раз(а).',
      'records.item.honor_first_count.title': 'Адепт Чести',
      'records.item.honor_first_count.flavor': 'Честь превыше всего',
      'records.item.honor_first_count.body':
        '{player} чаще всех открывал первым институт «Честь»: {value} раз(а).',
      'records.item.ideology_order_count.title': 'Порядочный',
      'records.item.ideology_order_count.flavor': 'Порядок превыше всего',
      'records.item.ideology_order_count.body':
        '{player} чаще всех принимал идеологию «Порядок»: {value} раз(а).',
      'records.item.ideology_freedom_count.title': 'Свободный',
      'records.item.ideology_freedom_count.flavor': 'Свобода или свобода',
      'records.item.ideology_freedom_count.body':
        '{player} чаще всех принимал идеологию «Свобода»: {value} раз(а).',
      'records.item.ideology_autocracy_count.title': 'Автократ',
      'records.item.ideology_autocracy_count.flavor': 'Я — государство',
      'records.item.ideology_autocracy_count.body':
        '{player} чаще всех принимал идеологию «Автократия»: {value} раз(а).',
      'records.item.most_wonders_built.title': 'Зодчий',
      'records.item.most_wonders_built.flavor': 'Египетский синдром',
      'records.item.most_wonders_built.body':
        '{player} построил больше всего своих чудес света: {value}.',
      'records.item.most_wonders_owned.title': 'Коллекционер чудес',
      'records.item.most_wonders_owned.flavor': 'Музей под открытым небом',
      'records.item.most_wonders_owned.body':
        '{player} владел суммарно большим числом чудес (свои + трофеи): {value}.',
      'records.item.most_unique_nations.title': 'Турист по нациям',
      'records.item.most_unique_nations.flavor': 'Паспортный стол',
      'records.item.most_unique_nations.body':
        '{player} сыграл наибольшим числом разных наций: {value} (из {games} игр).',
      'records.item.most_games_no_win.title': 'Долгий путь к трону',
      'records.item.most_games_no_win.flavor': 'Почти, но нет',
      'records.item.most_games_no_win.body':
        '{player} сыграл больше всех без единой победы: {value} игр.',
      'records.item.never_eliminated.title': 'Неуязвимый',
      'records.item.never_eliminated.flavor': 'Дожил. Всегда.',
      'records.item.never_eliminated.body':
        '{player} ни разу не выбывал в финале ({value} игр с данными финала).',
      'records.item.pacifist_games.title': 'Пацифист по бумагам',
      'records.item.pacifist_games.flavor': 'Голубь мира',
      'records.item.pacifist_games.body':
        'У {player} больше всего партий без объявленных войн живым (wars_declared=0): {value}.',
      'records.item.survived_no_capital.title': 'Жизнь без столицы',
      'records.item.survived_no_capital.flavor': 'Столица? Какая столица?',
      'records.item.survived_no_capital.body':
        '{player} чаще всех дожил до финала уже без столицы: {value} раз(а).',
      'records.item.max_score_finale.title': 'Рекорд очков',
      'records.item.max_score_finale.flavor': 'Счётчик сломался',
      'records.item.max_score_finale.body':
        '{player} набрал больше всего очков в одном финале: {value} (Game {game}).',
      'records.item.max_cities_finale.title': 'Империя городов',
      'records.item.max_cities_finale.flavor': 'Споткнулся о город',
      'records.item.max_cities_finale.body':
        '{player} держал больше всего городов в одном финале: {value} (Game {game}).',
      'records.item.max_units_finale.title': 'Армия на финале',
      'records.item.max_units_finale.flavor': 'Тень империи',
      'records.item.max_units_finale.body':
        '{player} вывел больше всего юнитов в одном финале: {value} (Game {game}).',
      'records.item.max_techs_finale.title': 'Технологический пик',
      'records.item.max_techs_finale.flavor': 'Всё исследовано',
      'records.item.max_techs_finale.body':
        '{player} открыл больше всего технологий к одному финалу: {value} (Game {game}).',
      'tier.title': 'Тирлист наций',
      'tier.col.nation': 'Нация',
      'tier.col.avg': 'Среднее',
      'tier.source': 'Источник: {link}',
      'tier.legend.5': 'Имба / бан',
      'tier.legend.4': 'Сильная',
      'tier.legend.3': 'Средняя',
      'tier.legend.2': 'Слабая',
      'tier.legend.1': 'Дно',
      'faq.source': 'Источник: {link}',
      'force.label': 'Сила',
      'force.hint': 'кол-во юнитов / мощь',
      'backTop': 'Наверх',
      'lang.label': 'Язык',
    },
    en: {

      'nav.home': 'Home',
      'title.home': 'Home',
      'footer.home': 'Iron League — home',
      'home.leagueTitle': 'About the league',
      'home.leagueLead':
        'Iron League — closed FFA games in Unciv on RekMOD / RekMOD iron.',
      'home.league.1':
        'Periodic closed-lobby FFAs; games are reliably played to the end.',
      'home.league.2': 'Lobbies are usually 6–10 players; start via nation draft.',
      'home.league.3':
        'A session lasts about 3–4 weeks (roughly 5–15 full turns per day).',
      'home.league.4': 'Coordination in a dedicated Telegram group; all lobbies are 18+.',
      'home.league.5':
        'A Telegram bot pings turns and helps with draft, FAQ, and spectator tools.',
      'home.siteTitle': 'What is on this site',
      'home.card.archive': 'Replays, finales, winners, and game cards.',
      'home.card.stats': 'Win rates, nations, policies, wonders, and beliefs.',
      'home.card.rating': 'Elo and lobby points (scale from 1000 or from zero).',
      'home.card.tierlist': 'Mod nation power ranking.',
      'home.card.records': 'Achievements and peaks from the league archive.',
      'home.card.faq': 'Connection steps, rules, and common errors.',
      'home.downloadsTitle': 'Downloads',
      'home.downloadsHint':
        'Unciv client and mods. The league usually needs the Iron mod (iron2 branch).',
      'home.dl.unciv': 'Unciv',
      'home.dl.uncivMeta': 'Client (Windows / Android / …)',
      'home.dl.iron': 'RekMOD iron',
      'home.dl.ironMeta': 'League mod (iron2 branch)',
      'home.dl.rekmod': 'RekMOD',
      'home.dl.rekmodMeta': 'Base mod repository',
      'home.contactsTitle': 'Organizers',
      'home.contactsHint':
        'Contacts will appear later — placeholders only for now.',
      'home.contact.role1': 'Organizer',
      'home.contact.role2': 'Co-organizer',
      'home.contact.role3': 'Site / bot contact',
      'home.contact.placeholder': 'Name / nick — soon',
      'home.contact.linkPlaceholder': 'Telegram / Discord — soon',
      'nav.archive': 'Archive',
      'nav.stats': 'Statistics',
      'nav.rating': 'Rating',
      'nav.tierlist': 'Tier list',
      'nav.records': 'Records',
      'nav.faq': 'FAQ',
      'nav.aria': 'Site sections',
      'title.archive': '⚔️ Game archive 🛡️',
      'title.stats': '📊 League statistics',
      'title.rating': '🏅 Rating',
      'title.tierlist': '⭐ Nation tier list',
      'title.records': '🏆 Records',
      'title.faq': '❓ FAQ',
      'title.doc': 'Iron League — Unciv',
      'footer.archive': 'Data updates automatically',
      'footer.stats': 'Stats from archive games (excluding teams/scrap)',
      'footer.rating': 'Rating: scale from 1000 or from zero',
      'footer.tierlist': 'League nation tier list',
      'footer.records': 'Records and achievements (excluding teams/scrap)',
      'footer.faq': 'Frequently asked questions',
      'footer.default': '📁 Replay storage | Click “Watch replay” to load a GIF',
      'filter.nation': 'Filter by nation',
      'filter.nationAll': 'All nations',
      'filter.player': 'Player',
      'filter.playerAll': 'All players',
      'filter.playerPh': 'Enter nickname...',
      'filter.sort': 'Sort',
      'filter.newest': 'Newest first',
      'filter.oldest': 'Oldest first',
      'filter.relevance': 'Non-ranked games',
      'filter.relevanceAll': 'All games',
      'filter.relevanceHide': 'Hide teams/scrap',
      'filter.relevanceOnly': 'Only teams/scrap',
      'filter.victory': 'Victory type',
      'filter.victoryAll': 'All types',
      'filter.map': 'Map',
      'filter.mapAll': 'All maps',
      'stats.tab.players': 'Players',
      'stats.tab.nations': 'Nations',
      'stats.tab.policies': 'Policies',
      'stats.tab.wonders': 'Wonders',
      'stats.tab.religion': 'Religion',
      'stats.tab.maps': 'Maps',
      'stats.winnerNations': 'Winning nations',
      'stats.winnerNationsHint': 'How often a nation won (winner field), excluding teams/scrap. “Tier list” is the sheet average; “—” means the nation is not in the tier list yet.',
      'stats.maps': 'Maps',
      'stats.mapsHint': 'Games by map type. Map size is not stored separately in the archive yet.',
      'stats.col.map': 'Map',
      'stats.col.share': 'Share',
      'stats.col.tierAvg': 'Tier list',
      'stats.col.game': 'Game',
      'stats.col.result': 'Result',
      'stats.firstPolicyChart': 'Opening policies',
      'profile.back': '← Back to stats',
      'profile.summary': 'Summary',
      'profile.games': 'Games',
      'profile.title': 'Profile: {name}',
      'profile.win': 'Win',
      'profile.loss': 'Loss',
      'profile.achievements': 'Achievements',
      'profile.noAchievements': 'No league records for this player yet.',
      'profile.emblemAchievements': 'Records: {n}',
      'profile.favNations': 'Favorite nations',
      'profile.favPolicies': 'Favorite opening policies',
      'profile.favWonders': 'Favorite wonders',
      'profile.favIdeologies': 'Favorite ideologies',
      'profile.chartPolicies': 'Opening policies',
      'profile.chartIdeologies': 'Ideologies',
      'profile.chartNations': 'Nations',
      'profile.ratingElo': 'Elo (combined)',
      'profile.ratingLobbyWin': 'Lobby points (win)',
      'profile.ratingLobbyAvg': 'Lobby points (Avg)',
      'profile.avgHint': 'Below: averages from finales of ranked games.',
      'profile.avgUnits': 'Units (avg)',
      'profile.avgCities': 'Cities (avg)',
      'profile.avgPopulation': 'Population (avg)',
      'profile.avgTechs': 'Techs (avg)',
      'profile.avgScience': 'Science (avg)',
      'profile.avgStrength': 'Strength (avg)',
      'stats.tierMissing': 'not in tier list',
      'title.profile': 'Profile',
      'footer.profile': 'Player profile',
      'chart.pie': 'Pie',
      'chart.bar': 'Bars',
      'stats.showGameLinks': 'Show game links in tables',
      'stats.playerDetail': 'Player details',
      'stats.mapsChart': 'Chart',
      'stats.mapsTable': 'Table',
      'stats.col.preview': 'Preview',
      'captured.wonders': 'Wonders:',
      'captured.wondersUnknown': 'No wonder data for this capital',
      'stat.games': 'Games',
      'stat.nations': 'Nations',
      'stat.players': 'Players',
      'loading': 'Loading data...',
      'loading.tierlist': 'Loading tier list...',
      'loading.faq': 'Loading FAQ...',
      'error.load': '❌ Failed to load data. Check the console (F12)',
      'error.tierlist': 'Failed to load tier list',
      'error.faq': '❌ Failed to load FAQ',
      'empty.games': '😢 No games found',
      'badge.teams': 'Teams',
      'badge.scrap': 'Scrap',
      'badge.excluded': 'Excluded from stats/rating',
      'card.expand': '⛶ Fullscreen',
      'card.roster': 'Roster',
      'card.finale': 'Finale',
      'card.finaleFull': 'Finale (full stats)',
      'card.replay': '🎬 Watch replay',
      'card.hideReplay': '🎬 Hide replay',
      'card.winner': '🏆 WINNER:',
      'card.versionUnknown': 'Version unknown',
      'card.noFinale': 'No finale data yet (appears after a save sync)',
      'card.noFinaleShort': 'No finale data',
      'modal.close': 'Close',
      'modal.finish': 'Finish',
      'modal.turn': 'turn',
      'modal.replay': 'Replay',
      'replay.hint': 'Click the GIF to replay',
      'replay.title': 'Click to replay',
      'replay.previewTail': 'replay tail',
      'status.winner': '👑 Winner',
      'status.eliminated': '💀 Eliminated',
      'status.barbarian': '🏴 Barbarians',
      'flag.noCapital': 'No capital',
      'flag.capitalTaken': 'Capital taken by: {who}',
      'flag.eliminatedUnknown': 'Eliminated (capital razed or unknown)',
      'flag.ideologyNone': 'no ideology',
      'captured.title': 'Captured capitals:',
      'wonders.title': 'Wonders:',
      'wonders.none': 'No wonders',
      'wonders.built': 'Built wonders:',
      'wonders.taken': 'Conquered wonders:',
      'stat.score': 'Score',
      'stat.science': 'Science',
      'stat.cities': 'Cities',
      'stat.population': 'Population',
      'stat.techs': 'Techs',
      'stat.policies': 'Policies',
      'stat.policyBranches': 'Branches',
      'stat.spaceship': 'Spaceship',
      'stat.militaryDeaths': 'Units lost',
      'stat.firstPolicy': 'First policy',
      'stat.era': 'Era',
      'stat.religion': 'Religion',
      'stat.ideology': 'Ideology',
      'stat.ideologyTurn': 'Ideology turn',
      'stat.elimTurn': 'Eliminated turn',
      'stat.capitalLostTurn': 'Capital lost turn',
      'stat.wars': 'Wars (declared / received)',
      'stat.atWar': 'At war with',
      'val.unknown': 'unknown',
      'val.notEliminated': 'not eliminated',
      'val.neverLostCapital': 'never lost',
      'val.ideologyNotAdopted': 'not adopted',
      'cc.line': 'WC: {nation} (turn {turn})',
      'cc.for': 'for',
      'cc.against': 'against',
      'cc.abstain': 'abstained',
      'league.draft': 'Draft picks: {list}',
      'league.bans': 'Bans: {list}',
      'victory.science': 'Science victory',
      'victory.culture': 'Cultural victory',
      'victory.domination': 'Domination victory',
      'victory.diplomatic': 'Diplomatic victory',
      'victory.time': 'Time victory',
      'victory.cc': 'Early end (World Congress)',
      'stats.toc': 'Statistics sections',
      'stats.intro':
        'Statistics exclude games tagged teams or scrap: they stay in the archive with a badge, but do not affect winrates, averages, or ratings. Use the archive filter to hide or show only those games.',
      'stats.winrate': 'Player winrate',
      'stats.winrateHint':
        'Wins / games in ranked archive only (no teams/scrap). “Survived” = alive=true in finale. Minimum 1 game.',
      'stats.nations': 'Nations: picks and winrate',
      'stats.nationsHint': 'All mod nations. Unpicked show 0 picks and 0% winrate. Ranked games only.',
      'stats.detail': 'Players: nations and finale',
      'stats.detailHint':
        'Most-picked nation and ideology, sum of owned wonders, sum of self-built wonders (wonders_built), captured capitals, and military units lost (military_deaths) — from Finale data (no teams/scrap).',
      'stats.averages': 'Players: averages',
      'stats.averagesHint': 'Finale averages (survivors) for ranked games only. Top-3 opener policies from first unlocked policy branch.',
      'stats.policies': 'Policies & ideologies',
      'stats.policiesHint':
        'First policy opener, adopted branches, full branch combos (as in archive finale), “branch + ideology” pairs, and ideologies.\n“Avg place” is normalized placeScore (1 = win … 0 = last) so lobbies of different sizes are comparable.\nWin rate is wins among picks of that option (not among every player in the lobby).\nCommerce cannot be a first policy and is excluded from the First policy table.',
      'stats.firstPolicies': 'First policy',
      'stats.policyBranches': 'Policy branches',
      'stats.policyCombos': 'Policy combos',
      'stats.policyCombosHint':
        'Full set of adopted branches from finale (policy_branches), same order as on the player card. One row = one combo.\nLong combos are shortened to the first two branches (+N); full list is in the hover tooltip.\nIf there were wins — a Game N link next to the win count opens that finale.',
      'stats.policyFilterLabel': 'Filter',
      'stats.policyFilterAll': 'All',
      'stats.policyFilterHideNoise': 'Hide one-pick zero-win',
      'stats.policyFilterMulti': 'Picks ≥ 2',
      'stats.policyFilterWins': 'Wins only',
      'stats.winGameOpen': 'Open a winning game',
      'stats.winGamesMore': 'Wins in {n} different games; showing the first',
      'stats.policyIdeologyPairs': 'Policy + ideology pairs',
      'stats.policyIdeologyPairsHint':
        'Each adopted policy branch paired with the ideology taken in that game (when an ideology is present).',
      'stats.ideologies': 'Ideologies',
      'stats.col.combo': 'Combo',
      'stats.col.pair': 'Pair',
      'stats.wonders': 'Wonders',
      'stats.wondersSectionHint':
        'Two tables from ranked finales (no teams/scrap).\n“Avg place” is the mean normalized placeScore in lobbies where the player had that wonder: placeScore = (N−1−i)/(N−1), with i = 0 for the winner and N−1 for last (1 = win … 0 = last). Higher is better. Win rate is wins among those picks.',
      'stats.wondersBuilt': 'Built wonders',
      'stats.wondersBuiltHint':
        'Only wonders in cities founded by that civ (wonders_built).\nConquered wonders are excluded here — see “Wonders owned” below and Finale “Conquered wonders”.',
      'stats.wondersOwned': 'Wonders owned',
      'stats.wondersOwnedHint':
        'Every wonder in the civ’s cities at finale (wonders field): self-built and captured with cities.\n“Owned” counts how often the wonder was held at finale; win rate and avg place use those same games.',
      'stats.beliefs': 'Religious beliefs',
      'stats.beliefsHint':
        'Pantheons, founder and follower beliefs from the final save.\n“Avg place” uses the same normalized placeScore as the policy tables.',
      'stats.pantheons': 'Pantheons',
      'stats.founderBeliefs': 'Founder beliefs',
      'stats.followerBeliefs': 'Follower beliefs',
      'stats.col.player': 'Player',
      'stats.col.games': 'Games',
      'stats.col.wins': 'Wins',
      'stats.col.winrate': 'Winrate',
      'stats.col.capitalLosses': 'Capital losses',
      'stats.col.survived': 'Survived',
      'stats.col.eliminated': 'Eliminations',
      'stats.col.nation': 'Nation',
      'stats.col.picks': 'Picks',
      'stats.col.builds': 'Built',
      'stats.col.owned': 'Owned',
      'stats.col.topNation': 'Most picked',
      'stats.col.topIdeology': 'Ideology',
      'stats.col.uniqueNations': 'Unique nations',
      'stats.col.wonders': 'Wonders (sum)',
      'stats.col.wondersBuilt': 'Built',
      'stats.col.conquered': 'Capitals taken',
      'stats.col.militaryDeaths': 'Units lost',
      'stats.col.gamesWithStats': 'Games with stats',
      'stats.col.score': 'Score',
      'stats.col.units': 'Units',
      'stats.col.strength': 'Strength',
      'stats.col.science': 'Science',
      'stats.col.cities': 'Cities',
      'stats.col.population': 'Population',
      'stats.col.techs': 'Techs',
      'stats.col.topPolicies': 'Top-3 policies',
      'stats.col.item': 'Name',
      'stats.col.ideology': 'Ideology',
      'stats.col.wonder': 'Wonder',
      'stats.col.belief': 'Belief',
      'stats.col.avgPlaceNorm': 'Avg place',
      'rating.intro':
        'Classic ratings are computed in the browser from Games.json on every page load.\n\nWhich games count\n• Ranked FFA only — no teams / scrap flags (and no excludeFromStats).\n• Games are processed in ascending game-number order (league chronology).\n\nPlacement inside one game\n1) The winner (winner nation) is always 1st.\n2) Among the rest: living players first, then eliminated.\n3) Within a group — by finale score descending; if score is missing — by nickname.\n\n“From 1000” scale\n• Everyone starts at 1000 (FFA / pairwise Elo).\n• Finish maps onto ~1000 ± 400.\n• Combined = mean of the three methods on this scale.\n\nUse the dropdown at the top for the zero-based scale and Lobby points.',
      'rating.introZero':
        'Zero-based ratings and lobby points are computed in the browser from Games.json on every page load.\n\nWhich games count and how placement works match the “from 1000” scale (ranked FFA only; winner → living → eliminated → score).\n\nWhat is on this scale\n• Zero-based combined Elo: FFA / pairwise start at 0; finish = mean placeScore × 100 (no 1000 baseline).\n• Lobby points (win): everyone +(N−1), winner +(N−1)+10.\n• Lobby points (Avg): everyone +(N−1)+Avg (techs/policies/cities).\n\nFilters\n• K — only for Elo FFA/pairwise inside the zero-based combined table.\n• Elimination penalty (−5 when alive=false) — only for the two Lobby points tables; off by default.',
      'rating.scaleLabel': 'Scale',
      'rating.scale1000': 'from 1000',
      'rating.scaleZero': 'from zero',
      'rating.scaleHint':
        'Inside the Rating tab: classic Elo (start 1000) or zero-based scale and lobby points. Stored in the browser.',
      'rating.toc': 'Rating sections',
      'rating.tocZero': 'Zero-based rating sections',
      'rating.combined': 'Combined rating',
      'rating.combinedHint':
        'Combined rating = arithmetic mean of FFA Elo, pairwise Elo, and finish-place rating.\n“Avg place” is the mean of the player’s ranks in those three tables (lower is better).\nPer-method places are shown so you can see where methods disagree.',
      'rating.ffa': 'FFA Elo (linear place)',
      'rating.ffaHint':
        'Same idea as Google Sheet ratingv2 (linear place).\n\nIn a lobby of N players, place i (0 = winner, N−1 = last) gives Actual = (N−1−i)/(N−1): winner = 1, last = 0, others spaced evenly.\n\nExpected for player A is the average classic Elo expectancy vs each opponent B:\nE(A,B) = 1 / (1 + 10^((Rb−Ra)/400)).\n\nUpdate after the game: Ra ← Ra + K × (Actual − Expected).\nLobby deltas need not sum to zero (this is not pairwise zero-sum).\nStart on this tab: 1000.',
      'rating.pairwise': 'Pairwise Elo',
      'rating.pairwiseHint':
        'Classic zero-sum FFA Elo via pairs.\n\nIn a lobby of N players there are C(N,2) = N(N−1)/2 virtual duels: each higher place “beats” each lower place.\nEach duel uses k_pair = K / C(N,2) so the total scale per game stays about K.\n\nFor pair (higher A, lower B):\nΔA = k_pair × (1 − E(A,B)),  ΔB = −ΔA,\nwhere E(A,B) = 1 / (1 + 10^((Rb−Ra)/400)).\n\nA player’s game delta is the sum over all pairs. Sum of rating changes in the lobby = 0.\nStart on this tab: 1000.',
      'rating.kLabel': 'K factor',
      'rating.kHint':
        'K controls how hard Elo moves after one game for FFA and pairwise on this tab (start 1000).\n• 20 — calmer, smaller swings.\n• 24 — default.\n• 32 — as in the old Google Sheet ratingv2, more reactive.\nFinish-place rating ignores K. Your choice is stored in the browser.',
      'rating.kHintZero':
        'K only affects Elo FFA / pairwise inside “Zero-based combined” (start 0).\nIt does not affect the finish part of that combined table or Lobby points. Shared with the “Rating from 1000” tab and stored in the browser.',
      'rating.elimLabel': 'Elimination penalty',
      'rating.elimOff': 'Off',
      'rating.elimOn': '−5',
      'rating.elimHint':
        'Only for “Lobby points (win)” and “Lobby points (Avg)”.\nWhen on: if alive=false (death / elimination in finale), subtract 5 from that game’s points.\nOff by default — eliminated players get the same participation points as living non-winners. Stored in the browser.',
      'rating.minGamesLabel': 'Minimum games',
      'rating.minGamesOff': 'All',
      'rating.minGamesOn': '≥5',
      'rating.minGamesHint':
        'Hide players with fewer counted games than the threshold in every rating table on both tabs.\nAll players shown by default. Place (#) is renumbered among visible rows. Stored in the browser.',
      'rating.finish': 'Finish-place rating',
      'rating.finishHint':
        'Not Elo — a finish-average mapped onto a ~1000 scale.\n\nEach game awards placeScore = (N−1−i)/(N−1) (1 = win … 0 = last).\navg = mean placeScore over the player’s counted games.\ntarget = 1000 + 400 × (avg − 0.5)\n(always 1st ≈ 1200, always last ≈ 800).\n\nBlend: w = min(1, games/8), R ← R×(1−w) + target×w — more games pull toward the long-run average.\nK does not affect this method.',
      'rating.zero': 'Zero-based rating',
      'rating.zeroCombined': 'Zero-based combined',
      'rating.zeroHint':
        'Mean of three methods without the 1000 starting constant.\n• FFA / pairwise Elo: start = 0. Same Expected formula and K.\n• Finish: mean placeScore × 100 (roughly 0…100), no target 1000±400 and no w = games/8 blend.\n• Combined = mean of the three zero-based numbers.\nPlace columns work like the classic combined table.',
      'rating.lobbyWin': 'Lobby points (win)',
      'rating.lobbyWinHint':
        'Cumulative zero-based rating (not Elo). N is the lobby size for that game.\n\nEach counted game awards:\n• every participant: +(N − 1)\n• the winner an extra: +10\n• underdog bonus: if the winner’s form (rating/games) is below opponents’, add the mean (opp_form − my_form) over stronger opponents.\n\nIf “Elimination penalty” is on: −5 when alive=false.\nElo K does not apply.',
      'rating.lobbyAvg': 'Lobby points (Avg)',
      'rating.lobbyAvgHint':
        'Cumulative zero-based rating: each game awards (N − 1) + Avg,\nwhere Avg is the mean of available techs / policies / cities from finale (Avg = 0 if none).\nThe winner also gets the underdog form bonus (rating/games), same as Lobby points (win).\n\nIf “Elimination penalty” is on: −5 when alive=false.\nNo flat +10 for winning. Elo K does not apply.',
      'rating.col.place': '#',
      'rating.col.player': 'Player',
      'rating.col.rating': 'Rating',
      'rating.col.perGame': 'Per game',
      'rating.col.games': 'Games',
      'rating.col.avgPlace': 'Avg place',
      'rating.col.pFfa': 'FFA place',
      'rating.col.pPair': 'Pair place',
      'rating.col.pFin': 'Finish place',
      'records.intro':
        'Records are computed from the archive on every load. Games flagged teams / scrap are ignored.',
      'records.toc': 'Records sections',
      'records.empty': 'No data for this section yet.',
      'records.section.glory': 'Glory',
      'records.section.war': 'War',
      'records.section.veteran': 'Veteran',
      'records.section.style': 'Style',
      'records.section.peaks': 'Finale peaks',
      'records.section.curious': 'Oddities',
      'records.item.most_wins.title': 'Most wins',
      'records.item.most_wins.flavor': 'Veni. Vidi. Vici.',
      'records.item.most_wins.body':
        '{player} leads in wins: {value} (across {games} counted games).',
      'records.item.best_winrate.title': 'Highest win rate',
      'records.item.best_winrate.flavor': 'Somebody stop him',
      'records.item.best_winrate.body':
        '{player} leads in win rate: {value} ({wins}/{games}).',
      'records.item.longest_win_streak.title': 'Win streak',
      'records.item.longest_win_streak.flavor': 'And again. And again.',
      'records.item.longest_win_streak.body':
        '{player} holds the longest consecutive win streak: {value}.',
      'records.item.longest_play_streak.title': 'Veteran',
      'records.item.longest_play_streak.flavor': 'Iron attendance',
      'records.item.longest_play_streak.body':
        '{player} holds the longest streak of consecutive games without a skip: {value} (of {games} counted).',
      'records.item.fastest_win.title': 'Fastest win',
      'records.item.fastest_win.flavor': 'Blitzkrieg',
      'records.item.fastest_win.body':
        '{player} finished Game {game} on turn {value}.',
      'records.item.slowest_win.title': 'Longest win',
      'records.item.slowest_win.flavor': 'The path belongs to those who walk',
      'records.item.slowest_win.body':
        '{player} finally closed Game {game} on turn {value}.',
      'records.item.most_achievements.title': 'Most decorated',
      'records.item.most_achievements.flavor': 'Whose general is this?',
      'records.item.most_achievements.body':
        '{player} holds the most Iron League records at once: {value}. The medal rack is running out of space.',
      'records.item.wins_all_with_caps.title': 'Trophy wins only',
      'records.item.wins_all_with_caps.flavor': 'No crown without capitals',
      'records.item.wins_all_with_caps.body':
        'All of {player}’s {value} wins came with at least one captured capital.',
      'records.item.most_caps_single_win.title': 'Single-game capital haul',
      'records.item.most_caps_single_win.flavor': 'One turn, an empire',
      'records.item.most_caps_single_win.body':
        '{player} took the most capitals in one win (Game {game}): {value}.',
      'records.item.most_caps.title': 'Capital hunter',
      'records.item.most_caps.flavor': 'The map got repainted',
      'records.item.most_caps.body':
        '{player} captured the most capitals in total: {value}.',
      'records.item.most_wars_declared.title': 'War hawk',
      'records.item.most_wars_declared.flavor': 'Spartan diplomacy',
      'records.item.most_wars_declared.body':
        '{player} declared the most wars on living players: {value} (finale data).',
      'records.item.most_wars_received.title': 'Bait',
      'records.item.most_wars_received.flavor': 'What am I to you?',
      'records.item.most_wars_received.body':
        '{player} had the most wars declared on them: {value}.',
      'records.item.zeus_statue_win.title': 'Build the Statue of Zeus and win',
      'records.item.zeus_statue_win.flavor': 'Olympic contract',
      'records.item.zeus_statue_win.body':
        '{player} won a game after building the Statue of Zeus (Game {game}).',
      'records.item.zeus_statue_win.bodyVacant':
        'Unclaimed so far: no archive win with a self-built Statue of Zeus. The thunder still waits.',
      'records.vacantPlayer': 'Nobody yet',
      'records.item.most_military_deaths.title': 'Meat grinder',
      'records.item.most_military_deaths.flavor': 'Meat grinder',
      'records.item.most_military_deaths.body':
        '{player} lost the most military units: {value}.',
      'records.item.fewest_military_deaths.title': 'Careful commander',
      'records.item.fewest_military_deaths.flavor': 'Units are precious',
      'records.item.fewest_military_deaths.body':
        '{player} lost the fewest combat units among players with data in at least 5 games: {value} losses over {games} games.',
      'records.item.piety_first_count.title': "Jehovah's Witness",
      'records.item.piety_first_count.flavor': 'Amen.',
      'records.item.piety_first_count.body':
        '{player} opened Piety first most often: {value} time(s).',
      'records.item.piety_first_streak.title': 'Lived in the woods, prayed to a wheel',
      'records.item.piety_first_streak.flavor': 'Amen. Again.',
      'records.item.piety_first_streak.body':
        '{player} holds the longest streak of games opening Piety first: {value}.',
      'records.item.tradition_first_count.title': 'Tradition devotee',
      'records.item.tradition_first_count.flavor': 'Old-school classic',
      'records.item.tradition_first_count.body':
        '{player} opened Tradition first most often: {value} time(s).',
      'records.item.liberty_first_count.title': 'Liberty devotee',
      'records.item.liberty_first_count.flavor': 'Will to expand',
      'records.item.liberty_first_count.body':
        '{player} opened Liberty first most often: {value} time(s).',
      'records.item.honor_first_count.title': 'Honor devotee',
      'records.item.honor_first_count.flavor': 'Honor above all',
      'records.item.honor_first_count.body':
        '{player} opened Honor first most often: {value} time(s).',
      'records.item.ideology_order_count.title': 'Order adherent',
      'records.item.ideology_order_count.flavor': 'Order above all',
      'records.item.ideology_order_count.body':
        '{player} adopted Order most often: {value} time(s).',
      'records.item.ideology_freedom_count.title': 'Freedom adherent',
      'records.item.ideology_freedom_count.flavor': 'Freedom or freedom',
      'records.item.ideology_freedom_count.body':
        '{player} adopted Freedom most often: {value} time(s).',
      'records.item.ideology_autocracy_count.title': 'Autocrat',
      'records.item.ideology_autocracy_count.flavor': 'L\'état, c\'est moi',
      'records.item.ideology_autocracy_count.body':
        '{player} adopted Autocracy most often: {value} time(s).',
      'records.item.most_wonders_built.title': 'Wonder builder',
      'records.item.most_wonders_built.flavor': 'Pyramid complex',
      'records.item.most_wonders_built.body':
        '{player} self-built the most world wonders: {value}.',
      'records.item.most_wonders_owned.title': 'Wonder collector',
      'records.item.most_wonders_owned.flavor': 'Open-air museum',
      'records.item.most_wonders_owned.body':
        '{player} owned the most wonders in total (built + captured): {value}.',
      'records.item.most_unique_nations.title': 'Nation tourist',
      'records.item.most_unique_nations.flavor': 'Passport office',
      'records.item.most_unique_nations.body':
        '{player} played the most different nations: {value} (across {games} games).',
      'records.item.most_games_no_win.title': 'Long road to the throne',
      'records.item.most_games_no_win.flavor': 'So close, yet so far',
      'records.item.most_games_no_win.body':
        '{player} played the most games without a win: {value}.',
      'records.item.never_eliminated.title': 'Never eliminated',
      'records.item.never_eliminated.flavor': 'Always made it',
      'records.item.never_eliminated.body':
        '{player} was never eliminated in finale ({value} games with finale data).',
      'records.item.pacifist_games.title': 'Paper pacifist',
      'records.item.pacifist_games.flavor': 'Dove of peace',
      'records.item.pacifist_games.body':
        '{player} has the most games with zero wars declared on living players (wars_declared=0): {value}.',
      'records.item.survived_no_capital.title': 'Alive without a capital',
      'records.item.survived_no_capital.flavor': 'Capital? What capital?',
      'records.item.survived_no_capital.body':
        '{player} most often reached finale already without a capital: {value} time(s).',
      'records.item.max_score_finale.title': 'Score peak',
      'records.item.max_score_finale.flavor': 'Scoreboard broke',
      'records.item.max_score_finale.body':
        '{player} posted the highest finale score: {value} (Game {game}).',
      'records.item.max_cities_finale.title': 'City empire',
      'records.item.max_cities_finale.flavor': 'Tripped over a city',
      'records.item.max_cities_finale.body':
        '{player} held the most cities in one finale: {value} (Game {game}).',
      'records.item.max_units_finale.title': 'Finale army',
      'records.item.max_units_finale.flavor': 'Shadow of an empire',
      'records.item.max_units_finale.body':
        '{player} fielded the most units in one finale: {value} (Game {game}).',
      'records.item.max_techs_finale.title': 'Tech peak',
      'records.item.max_techs_finale.flavor': 'Fully researched',
      'records.item.max_techs_finale.body':
        '{player} had the most techs in one finale: {value} (Game {game}).',
      'tier.title': 'Nation tier list',
      'tier.col.nation': 'Nation',
      'tier.col.avg': 'Average',
      'tier.source': 'Source: {link}',
      'tier.legend.5': 'Overpowered / Ban Worthy',
      'tier.legend.4': 'Strong',
      'tier.legend.3': 'Average',
      'tier.legend.2': 'Bad',
      'tier.legend.1': 'Bottom',
      'faq.source': 'Source: {link}',
      'force.label': 'Strength',
      'force.hint': 'units / power',
      'backTop': 'Top',
      'lang.label': 'Language',
    },
  };

  let lang = 'ru';

  function getLang() {
    return lang;
  }

  function t(key, vars) {
    const pack = I18N[lang] || I18N.ru;
    let text = pack[key] || I18N.ru[key] || key;
    if (vars && typeof vars === 'object') {
      Object.keys(vars).forEach((k) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]));
      });
    }
    return text;
  }

  function translateTerm(name) {
    if (name == null || name === '') return name;
    const raw = String(name).trim();
    if (!raw) return name;
    if (lang === 'en') {
      return TERM_EN[raw] || raw;
    }
    // RU UI: beliefs are often English in Games.json — show mod/in-game Russian.
    return BELIEF_RU[raw] || raw;
  }

  /** @deprecated use translateTerm */
  function translatePolicy(name) {
    return translateTerm(name);
  }

  function translateSpaceship(name) {
    if (name == null || name === '') return name;
    if (lang === 'en') return name;
    return SPACESHIP_RU[name] || name;
  }

  function setLang(next) {
    lang = next === 'en' ? 'en' : 'ru';
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) { /* ignore */ }
    document.documentElement.lang = lang;
    document.title = t('title.doc');
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) el.setAttribute('placeholder', t(key));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria');
      if (key) el.setAttribute('aria-label', t(key));
    });
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    if (typeof global.onIronLeagueLangChange === 'function') {
      global.onIronLeagueLangChange(lang);
    }
  }

  function initLang() {
    let saved = 'ru';
    try {
      saved = localStorage.getItem(STORAGE_KEY) || 'ru';
    } catch (e) { /* ignore */ }
    setLang(saved);
  }

  global.IronLeagueI18n = {
    t,
    getLang,
    setLang,
    initLang,
    translatePolicy,
    translateTerm,
    translateSpaceship,
    translateMap,
    canonicalizeMap,
    TERM_EN,
    POLICY_EN: TERM_EN,
  };
})(typeof window !== 'undefined' ? window : globalThis);
