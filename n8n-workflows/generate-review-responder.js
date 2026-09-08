// Generates the n8n workflow skeleton for the "Monitoring opinii i reputacji" service.
// Unlike the 32 generic catalog examples, this is meant to be the real, testable
// starting point for that service: it accepts a review payload, has AI classify
// sentiment and draft a reply, and returns the DRAFT for manual approval — it does
// NOT auto-publish anywhere, matching what the site promises ("nic nie wychodzi bez
// Twojej zgody"). Publishing to a real platform (Google/Allegro/etc.) is a separate
// step added per client, once that client's API access exists.
// Run: node generate-review-responder.js
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const OUT_DIR = __dirname;
let Y_BASE = 300;

function node(type, name, parameters, x, typeVersion = 1, extra = {}) {
  return { id: randomUUID(), name, type, typeVersion, position: [x, Y_BASE], parameters, ...extra };
}

function stickyNote(text, x, width = 480, height = 420, yOffset = -440) {
  return {
    id: randomUUID(),
    name: 'Notatka: konfiguracja',
    type: 'n8n-nodes-base.stickyNote',
    typeVersion: 1,
    position: [x, Y_BASE + yOffset],
    parameters: { content: text, height, width, color: 4 },
  };
}

function webhookTrigger(name, webhookPath, x) {
  return node('n8n-nodes-base.webhook', name, { httpMethod: 'POST', path: webhookPath, responseMode: 'responseNode', options: {} }, x, 2);
}

function codeNode(name, jsCode, x) {
  return node('n8n-nodes-base.code', name, { jsCode }, x, 2);
}

function httpNode(name, method, url, note, x, bodyOverride) {
  return node(
    'n8n-nodes-base.httpRequest',
    name,
    { method, url, sendBody: method !== 'GET', specifyBody: 'json', jsonBody: bodyOverride || '={{ JSON.stringify($json) }}', options: {} },
    x,
    4.2,
    { notes: note }
  );
}

function respondWebhook(name, x) {
  return node(
    'n8n-nodes-base.respondToWebhook',
    name,
    { respondWith: 'json', responseBody: '={{ { "sentyment": $json.sentyment, "propozycja_odpowiedzi": $json.odpowiedz, "opinia_oryginalna": $json.opinia_oryginalna } }}' },
    x,
    1.1
  );
}

const systemPromptCode = `
const SYSTEM_PROMPT = "Jestes asystentem odpowiadajacym w imieniu firmy klienta na opinie zostawione przez jej klientow (Google, Allegro lub inna platforma z recenzjami). Twoje zadanie:\\n1. Ocen sentyment opinii: pozytywna, neutralna lub negatywna.\\n2. Napisz krotka (2-4 zdania), profesjonalna odpowiedz po polsku, dopasowana tonem do opinii.\\n3. Jesli opinia jest pozytywna - podziekuj konkretnie za to, co klient docenil, nie ogolnikowo.\\n4. Jesli opinia jest negatywna - przeproś, nie usprawiedliwiaj sie nadmiernie, zaproponuj kontakt bezposredni w celu rozwiazania sprawy (np. adres e-mail podany w danych firmy). Nie obiecuj konkretnych rekompensat, znizek ani terminow.\\n5. Nigdy nie wymyslaj faktow, nazwisk pracownikow, numerow zamowien ani szczegolow, ktorych nie ma w tresci opinii.\\n6. Nie uzywaj emoji. Nie podpisuj odpowiedzi wymyslonym imieniem.\\nOdpowiedz WYLACZNIE w formacie JSON, bez dodatkowego tekstu: {\\"sentyment\\": \\"pozytywna|neutralna|negatywna\\", \\"odpowiedz\\": \\"...\\"}";

const body = $json.body || $json;
const opinia = {
  autor: (body.autor || "Klient").toString().slice(0, 100),
  ocena: body.ocena != null ? Number(body.ocena) : null,
  tresc: (body.tresc || body.opinia || "").toString().slice(0, 2000),
};

if (!opinia.tresc) {
  throw new Error("Brak tresci opinii w payloadzie (pole tresc albo opinia).");
}

const userContent = "Dane firmy: [PODMIEN NA NAZWE FIRMY KLIENTA I ADRES KONTAKTOWY]\\n\\nOpinia klienta (ocena: " + (opinia.ocena != null ? opinia.ocena + "/5" : "brak oceny") + "):\\n" + opinia.tresc;

return [{
  json: {
    opinia_oryginalna: opinia,
    body: {
      model: "gpt-4o-mini",
      max_tokens: 300,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    },
  },
}];
`.trim();

