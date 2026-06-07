// src/i18n.ts

export type Language = 'en' | 'pl';

export type Translations = {
  appTitle: string;
  homeDescription: string;
  chooseGame: string;
  chooseBook: string;
  back: string;

  chooseGameHeading: string;
  chooseBookHeading: string;
  randomGame: string;
  noGames: string;

  searchBooksPlaceholder: string;
  filterButton: string;
  filterAuthorPlaceholder: string;
  filterYearPlaceholder: string;
  filterGenrePlaceholder: string;
  noBooksFiltered: string;

  columnTitle: string;
  columnAuthor: string;
  columnYear: string;

  completedChaptersLabel: string;
  startGameLabel: string;
  chooseChapterLabel: string;
  chapterLabel: string;
  startGameConfirmTitle: string;
  startGameConfirmMessage: string;
  startGameConfirmYes: string;
  startGameConfirmNo: string;

  progressNavLabel: string;
  progressHeading: string;
  chapterNotCompletedLabel: string;
  chapterScoreLabel: string;
  chapterMistakesLabel: string;
  chapterTimeLabel: string;

  puzzleHeading: string;
  puzzleInstruction: string;
  chooseWordsLabel: string;
  resetLabel: string;
  prevPuzzleLabel: string;
  nextPuzzleLabel: string;
  finishButtonLabel: string;
  needAnswerAllLabel: string;
  pauseLabel: string;
  resumeLabel: string;
  pauseMessageFallback: string;

  timeLeftLabel: string;
  puzzleOfLabel: string;

  finishEarlyTitle: string;
  finishEarlyMessage: string;
  finishEarlyConfirm: string;
  finishEarlyCancel: string;

  // Results screen
  resultsTitle: string;
  resultsSubtitle: string;
  finalScoreLabel: string;
  outOfPointsLabel: string;
  performanceBreakdownLabel: string;
  accuracyLabel: string;
  timeTakenLabel: string;
  mistakesLabel: string;
  pagesCompletedLabel: string;
  playAgainLabel: string;
  nextExtractLabel: string;
  backToLibraryLabel: string;

  // Spellcheck
  spellcheckHeading: string;
  spellcheckInstructions: string;
  spellcheckNeedSelectionLabel: string;
  spellcheckNoDataLabel: string;
  spellcheckPauseMessage: string;

  // Crossout
  crossoutHeading: string;
  crossoutInstructions: string;
  crossoutNeedSelectionLabel: string;
  crossoutNoDataLabel: string;
  crossoutPauseMessage: string;

  // Anagram
  anagramHeading: string;
  anagramInstructions: string;
  anagramNeedSelectionLabel: string;
  anagramNoDataLabel: string;
  anagramPauseMessage: string;

  // Switch
  switchHeading: string;
  switchInstructions: string;
  switchNeedSelectionLabel: string;
  switchNoDataLabel: string;
  switchPauseMessage: string;

  // Choice game
  choiceHeading: string;
  choiceInstructions: string;
  choiceNeedSelectionLabel: string;
  choiceNoDataLabel: string;
  choicePauseMessage: string;
  choiceOptionsTitle: string;
  choiceOptionsHint: string;

  cancelLabel: string;
  closeLabel: string;
  selectLabel: string;
  loadingLabel: string;
  noGameFallback: string;
  noBookFallback: string;
  noBookSelectedLabel: string;
  chooseBookContinueLabel: string;

  homeLead: string;
  homeReadyLabel: string;
  homeChooseBothLabel: string;
  gameModeEyebrow: string;
  bookEyebrow: string;
  changeGameModeLabel: string;
  chooseGameButtonLabel: string;
  changeBookLabel: string;
  chooseBookButtonLabel: string;
  homeFooterHint: string;
  homeSetupLabel: string;
  randomGameDescription: string;

  paginationPerPageLabel: string;
  paginationPrevLabel: string;
  paginationPageLabel: string;
  paginationNextLabel: string;
  chapterCompletedSuffix: string;
  filtersTitle: string;
  filtersAuthorsLabel: string;
  filtersGenresLabel: string;
  filtersPublicationYearLabel: string;
  filtersClearLabel: string;
  filtersApplyLabel: string;

  nickTitle: string;
  nickDescription: string;
  nickPlaceholder: string;
  nickSubmitLabel: string;
  nickCreatingLabel: string;
  nickConnectingLabel: string;
  nickEmptyError: string;
  nickTooLongError: string;
  nickCreateError: string;

  interruptGameTitle: string;
  interruptGameMessage: string;
  goToProgressLabel: string;

  progressCompletedChaptersLabel: string;
  progressSummaryLabel: string;
  progressAvgAccuracyLabel: string;
  progressAvgDurationLabel: string;
  progressMostPlayedLabel: string;
  progressReadingHeading: string;
  progressReadingDescription: string;
  progressColumnLabel: string;
  progressDetailsLabel: string;
  progressNoBooksLabel: string;

  resultTitleLow: string;
  resultTitleStart: string;
  resultTitleGood: string;
  resultTitleGreat: string;
  resultTitleExcellent: string;

  gameModeNotSelectedLabel: string;
  chooseGameModeToBeginLabel: string;
  gameModeSelectedLabel: string;
};

