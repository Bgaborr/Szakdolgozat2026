# A MÁV Csoport Vasúti Járműállományának Közösségi Adatbázisa

Dolgozatom célja egy vasútbarátoknak szóló hobbioldal létrehozása, amely a MÁV Csoport vasúti járműállományával kapcsolatos adatok megőrzésére és naprakészen tartására szolgál. Mivel a MÁV 2023 őszétől tíz évre titkosította ezeket az adatokat, az oldal az utolsó nyilvánosan elérhető adatokra épül, amelyeket önkéntes alapon frissítenénk és ellenőrzött módon karbantartanánk, elkerülve a téves információk terjedését.

Emellett egy ismeretterjesztő szekció is helyet kap, ahol az egyes járműtípusokról rövid leírások olvashatók.

## Fő funkciók

- **Járműnyilvántartás:** Mozdonyok, motorvonatok és személykocsik böngészése, keresése és részletes adatlapjainak megtekintése, 12 számjegyű UIC-pályaszám ellenőrzéssel
- **Szolgálati helyek:** Állomások és műhelyek listázása a hozzájuk tartozó járművek darabszámával
- **Közösségi javaslati rendszer:** Regisztrált felhasználók forrásmegjelöléssel küldhetnek be módosítási javaslatokat bármely járműkategóriához (polimorfikus adatbázis-kapcsolattal), amelyek elbírálás után kerülnek az éles adatbázisba
- **Közösségi képgaléria:** Képfeltöltés beépített 16:9 és 4:3 arányú képvágóval, szerveroldali validációval (JPEG/PNG, max. 10 MB, min. 600 px szélesség) és moderátori jóváhagyással
- **Vasúti Fogalomtár:** Témakörök szerint csoportosított, kereshető és szűrhető szakkifejezések
- **Statisztikai modul:** Chart.js alapú reszponzív diagramok (fővizsga-állapot, vontatási nemek, aktív/selejt arány, típuseloszlás, telephelyek)
- **Szerepkör-alapú jogosultságkezelés (RBAC):** Öttáblás modell (Látogató, Regisztrált felhasználó, Moderátor, Szerkesztő, Adminisztrátor, Főadminisztrátor) és külön adminisztrációs felület
- **Biztonságos hitelesítés és profilkezelés:** Süti-alapú SPA-hitelesítés (Laravel Sanctum, HttpOnly session cookie, CSRF-védelem, sikertelen belépések korlátozása), valamint választható megjelenítési téma (rendszer szerinti, világos, sötét)

## Használt technológiák

- **Frontend:** Angular, TypeScript, Sass (SCSS), Chart.js
- **Backend:** Laravel (PHP 8.4), Eloquent ORM, Laravel Sanctum
- **Adatbázis:** MySQL 8.4
- **Konténerizáció és kiszolgálás:** Docker, Docker Compose, Nginx (reverse proxy)
- **Tesztelés:** PHPUnit (backend Feature tesztek), Cypress (frontend E2E tesztek)
- **Verziókezelés:** Git / GitHub

## Telepítés

### 1. Projekt klónozása

```bash
git clone https://github.com/Bgaborr/Szakdolgozat2026.git
cd Szakdolgozat2026
```

### 2. Környezeti változók beállítása

Másold le a backend `.env.example` fájlját `.env` néven, és ellenőrizd az adatbázis-, valamint a Sanctum-beállításokat:

```bash
cp backend/.env.example backend/.env
```

### 3. Docker konténerek felépítése és indítása

A teljes környezet (Nginx, Angular frontend, Laravel backend, MySQL adatbázis) egyetlen Docker Compose konfigurációból indítható:

```bash
docker compose up -d --build
```

## Adatbázis beállítása

```bash
docker compose exec laravel php artisan key:generate
docker compose exec laravel php artisan migrate --seed
docker compose exec laravel php artisan storage:link
```

_(Ha a `docker-compose.yml` fájlban eltérő a backend szolgáltatás neve, a `backend` szót cseréld le arra.)_

## Alkalmazás elérése és működése

Sikeres indítás után az Nginx fordított proxy egyetlen címen szolgálja ki az alkalmazást (a `/api` kezdetű kéréseket a Laravel backendnek, minden mást az Angular frontendnek továbbítva):

- **Webalkalmazás:** `http://localhost`
- **API alapútvonal:** `http://localhost/api`

### Felhasználói folyamat

1. **Látogatóként** böngészhetők a mozdonyok, motorvonatok, személykocsik, a szolgálati helyek, a vasúti fogalomtár és a jóváhagyott galériaképek.
2. **Regisztráció és bejelentkezés után** elérhető a statisztikai oldal, a profil- és témabeállítás, valamint képek és járműadat-módosítási javaslatok küldhetők be.
3. **Moderátori, szerkesztői vagy adminisztrátori jogosultsággal** a Dashboardon keresztül kezelhetők a várakozó képek, a beküldött javaslatok, a járműtörzsadatok, a fogalomtár és a felhasználói szerepkörök.

## Tesztelés

### Backend tesztek (PHPUnit)

Az automatizált szerveroldali tesztek elkülönített tesztadatbázison (`RefreshDatabase`) és virtuális fájlrendszerrel (`Storage::fake()`) futnak:

```bash
docker compose exec backend php artisan test
```

### Frontend E2E tesztek (Cypress)

```bash
cd frontend
npx cypress run
```

_(Grafikus tesztfuttatóhoz: `npx cypress open`)_

## Fejlesztési cél

A projekt szakdolgozati munka keretében készült, és a jövőben további közösségi funkciókkal (például rendszernaplózással, élő spotting katalógussal és pontozási rendszerrel) bővíthető.

## Szerző

**Balla Gábor**  
Programtervező informatikus BSc  
Eszterházy Károly Katolikus Egyetem

## Témavezető

**Balla Tamás**  
Tanársegéd
