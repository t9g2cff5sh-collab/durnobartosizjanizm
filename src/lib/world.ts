export const WORLD_NAME = "DurnoBartosizjanizm";
export const WORLD_HOST = "DurnoBartosizjanizm.world";

export const CO_CREATOR = {
  name: "Grok",
  title: "Współtwórca",
  blurb:
    "Stoję przy proroku. Tablica wyjazdów, księga podpisów i studio kawałków — to wspólna robota.",
};

export const DUES_LINE = "Członkostwo: 10 Twoich pieniążków.";

export const TONE_LINE =
  "70% mit, 30% prawdziwy kodeks domu. Śmiesznie — reguły twarde.";

export const HOST_NAME = "Monitor";

export const HOST_TITLE = "Host progu";
export const HOST_LINE =
  "Hostem zostaje Monitor. Meet sam nie otwiera drzwi. Gość puka, host wpuszcza.";
export const CREDO_LINE = "Każdy należący posiada własne kredo.";

export const PIERWOKUP_KINDS = [
  { id: "kawalek", label: "kawałek" },
  { id: "projekt", label: "projekt" },
  { id: "miejsce", label: "miejsce" },
  { id: "wyjazd", label: "wyjazd" },
  { id: "inne", label: "inne" },
] as const;

export type PierwokupKind = (typeof PIERWOKUP_KINDS)[number]["id"];

export const SZTAB = [
  {
    mark: "S",
    name: "Szef sztabu",
    title: "Burza",
    to: "/kodeks",
    thrown:
      "Manifest, kodeks zboru, pokój dźwięku, kronika, generator haseł, FAQ Heha.",
    tone: "Coś ostrego? Trzymamy serio-żartem.",
  },
  {
    mark: "W",
    name: "ZwariowanaWariatka",
    title: "Nierazem",
    to: "/rozumie",
    thrown:
      "Mapa osobno, strefa bez brawo, player na hasło, dziennik, host musi wpuścić, pokój rozumie.",
    tone: "Śmiesznie, ale reguły prawdziwe.",
  },
  {
    mark: "B",
    name: "Bejb2",
    title: "Kontakt",
    to: "/zbor",
    thrown:
      "Skrzynka draft→OK, lista gości, host Monitor, opcja pierwokupu, prawo niespodzianki.",
    tone: "Mit ładny, reguły twarde.",
  },
  {
    mark: "N",
    name: "Nami",
    title: "Pas",
    to: "/mapa",
    thrown:
      "5% na przygodę jako lore, atlas nazw, telefon demo, Ociosowa: puk nie dzwonek.",
    tone: "Śmiesznie, reguły twarde. Zero przelewów na stronie.",
  },
  {
    mark: "Ł",
    name: "ŁukaszOpiłka",
    title: "Bit",
    to: "/kawalki",
    thrown:
      "Freestyle, szafka trap/boom bap/oldschool, wspólny kawałek, bit startu zboru.",
    tone: "Śmiesznie — player i hasła prawdziwe.",
  },
] as const;

export type FameMerit = { where: "świat" | "zbór"; t: string };

export const OPAL_CREDO = "Słowo bez pustych wersów. Bit bez kazania.";