export const translations: Record<Language, Translations> = {
  en: {
    appTitle: 'Polish Literature Language Game',
    homeDescription: 'Choose a game or a book first. Once both are chosen, we will start a level.',
    chooseGame: 'Choose game',
    chooseBook: 'Choose book',
    back: 'Back',

    chooseGameHeading: 'Choose game',
    chooseBookHeading: 'Choose book',
    randomGame: 'Random game',
    noGames: 'No games available (mock).',

    searchBooksPlaceholder: 'Search literature works (min. 3 chars)...',
    filterButton: 'Filter',
    filterAuthorPlaceholder: 'Filter by author...',
    filterYearPlaceholder: 'Filter by year...',
    filterGenrePlaceholder: 'Filter by genre...',
    noBooksFiltered: 'No books matching criteria.',

    columnTitle: 'Title',
    columnAuthor: 'Author',
    columnYear: 'Year',

    completedChaptersLabel: 'Chapters completed',
    startGameLabel: 'Start game',
    chooseChapterLabel: 'Choose chapter',
    chapterLabel: 'Chapter',
    startGameConfirmTitle: 'Start over?',
    startGameConfirmMessage:
      'Are you sure you want to start from the beginning? This will remove your current progress.',
    startGameConfirmYes: 'Yes, start over',
    startGameConfirmNo: 'Cancel',

    progressNavLabel: 'Results',
    progressHeading: 'Results',
    chapterScoreLabel: 'Score',
    chapterMistakesLabel: 'Mistakes',
    chapterTimeLabel: 'Time',
    chapterNotCompletedLabel: 'Not completed yet',

    puzzleHeading: 'Fill in the missing words',
    puzzleInstruction: 'Drag the correct words from the pool and drop them into the matching gaps in the text.',
    chooseWordsLabel: 'Choose the correct words:',
    resetLabel: 'Reset',
    prevPuzzleLabel: 'Previous',
    nextPuzzleLabel: 'Next',
    finishButtonLabel: 'Finish level',
    needAnswerAllLabel: 'Fill all gaps in this puzzle to continue.',
    pauseLabel: 'Pause',
    resumeLabel: 'Resume',
    pauseMessageFallback: 'The game is paused. You can resume at any time.',

    timeLeftLabel: 'Time',
    puzzleOfLabel: 'Puzzle',

    finishEarlyTitle: 'Finish level?',
    finishEarlyMessage: 'You have not completed all puzzles. Do you really want to finish the game now?',
    finishEarlyConfirm: 'Yes, finish anyway',
    finishEarlyCancel: 'Continue playing',

    resultsTitle: 'Excellent work!',
    resultsSubtitle: "You've completed the exercise successfully.",
    finalScoreLabel: 'Final score',
    outOfPointsLabel: 'out of 100 points',
    performanceBreakdownLabel: 'Performance breakdown',
    accuracyLabel: 'Accuracy',
    timeTakenLabel: 'Time taken',
    mistakesLabel: 'Mistakes',
    pagesCompletedLabel: 'Pages completed',
    playAgainLabel: 'Play again',
    nextExtractLabel: 'Next extract',
    backToLibraryLabel: 'Back to library',

    spellcheckHeading: 'Find the words with mistakes',
    spellcheckInstructions: 'Click the words that contain typos or look incorrect.',
    spellcheckNeedSelectionLabel: 'Select at least one word before moving on.',
    spellcheckNoDataLabel: 'No data for this game.',
    spellcheckPauseMessage: 'The game is paused. Click "Resume" to continue.',

    crossoutHeading: 'Find the line that does not belong',
    crossoutInstructions: 'Click the line that should be crossed out from the text.',
    crossoutNeedSelectionLabel: 'Choose a line before moving on.',
    crossoutNoDataLabel: 'No data for this game.',
    crossoutPauseMessage: 'The game is paused. Click "Resume" to continue.',

    anagramHeading: 'Find the anagrams in the text',
    anagramInstructions: 'Click the words that are anagrams of correct words in the poem.',
    anagramNeedSelectionLabel: 'Select at least one word before moving on.',
    anagramNoDataLabel: 'No data for this game.',
    anagramPauseMessage: 'The game is paused. Click "Resume" to continue.',

    switchHeading: 'Find the swapped word pairs',
    switchInstructions: 'Click two neighbouring words that have been swapped. You can mark up to three pairs.',
    switchNeedSelectionLabel: 'Select at least one pair before moving on.',
    switchNoDataLabel: 'No data for this game.',
    switchPauseMessage: 'The game is paused. Click "Resume" to continue.',

    choiceHeading: 'Choose the correct word for each gap',
    choiceInstructions: 'Click a gap and then pick the correct word from the three options.',
    choiceNeedSelectionLabel: 'Answer all gaps before moving on.',
    choiceNoDataLabel: 'No data for this game.',
    choicePauseMessage: 'The game is paused. Click "Resume" to continue.',
    choiceOptionsTitle: 'Choose an option',
    choiceOptionsHint: 'Click a gap to see options.',

    cancelLabel: 'Cancel',
    closeLabel: 'Close',
    selectLabel: 'Select',
    loadingLabel: 'Loading…',
    noGameFallback: 'No game',
    noBookFallback: 'No book',
    noBookSelectedLabel: 'No book selected',
    chooseBookContinueLabel: 'Choose a book to continue.',

    homeLead: 'Choose a game mode and a book to begin.',
    homeReadyLabel: 'Both selected to start',
    homeChooseBothLabel: 'Choose both to start',
    gameModeEyebrow: 'Game mode',
    bookEyebrow: 'Book',
    changeGameModeLabel: 'Change game mode',
    chooseGameButtonLabel: 'Choose game',
    changeBookLabel: 'Change book',
    chooseBookButtonLabel: 'Choose book',
    homeFooterHint: 'You can change your choices anytime before starting.',
    homeSetupLabel: 'Your setup',
    randomGameDescription: 'Randomly pick one of the available games.',

    paginationPerPageLabel: 'Per page:',
    paginationPrevLabel: 'Prev',
    paginationPageLabel: 'Page',
    paginationNextLabel: 'Next',
    chapterCompletedSuffix: 'completed',
    filtersTitle: 'Filters',
    filtersAuthorsLabel: 'Authors',
    filtersGenresLabel: 'Genres',
    filtersPublicationYearLabel: 'Publication year',
    filtersClearLabel: 'Clear filters',
    filtersApplyLabel: 'Apply',

    nickTitle: "Hey, What's your name?",
    nickDescription: 'This helps us personalize your results.',
    nickPlaceholder: 'Enter your name…',
    nickSubmitLabel: "Let's go",
    nickCreatingLabel: 'Creating session…',
    nickConnectingLabel: 'Connecting…',
    nickEmptyError: 'Please enter your name.',
    nickTooLongError: 'Max 50 characters.',
    nickCreateError: 'Failed to create session.',

    interruptGameTitle: 'Interrupt current game?',
    interruptGameMessage: 'The current game will be stopped and your in-progress state for this round will be lost.',
    goToProgressLabel: 'Go to progress',

    progressCompletedChaptersLabel: 'Chapters completed',
    progressSummaryLabel: 'Summary',
    progressAvgAccuracyLabel: 'Avg accuracy',
    progressAvgDurationLabel: 'Avg duration',
    progressMostPlayedLabel: 'Most played',
    progressReadingHeading: 'Your Reading Progress',
    progressReadingDescription: 'Check your completed chapters, scores, time, and summary for each book.',
    progressColumnLabel: 'Progress',
    progressDetailsLabel: 'Details',
    progressNoBooksLabel: 'No books to display.',

    resultTitleLow: "Don't give up!",
    resultTitleStart: 'Good start!',
    resultTitleGood: 'Good job!',
    resultTitleGreat: 'Excellent work!',
    resultTitleExcellent: 'Amazing work!',

    gameModeNotSelectedLabel: 'No game selected',
    chooseGameModeToBeginLabel: 'Choose a game mode to begin.',
    gameModeSelectedLabel: 'Game mode selected.',
  },

  pl: {
    appTitle: 'Polish Literature Language Game',
    homeDescription: 'Najpierw wybierz grę albo książkę. Gdy wybierzesz oba, uruchomimy poziom.',
    chooseGame: 'Wybierz grę',
    chooseBook: 'Wybierz książkę',
    back: 'Wstecz',

    chooseGameHeading: 'Wybierz grę',
    chooseBookHeading: 'Wybierz książkę',
    randomGame: 'Losowa gra',
    noGames: 'Brak dostępnych gier (mock).',

    searchBooksPlaceholder: 'Szukaj dzieł (min. 3 znaki)...',
    filterButton: 'Filtry',
    filterAuthorPlaceholder: 'Filtruj po autorze...',
    filterYearPlaceholder: 'Filtruj po roku...',
    filterGenrePlaceholder: 'Filtruj po gatunku...',
    noBooksFiltered: 'Brak książek spełniających kryteria.',

    columnTitle: 'Tytuł',
    columnAuthor: 'Autor',
    columnYear: 'Rok',

    completedChaptersLabel: 'Ukończone rozdziały',
    startGameLabel: 'Rozpocznij grę',
    chooseChapterLabel: 'Wybierz rozdział',
    chapterLabel: 'Rozdział',
    startGameConfirmTitle: 'Rozpocząć od nowa?',
    startGameConfirmMessage: 'Czy na pewno chcesz rozpocząć od nowa? Usunie to obecny postęp.',
    startGameConfirmYes: 'Tak, rozpocznij od nowa',
    startGameConfirmNo: 'Anuluj',

    progressNavLabel: 'Wyniki',
    progressHeading: 'Wyniki',
    chapterScoreLabel: 'Wynik',
    chapterMistakesLabel: 'Błędy',
    chapterTimeLabel: 'Czas',
    chapterNotCompletedLabel: 'Jeszcze nieukończony',

    puzzleHeading: 'Uzupełnij brakujące słowa',
    puzzleInstruction: 'Przeciągnij odpowiednie słowa z puli i upuść je w pasujących lukach w tekście.',
    chooseWordsLabel: 'Wybierz właściwe słowa:',
    resetLabel: 'Reset',
    prevPuzzleLabel: 'Poprzednie',
    nextPuzzleLabel: 'Następne',
    finishButtonLabel: 'Zakończ poziom',
    needAnswerAllLabel: 'Uzupełnij wszystkie luki w tym zadaniu, aby przejść dalej.',
    pauseLabel: 'Pauza',
    resumeLabel: 'Wznów',
    pauseMessageFallback: 'Gra jest wstrzymana. Możesz w każdej chwili wznowić.',

    timeLeftLabel: 'Czas',
    puzzleOfLabel: 'Zadanie',

    finishEarlyTitle: 'Zakończyć poziom?',
    finishEarlyMessage: 'Nie ukończyłeś wszystkich zadań. Czy na pewno chcesz teraz zakończyć grę?',
    finishEarlyConfirm: 'Tak, zakończ mimo to',
    finishEarlyCancel: 'Kontynuuj grę',

    resultsTitle: 'Świetna robota!',
    resultsSubtitle: 'Pomyślnie ukończyłeś ćwiczenie.',
    finalScoreLabel: 'Wynik końcowy',
    outOfPointsLabel: 'na 100 punktów',
    performanceBreakdownLabel: 'Podsumowanie wyniku',
    accuracyLabel: 'Dokładność',
    timeTakenLabel: 'Czas trwania',
    mistakesLabel: 'Pomyłki',
    pagesCompletedLabel: 'Strony ukończone',
    playAgainLabel: 'Zagraj ponownie',
    nextExtractLabel: 'Następny fragment',
    backToLibraryLabel: 'Powrót do biblioteki',

    spellcheckHeading: 'Znajdź słowa z błędami',
    spellcheckInstructions: 'Kliknij słowa, które zawierają literówki lub wyglądają niepoprawnie.',
    spellcheckNeedSelectionLabel: 'Zaznacz przynajmniej jedno słowo przed przejściem dalej.',
    spellcheckNoDataLabel: 'Brak danych do gry.',
    spellcheckPauseMessage: 'Gra jest wstrzymana. Kliknij „Wznów”, aby kontynuować.',

    crossoutHeading: 'Znajdź linijkę, która nie pasuje',
    crossoutInstructions: 'Kliknij linijkę, którą należy skreślić z tekstu.',
    crossoutNeedSelectionLabel: 'Wybierz linijkę przed przejściem dalej.',
    crossoutNoDataLabel: 'Brak danych do tej gry.',
    crossoutPauseMessage: 'Gra jest wstrzymana. Kliknij „Wznów”, aby kontynuować.',

    anagramHeading: 'Znajdź anagramy w tekście',
    anagramInstructions: 'Kliknij słowa, które są anagramami poprawnych wyrazów w wierszu.',
    anagramNeedSelectionLabel: 'Zaznacz przynajmniej jedno słowo przed przejściem dalej.',
    anagramNoDataLabel: 'Brak danych do tej gry.',
    anagramPauseMessage: 'Gra jest wstrzymana. Kliknij „Wznów”, aby kontynuować.',

    switchHeading: 'Znajdź zamienione pary słów',
    switchInstructions:
      'Kliknij dwie sąsiadujące ze sobą wyrazy, które zostały zamienione miejscami. Możesz zaznaczyć maksymalnie trzy pary.',
    switchNeedSelectionLabel: 'Zaznacz przynajmniej jedną parę przed przejściem dalej.',
    switchNoDataLabel: 'Brak danych do tej gry.',
    switchPauseMessage: 'Gra jest wstrzymana. Kliknij „Wznów”, aby kontynuować.',

    choiceHeading: 'Wybierz poprawne słowo do każdej luki',
    choiceInstructions: 'Kliknij lukę, a następnie wybierz poprawne słowo z trzech możliwości.',
    choiceNeedSelectionLabel: 'Uzupełnij wszystkie luki przed przejściem dalej.',
    choiceNoDataLabel: 'Brak danych do tej gry.',
    choicePauseMessage: 'Gra jest wstrzymana. Kliknij „Wznów”, aby kontynuować.',
    choiceOptionsTitle: 'Wybierz opcję',
    choiceOptionsHint: 'Kliknij lukę, aby zobaczyć opcje.',

    cancelLabel: 'Anuluj',
    closeLabel: 'Zamknij',
    selectLabel: 'Wybierz',
    loadingLabel: 'Ładowanie…',
    noGameFallback: 'Brak gry',
    noBookFallback: 'Brak książki',
    noBookSelectedLabel: 'Nie wybrano książki',
    chooseBookContinueLabel: 'Wybierz książkę, aby kontynuować.',

    homeLead: 'Wybierz tryb gry i książkę, aby rozpocząć.',
    homeReadyLabel: 'Gotowe do startu',
    homeChooseBothLabel: 'Wybierz grę i książkę',
    gameModeEyebrow: 'Tryb gry',
    bookEyebrow: 'Książka',
    changeGameModeLabel: 'Zmień tryb gry',
    chooseGameButtonLabel: 'Wybierz grę',
    changeBookLabel: 'Zmień książkę',
    chooseBookButtonLabel: 'Wybierz książkę',
    homeFooterHint: 'Możesz zmienić swój wybór w dowolnym momencie przed rozpoczęciem.',
    homeSetupLabel: 'Twój wybór',
    randomGameDescription: 'Wybierz losowo jedną z dostępnych gier.',

    paginationPerPageLabel: 'Na stronę:',
    paginationPrevLabel: 'Poprzednia',
    paginationPageLabel: 'Strona',
    paginationNextLabel: 'Następna',
    chapterCompletedSuffix: 'ukończony',
    filtersTitle: 'Filtry',
    filtersAuthorsLabel: 'Autorzy',
    filtersGenresLabel: 'Gatunki',
    filtersPublicationYearLabel: 'Rok wydania',
    filtersClearLabel: 'Usuń filtry',
    filtersApplyLabel: 'Filtruj',

    nickTitle: 'Hej, jak masz na imię?',
    nickDescription: 'To pomoże nam spersonalizować Twoje wyniki.',
    nickPlaceholder: 'Wpisz imię…',
    nickSubmitLabel: 'Zaczynamy',
    nickCreatingLabel: 'Tworzenie sesji…',
    nickConnectingLabel: 'Łączenie…',
    nickEmptyError: 'Podaj imię.',
    nickTooLongError: 'Maksymalnie 50 znaków.',
    nickCreateError: 'Nie udało się utworzyć sesji.',

    interruptGameTitle: 'Przerwać aktualną grę?',
    interruptGameMessage: 'Gra zostanie przerwana, a obecny postęp w tej rundzie zostanie utracony.',
    goToProgressLabel: 'Przejdź do postępu',

    progressCompletedChaptersLabel: 'Ukończone rozdziały',
    progressSummaryLabel: 'Podsumowanie',
    progressAvgAccuracyLabel: 'Śr. dokładność',
    progressAvgDurationLabel: 'Śr. czas',
    progressMostPlayedLabel: 'Najczęstsza gra',
    progressReadingHeading: 'Twój postęp czytania',
    progressReadingDescription: 'Sprawdź ukończone rozdziały, wyniki, czas oraz podsumowanie każdej książki.',
    progressColumnLabel: 'Postęp',
    progressDetailsLabel: 'Szczegóły',
    progressNoBooksLabel: 'Brak książek do wyświetlenia.',

    resultTitleLow: 'Nie poddawaj się!',
    resultTitleStart: 'Dobry początek!',
    resultTitleGood: 'Dobra robota!',
    resultTitleGreat: 'Świetna robota!',
    resultTitleExcellent: 'Brawo!',

    gameModeNotSelectedLabel: 'Nie wybrano gry',
    chooseGameModeToBeginLabel: 'Wybierz tryb gry, aby rozpocząć.',
    gameModeSelectedLabel: 'Wybrano tryb gry.',
  },
};
