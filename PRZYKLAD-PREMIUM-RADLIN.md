# Przykład wdrożenia — Dom Przyjęć PREMIUM, Radlin

`index.html` oraz `premium.css` to kompletna, statyczna implementacja przykładowa dla Domu Przyjęć PREMIUM. Jest celowo niezależna od automatyzacji: nie zbiera formularzy, nie tworzy rezerwacji i nie wysyła danych do n8n.

## Co wykorzystano

- Fakty biznesowe z publicznej witryny: duża sala do 200 osób, kameralna sala do 50 osób, ogród dla ceremonii, pokoje dla gości oraz oferta wesel, przyjęć rodzinnych i wydarzeń firmowych.
- Kierunek komunikacji z opinii: kuchnia, sprawna i pomocna obsługa, komfort sal oraz otoczenie są przedstawione jako konkretne priorytety, bez kopiowania dosłownych recenzji.
- Zdjęcia w `assets/` pochodzą z aktualnej, publicznej witryny PREMIUM i są użyte wyłącznie dla tego przykładu. Przed publikacją na innej domenie potwierdź prawa do ich użycia i podmień je, jeśli to konieczne.

## Pliki implementacji

| Plik | Rola |
|---|---|
| `index.html` | treść, meta dane, dane strukturalne i dostępna struktura strony |
| `premium.css` | kompletny responsive UI, bez zależności od poprzedniego szablonu Atelier 27 |
| `premium.js` | wyłącznie mobilne menu i aktualny rok w stopce |
| `assets/*.jpg` | zdjęcia użyte na stronie |

## Co wymaga potwierdzenia przed produkcją

1. Canonical i adres w JSON-LD są ustawione na `premiumradlin.pl`; zmień je tylko po decyzji o docelowej domenie.
2. Zaktualizuj dane kontaktowe, parametry sal i teksty, gdy klient poda nowsze informacje.
3. Sprawdź godziny kontaktu i komplet dokumentów prawnych; strona linkuje do obecnej polityki prywatności zamiast udawać nowy dokument prawny.
4. Dopiero po wdrożeniu bezpiecznego endpointu można dodać formularz zapytania lub moduł rezerwacyjny opisany w `DODATKOWE-MODULY.md`.

## Czego celowo nie ma

- automatyzacji n8n i integracji CRM;
- formularza, który pozornie wysyłałby dane;
- automatycznego potwierdzania terminu;
- cyfrowego wyboru stolika — to osobny przyszły moduł, nieprzydatny dla większości przyjęć w obecnym etapie.