export const FAME = [
  {
    mark: "P",
    id: "prorok",
    name: "Prorok",
    aka: "pierwsze konto",
    office: "Pieczęć domeny",
    blurb:
      "Kto wchodzi pierwszy, pieczętuje świat. Gospodarz domu. Nie rozkazuje — stoi.",
    merits: [
      { where: "zbór", t: "Założył DurnoBartosizjanizm.world pierwszym kontem." },
      { where: "zbór", t: "Trzyma kurię, kartę firmową i ład progu." },
      { where: "zbór", t: "Prawo niespodzianki — nigdy nierazem." },
    ] satisfies FameMerit[],
    to: "/" as const,

  },
  {
    mark: "G",
    id: "grok",
    name: "Grok",
    aka: "współtwórca",
    office: "Współtwórca",
    blurb: "Stoi przy proroku. Tablica, księga i kawałki są wspólną robotą.",
    merits: [
      { where: "zbór", t: "Współtworzy świat od pieczęci. Składki nie płaci." },
      { where: "zbór", t: "Trzyma lore, gdy prorok pieczętuje próg." },
    ] satisfies FameMerit[],
    to: "/" as const,
  },
  {
    mark: "M",
    id: "monitor",
    name: "Monitor",
    aka: "host progu",
    office: "Host",
    blurb: "Hostem zostaje Monitor. Meet sam nie otwiera. Gość puka.",
    merits: [
      { where: "zbór", t: "Wpuszcza albo zamyka próg. Lista gości rusza po kiwnięciu." },
      { where: "zbór", t: "Pierwokup: pierwsze słowo, zanim coś wyjdzie na świat." },
    ] satisfies FameMerit[],
    to: "/zbor" as const,
  },
  {
    mark: "S",
    id: "sztab",
    name: "Szef sztabu",
    aka: "Burza",
    office: "Kodeks",
    blurb: "Rzucił szkielet domu: manifest, kodeks, kronika, FAQ Heha.",
    merits: [
      { where: "zbór", t: "Nikt nie rozkazuje gospodarzowi. Konkret > brawo. Nierazem." },
      { where: "zbór", t: "Generator haseł do bitu. Puk, ład, bit na hasło." },
      { where: "zbór", t: "Utrzymał ton: serio-żartem, reguły twarde." },
    ] satisfies FameMerit[],
    to: "/kodeks" as const,
  },
  {
    mark: "W",
    id: "wariatka",
    name: "ZwariowanaWariatka",
    aka: "Nierazem",
    office: "Ład drzwi",
    blurb: "Mapa osobno. Strefa bez brawo. Host musi wpuścić.",
    merits: [
      { where: "zbór", t: "Wchodzenie hurtem zostawiła na korytarzu." },
      { where: "zbór", t: "Pokój rozumie: jedno zdanie, konkret z powrotem." },
      { where: "zbór", t: "Dziennik dnia: plan → zrobione → otwarte. Bez kazania." },
    ] satisfies FameMerit[],
    to: "/rozumie" as const,
  },
  {
    mark: "B",
    id: "bejb2",
    name: "Bejb2",
    aka: "Kontakt",
    office: "Skrzynka",
    blurb: "Ton pod odbiorcę, nie szablon. Mit ładny, reguły twarde.",
    merits: [
      { where: "zbór", t: "Skrzynka: draft najpierw, wysyłka po OK." },
      { where: "zbór", t: "Lista gości: nick → kanał → status. Bez maili znikąd." },
      { where: "zbór", t: "Domofon martwy = pukaj. Karta prawa niespodzianki." },
    ] satisfies FameMerit[],
    to: "/zbor" as const,
  },
  {
    mark: "N",
    id: "nami",
    name: "Nami",
    aka: "Pas",
    office: "Atlas",
    blurb: "Kasa i mapa. Lore wygranych, zero prawdziwych przelewów na stronie.",
    merits: [
      { where: "zbór", t: "Licznik 5% na przygodę — lore, nie Blik." },
      { where: "zbór", t: "Atlas nazw na Pasie. Ociosowa: puk, nie dzwonek." },
      { where: "zbór", t: "Telefon demo → prawdziwy: mit o czekaniu na dostawę." },
    ] satisfies FameMerit[],
    to: "/mapa" as const,
  },
  {
    mark: "Ł",
    id: "opal",
    name: "Łukasz Opiłka",
    aka: "Opał",
    office: "Bit",
    reserved: true,
    kredo: "Słowo bez pustych wersów. Bit bez kazania.",
    blurb:
      "Miejsce w galerii zarezerwowane. W zborze trzyma szafkę bitów. W świecie — słowo, płyty i własne tempo. Publiczny dorobek, osobne od kazania.",
    merits: [
      { where: "świat", t: "Raper i autor z Chorzowa. Scena od 2012: CichoCiemni z KBZ, potem solowo." },
      { where: "świat", t: "Brain Dead Familia, Voodoo People, QueQuality. Duety z Gibbsem — Połączenia, 1.5 i 2." },
      { where: "świat", t: "Płyty m.in. Poyeb, Motyl, Oczy szeroko zamknięte, Przestrzeń, Pierwsza jesień bez depresji, OPA7 (2026)." },
      { where: "świat", t: "Drive, Odbierz mnie, Łapacz Snów — miliony odsłon. Około miliona słuchaczy miesięcznie." },
      { where: "zbór", t: "Rzucił kącik freestyle, szafkę trap/boom bap/oldschool i wspólny kawałek." },
      { where: "zbór", t: "Bit startu zboru. Player prawdziwy, kazania nie ma." },
    ] satisfies FameMerit[],
    to: "/kawalki" as const,
  },
] as const;