const extractResultCode = `
let parsed;
try {
  const raw = $json.choices && $json.choices[0] && $json.choices[0].message && $json.choices[0].message.content;
  parsed = JSON.parse(raw);
} catch (e) {
  parsed = { sentyment: "nieznany", odpowiedz: "Nie udalo sie wygenerowac odpowiedzi automatycznie - wymaga recznego napisania." };
}

return [{
  json: {
    sentyment: parsed.sentyment || "nieznany",
    odpowiedz: parsed.odpowiedz || "",
    opinia_oryginalna: $json.opinia_oryginalna,
  },
}];
`.trim();

const chain = [
  webhookTrigger('Nowa opinia (Webhook)', 'opinia-nowa', 0),
  codeNode('Zbuduj prompt', systemPromptCode, 0),
  httpNode(
    'AI: przeanalizuj i napisz odpowiedz',
    'POST',
    'https://api.openai.com/v1/chat/completions',
    'Wymaga naglowka Authorization: Bearer TWOJ_KLUCZ_OPENAI w zakladce Headers.',
    0,
    '={{ $json.body }}'
  ),
  codeNode('Wyodrebnij wynik', extractResultCode, 0),
  respondWebhook('Zwroc projekt odpowiedzi (do akceptacji)', 0),
];
chain.forEach((n, i) => { n.position = [80 + i * 320, Y_BASE]; });

const note = stickyNote(
  '## Monitoring opinii i reputacji - szkielet\n\n' +
  '**Co robi teraz:** przyjmuje opinie (webhook), AI ocenia sentyment i pisze projekt odpowiedzi, wynik wraca jako JSON w odpowiedzi na request. NIC nie publikuje automatycznie - zgodnie z tym co obiecujemy na stronie ("nic nie wychodzi bez Twojej zgody").\n\n' +
  '**Jak testowac bez prawdziwego Google/Allegro:**\n' +
  'Wyslij recznie (curl/Postman/tryb testowy webhooka w n8n) taki JSON pod URL webhooka:\n' +
  '{"autor":"Jan K.","ocena":2,"tresc":"Zamowienie przyszlo 5 dni pozniej niz obiecano."}\n' +
  'Sprawdz czy sentyment i tresc odpowiedzi maja sens. Powtorz z pozytywna opinia.\n\n' +
  '**Do zrobienia przed uzyciem u klienta:**\n' +
  '1. Dodaj klucz OpenAI w node "AI: przeanalizuj i napisz odpowiedz".\n' +
  '2. W "Zbuduj prompt" podmien "[PODMIEN NA NAZWE FIRMY...]" na dane konkretnego klienta.\n' +
  '3. Podlacz realne zrodlo opinii pod webhook (Google Business Profile API / inne API platformy) zamiast recznych testow.\n' +
  '4. Dodaj krok powiadomienia wlasciciela (np. e-mail) z projektem odpowiedzi i przyciskiem akceptacji, zanim cokolwiek trafi na realne API publikacji - to osobny node do dobudowania, celowo nie zgadujemy go teraz.',
  80, 480, 480
);

const workflow = {
  name: 'STFS — Monitoring opinii i reputacji (szkielet)',
  nodes: [note, ...chain],
  connections: {
    'Nowa opinia (Webhook)': { main: [[{ node: 'Zbuduj prompt', type: 'main', index: 0 }]] },
    'Zbuduj prompt': { main: [[{ node: 'AI: przeanalizuj i napisz odpowiedz', type: 'main', index: 0 }]] },
    'AI: przeanalizuj i napisz odpowiedz': { main: [[{ node: 'Wyodrebnij wynik', type: 'main', index: 0 }]] },
    'Wyodrebnij wynik': { main: [[{ node: 'Zwroc projekt odpowiedzi (do akceptacji)', type: 'main', index: 0 }]] },
  },
  active: false,
  settings: { executionOrder: 'v1' },
};

fs.writeFileSync(path.join(OUT_DIR, 'monitoring-opinii-odpowiedzi.json'), JSON.stringify(workflow, null, 2), 'utf8');
console.log('napisano monitoring-opinii-odpowiedzi.json, nodes:', chain.length);
