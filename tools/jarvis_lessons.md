# 🤖 Jarvis Lessons Learned Bank – VM-tipset 2026
**The Absolute Source of Truth for Jarvis's Continuous Testing & UX Learning Loop**

> [!IMPORTANT]
> **KRITISKT DIREKTIV FÖR ALLA AI-AGENTER:**
> Denna fil är **Jarvis kontinuerliga minne för VM-tipset**. Vid varje användararåterkoppling, UX-brist eller bugg som hittas under manuella/automatiska tester, **MÅSTE** den aktiva agenten uppdatera denna fil med de nya lärdomarna.
> Agenter måste alltid granska denna fil vid uppstart för att säkerställa att inga historiska UX-misstag återintroduceras, och uppdatera testerna i [tools/jarvis.cjs](file:///d:/VM-tipset/tools/jarvis.cjs) så att de automatiskt verifierar dessa principer.

---

## 🧠 Core Cognitive QA Principles (Allmänna Testregler)

### 🛡️ Rule 1: Firebase Auth Awareness
*   **Princip:** VM-tipset använder **ingen traditionell Firebase Auth** – inloggning sker via e-post + lösenord som matchas mot Firestore-dokumenten i `tips`-kollektionen, och session sparas i `localStorage` under nyckeln `vmt_login_session`.
*   **UX-Fara:** Jarvis måste alltid logga in via formuläret (inte via Firebase Admin SDK) och verifiera att `localStorage.getItem('vmt_login_session')` är satt efter inloggning.
*   **Test-krav:** Kontrollera att `#login-email`-fältet och submit-knappen finns, och att React-appen laddas utan `authError`.

### 🛡️ Rule 2: Deadline-lås (Tippar stängt)
*   **Princip:** Om deadline har passerats visas texten "Anmälan stängd" och "LÄMNA NYTT TIPS"-knappen försvinner. Jarvis ska inte försöka lämna in tips när deadline är passerad.
*   **UX-Fara:** Jarvis behöver kontrollera om deadline är passerad INNAN den försöker registrera ett tips.
*   **Test-krav:** Verifiera om `.text-slate-500.italic`-texten ("Anmälan stängd") finns – om ja, hoppa över registreringstestet.

### 🛡️ Rule 3: React-app Hydration (Vänta på React)
*   **Princip:** VM-tipset är en React/Vite-app. DOM:en byggs upp dynamiskt av React. `waitForSelector` är avgörande – undvik statiska timeouts.
*   **UX-Fara:** Om Jarvis interagerar med DOM:en innan React hydrerat, hittas inga element.
*   **Test-krav:** Alltid vänta på `#login-email` eller `#root`-elementets innehåll innan tester körs.

### 🛡️ Rule 4: Data Isolation via Admin-konto
*   **Princip:** Jarvis loggar in som admin (VITE_ADMIN_EMAIL + VITE_ADMIN_PASSWORD från `.env`). Admin-kontot har rättigheter att godkänna/radera deltagare.
*   **UX-Fara:** Om Jarvis råkar godkänna eller radera riktiga deltagare förstörs produktionsdata.
*   **Test-krav:** Jarvis skapar ett eget test-tips med unik e-post (`jarvis-e2e-test-[timestamp]@test.local`), testar det och raderar det sedan via Firebase direkt.

### 🛡️ Rule 5: Vite Dev Server
*   **Princip:** VM-tipset kräver en Vite-devserver (`npm run dev`) – det finns ingen inbyggd statisk server som i Spotlight.
*   **UX-Fara:** Om devservern inte är igång kraschar testet direkt.
*   **Test-krav:** Jarvis ska detektera om porten 5173 svarar (standard Vite-port) och ge ett tydligt felmeddelande om devservern inte är igång.

---

## 📜 Historical Lessons & Regression Audits

*(Uppdateras löpande av Jarvis och agenter vid varje testkörning)*

### Lesson 1 — Initialt testprotokoll (v1.0.0)
*   **Bakgrund:** Jarvis portades från Spotlight (Supabase/vanilla JS) till VM-tipset (Firebase/React/Vite).
*   **Nyckelskillnader att komma ihåg:**
    1. Ingen Supabase – all data via Firebase Firestore
    2. Ingen statisk server – kräver Vite devserver på port 5173
    3. Inloggning via localStorage-session, inte cookie/JWT
    4. Admin-godkännande av deltagare sker via `isApproved`-flagga i Firestore
    5. React-rendering – alltid använda `waitForSelector`, aldrig statiska `setTimeout`
*   **Generaliserad testregel:** Alla tester måste ta hänsyn till att detta är en SPA (Single Page Application) med React-state som styr vad som visas.