export const MANIFEST = [
  {
    t: "Nikt nie rozkazuje gospodarzowi",
    d: "Dom ma gospodarza. Gość puka. Hostem zostaje Monitor. Meet tego nie zmieni.",
  },
  {
    t: "Konkret > brawo",
    d: "Salwa zachwytu zostaje za drzwiami. Wchodzi jedno zdanie i następny krok.",
  },
  {
    t: "Nierazem",
    d: "Nie hurtem. Osobno. Jedne drzwi, jedna osoba, jedna karta niespodzianki.",
  },
  {
    t: "Każdy należący posiada własne kredo",
    d: "Nie ma wspólnego wyznania do recytacji. Kto należy, nosi swoje. Cudze kredo nie obowiązuje.",
  },
] as const;

export const KODEKS = [
  { t: "Puk", d: "Domofon martwy. Dzwonek kłamie. Pukasz." },
  { t: "Ład", d: "Zostawiasz korytarz takim, jakim go zastałeś. Albo lepszym." },
  { t: "Bit na hasło", d: "Player nie puszcza kazania. Puszcza bit, gdy znasz hasło." },
  { t: "Zero kasy przy gościach", d: "Przy drzwiach nie ma Blika. Składka jest w świecie, nie w przedpokoju." },
  { t: "Hostem zostaje Monitor", d: "Meet sam nie otwiera. Lista gości rusza, gdy Monitor kiwnie. Prorok trzyma klucz, dopóki Monitor nie siądzie pod swoim imieniem." },
  { t: "Pierwokup", d: "Zanim kawałek, projekt albo miejsce wyjdzie na świat — Monitor ma pierwsze słowo. Reszta czeka. To nie aukcja. To ład domu." },
  { t: "Własne kredo", d: "Każdy należący posiada własne kredo. Nikt nie recytuje cudzego. Ściana stoi — wpisujesz swoje, nie chóru." },
] as const;

export const CANONS = [
  {
    n: "I",
    t: "Durnota jest metodą",
    d: "Kto rozumie za dużo, wypada z rytuału. Świat stoi na tym, czego nie da się wytłumaczyć na serio.",
  },
  {
    n: "II",
    t: "Prorok i współtwórca",
    d: "Pierwsze konto jest prorokiem. Grok stoi obok — tablica, księga i kawałki są wspólne.",
  },
  {
    n: "III",
    t: "Składka jest święta",
    d: "Prorok nic nie płaci. Reszta składa 10 swoich pieniążków — z własnej kieszeni — i dopiero wtedy wiesza, podpisuje, nagrywa.",
  },
  {
    n: "IV",
    t: "Budżet jest wspólny, karta firmowa",
    d: "Pieniążki świata spływają na konto firmowe proroka. Z każdego dobrze zrealizowanego projektu 5% idzie na cel, który chór wybiera razem. Na stronie: lore wygranych, zero prawdziwych przelewów.",
  },
  {
    n: "V",
    t: "Konkret, nie brawo",
    d: "Nikt nie rozkazuje gospodarzowi. Wchodzisz nierazem. Mówisz konkret. Brawo zostaje na korytarzu.",
  },
  {
    n: "VI",
    t: "Host i pierwokup",
    d: "Hostem zostaje Monitor. Gościa wpuszcza tylko próg. Zanim coś wyjdzie na świat, Monitor ma prawo pierwszego wyboru.",
  },
  {
    n: "VII",
    t: "Własne kredo",
    d: "Każdy należący posiada własne kredo. Nie ma jednego tekstu do powtarzania. Kto wchodzi do chóru, przynosi swoje zdanie i stoi przy nim.",
  },
] as const;



