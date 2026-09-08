# Moduły zapytań — PREMIUM

Strona zawiera dwie gotowe ścieżki: prośbę o oglądanie sali i catering. Bez integracji formularz tworzy wiadomość e-mail z pełnym podsumowaniem; nie udaje wysłania danych.

## Włączenie n8n

W `venue-integrations.js` wpisz wyłącznie adresy webhooków n8n. Klucze do SMSAPI, Twilio, Google Places i CRM pozostają po stronie n8n.

- `inquiryEndpoint` — odbiera każdą prośbę, zapisuje ją w CRM i wysyła e-mail do biura.
- `smsStartEndpoint` — przyjmuje numer telefonu, ogranicza liczbę prób i wysyła sześciocyfrowy kod z ważnością 10 minut.
- `smsVerifyEndpoint` — porównuje kod po stronie serwera; dopiero odpowiedź 2xx odblokowuje wysłanie cateringu.

Webhook dla zapytania dostaje JSON z polami `venue`, `type`, `submittedAt`, `fields` oraz `extras`. Dla Premium SMS do głównego telefonu powinien zawierać jedynie: imię, telefon, datę, liczbę osób i rodzaj usługi. Pełny rekord trafia do e-maila/CRM.

## Bezpieczeństwo SMS

Dodaj CAPTCHA przed wysyłką kodu, limit 3 prób na numer/IP, wygaszenie kodu po 10 minutach i zapis tylko skrótu kodu. Nie przechowuj kodów ani kluczy dostawcy SMS w JavaScripcie strony.

## Oglądanie sali

Zgłoszenie ma status „prośba o kontakt”, nie blokuje kalendarza. Po zaakceptowaniu przez pracownika n8n wysyła klientowi e-mail i SMS z potwierdzeniem terminu.

## Opinie oraz terminy

`reviewsEndpoint` może zwracać zatwierdzone opinie z Google Places API lub CMS. Po stronie n8n odfiltruj treści niezaakceptowane przez właściciela, a do strony podawaj tylko autora, ocenę, cytat i datę aktualizacji. Oczekiwany format: `{ "reviews": [{ "author": "Anna", "rating": 5, "text": "…", "context": "po weselu" }] }`.

Najbliższe terminy trzymaj w CMS/n8n jako trzy krótkie komunikaty, bez pełnego kalendarza. `availabilityEndpoint` powinien zwracać `{ "availability": [{ "title": "Wesela", "text": "Zapytaj o lato 2027" }] }`; obecne teksty są bezpiecznym stanem startowym.