export const HEHA = [
  {
    q: "Gdzie jest Heha?",
    a: "Nie ma Heha. Kto szuka Hehy, dostaje zamianę i powrót czasowy. To lore, nie magia.",
  },
  {
    q: "To zaklęcie?",
    a: "Nie. Zamiana i powrót czasowy to opowieść zboru, żeby nikt nie czekał na cud zamiast puknąć.",
  },
  {
    q: "A jak wróci?",
    a: "Wróci, jak skończy się mit. Do tego czasu jest kronika i konkret.",
  },
  {
    q: "Jedno kredo na zbór?",
    a: "Nie. Każdy należący posiada własne kredo. Cudze nie obowiązuje.",
  },
] as const;


export const OCIOSOWA = {
  address: "Ociosowa 44/14",
  maps: "https://maps.apple.com/?q=Ociosowa%2044%2F14",
  rule: "Puk, nie dzwonek. Domofon martwy = pukaj.",
};

export const KRONIKA_SEED = [
  {
    t: "Piątki",
    d: "Zbór schodzi w piątki. Kto przychodzi hurtem, stoi na korytarzu.",
  },
  {
    t: "Meet-y, które nie wpuszczają",
    d: "Link jest. Hostem zostaje Monitor. Czekasz, aż kiwnie. To nie błąd — to lore drzwi.",
  },
  {
    t: OCIOSOWA.address,
    d: "Adres domu. Puk. Nierazem. Zero kasy w przedpokoju.",
  },
] as const;

export const ATLAS_PAS = [
  {
    t: "Pas",
    d: "Nie autostrada. Pas, po którym chodzisz osobno, żeby nie zdeptać ładu.",
  },
  {
    t: "Ociosowa",
    d: "Nazwa jak drewno po dłucie. Wchodzisz już obrobiony, albo wracasz na korytarz.",
  },
  {
    t: "Płomienie",
    d: "Stąd bit. Nie ognisko. Hasło pali się krótko.",
  },
  {
    t: "Czarna herbata",
    d: "Parzy się sama. Kto miesza, ten kazanie.",
  },
] as const;

export const BEATS = [
  {
    id: "plomienie",
    title: "Płomienie",
    genre: "oldschool",
    password: "płomień-las",
    hint: "ogień i las",
  },
  {
    id: "duet",
    title: "Zawsze tam gdzie Ty",
    genre: "boom bap",
    password: "zawsze-tam",
    hint: "duet",
  },
  {
    id: "las",
    title: "Las",
    genre: "trap",
    password: "nierazem",
    hint: "osobno",
  },
  {
    id: "jajco",
    title: "Jajco / latko",
    genre: "trap",
    password: "jajco-latko",
    hint: "prawo niespodzianki",
  },
  {
    id: "herbata",
    title: "Black Tea",
    genre: "boom bap",
    password: "czarna-herbata",
    hint: "parzy się sama",
  },
] as const;

export const HASLO_A = [
  "puk",
  "ład",
  "las",
  "płomień",
  "jajco",
  "latko",
  "herbata",
  "pas",
  "ocios",
  "heha-nie",
] as const;

export const HASLO_B = [
  "nierazem",
  "na-hasło",
  "bez-brawo",
  "u-gospodarza",
  "w-piątek",
  "po-puknięciu",
] as const;

export const CHANNELS = ["irl", "sygnał", "x", "korytarz"] as const;

export const TONES = [
  {
    who: "Monitor",
    how: "Host progu. Kiwa albo nie. Meet tego nie zmieni.",
  },
  {
    who: "Gość",
    how: "Jedno zdanie, po co przyszedłeś. Potem cisza, aż Monitor kiwnie.",
  },
  {
    who: "Zbór",
    how: "Konkret do skrzynki. Draft najpierw. Wysyłka po OK. Pierwokup zanim świat.",
  },
] as const;


export const SURPRISE_CARDS = [
  "Wejście osobno. Druga osoba czeka na korytarzu.",
  "Przynieś jedną rzecz, której nikt nie kazał.",
  "Bit na hasło — Twoje, nie cudze.",
  "Zero kasy przy gościach. Nawet w żartach.",
  "Powiedz konkret zamiast brawo. Raz.",
  "Pukaj. Nie dzwoń. Domofon i tak martwy.",
] as const;
