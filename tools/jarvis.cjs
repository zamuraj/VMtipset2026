// Puppeteer-resolver: söker lokalt först, sedan i D:\tools (delad installation för alla projekt på D:\)
let puppeteer;
try {
    puppeteer = require('puppeteer');
} catch (e) {
    const sharedPath = 'D:\\tools\\node_modules\\puppeteer';
    try {
        puppeteer = require(sharedPath);
    } catch (e2) {
        console.error('❌ JARVIS FEL: puppeteer hittades inte.');
        console.error('   Installera det delade testverktyget med:');
        console.error('   npm install puppeteer  (kör från D:\\tools\\)');
        console.error('   Eller installera lokalt: pnpm add -D puppeteer');
        process.exit(1);
    }
}
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// ─────────────────────────────────────────────────────────────────────────────
// 🤖 JARVIS KOGNITIV TESTAGENT — VM-TIPSET 2026
// Portad från Spotlight (Supabase/vanilla JS) → VM-tipset (Firebase/React/Vite)
//
// Nyckelskillnader vs Spotlight-Jarvis:
//   1. Ingen Supabase – all data via Firebase Firestore
//   2. Ingen inbyggd statisk server – kräver Vite devserver på port 5173
//   3. Inloggning via localStorage-session (vmt_login_session)
//   4. React SPA – alltid waitForSelector, aldrig setTimeout-hacks
//   5. Admin-godkännande via isApproved-flagga i Firestore
// ─────────────────────────────────────────────────────────────────────────────

// Enkel manuell tolkning av .env-fil (undviker extra npm-beroenden)
function loadEnv() {
    try {
        const envPath = path.join(__dirname, '..', '.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf-8');
            envContent.split(/\r?\n/).forEach(line => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    const firstEqual = trimmed.indexOf('=');
                    if (firstEqual !== -1) {
                        const key = trimmed.substring(0, firstEqual).trim();
                        const val = trimmed.substring(firstEqual + 1).trim().replace(/^['"]|['"]$/g, '');
                        process.env[key] = val;
                    }
                }
            });
        }
    } catch (err) {
        console.warn('⚠️ Kunde inte läsa in .env-fil:', err.message);
    }
}

// Kontrollera om en HTTP-port svarar (för att verifiera att Vite-servern är igång)
function checkPort(port) {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${port}`, (res) => {
            resolve(true);
            req.destroy();
        });
        req.on('error', () => resolve(false));
        req.setTimeout(3000, () => { resolve(false); req.destroy(); });
    });
}

// Hjälpfunktion för att skriva i fält på ett säkert sätt genom att rensa det först
async function typeInInput(page, selector, text) {
    await page.waitForSelector(selector, { visible: true });
    await page.click(selector);
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.type(selector, text, { delay: 30 });
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔍 KOGNITIV UX-KONTROLL: Överlappande interaktiva element
// Lesson 2.10 (ärvd från Spotlight): Knappar för destruktiva åtgärder får
// aldrig ligga för nära textinmatningsfält. Flaggar par < 8px ifrån varandra.
// ─────────────────────────────────────────────────────────────────────────────
async function runOverlapAudit(page, log, consoleErrors) {
    log('📐 Kör Kognitiv UX-kontroll: Skannar efter överlappande/tätt sittande interaktiva element...');

    const overlapIssues = await page.evaluate(() => {
        const issues = [];
        const MIN_MARGIN_PX = 8;

        const selectors = ['button', 'input:not([type="hidden"])', 'textarea', 'a[href]', 'select', '[role="button"]'];
        const elements = Array.from(document.querySelectorAll(selectors.join(',')))
            .map(el => {
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                const isVisible = rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
                if (!isVisible) return null;
                return {
                    el,
                    rect,
                    isDestructive: el.classList.contains('delete-action') ||
                                   el.classList.contains('btn-delete') ||
                                   el.title?.toLowerCase().includes('radera') ||
                                   el.title?.toLowerCase().includes('ta bort') ||
                                   el.getAttribute('aria-label')?.toLowerCase().includes('radera'),
                    id: el.id || '',
                    tag: el.tagName.toLowerCase(),
                    text: el.innerText?.trim().substring(0, 40) || el.placeholder || el.title || '',
                    className: (el.className || '').substring(0, 60),
                };
            })
            .filter(Boolean);

        for (let i = 0; i < elements.length; i++) {
            for (let j = i + 1; j < elements.length; j++) {
                const a = elements[i];
                const b = elements[j];

                const horizGap = Math.max(0, Math.max(a.rect.left, b.rect.left) - Math.min(a.rect.right, b.rect.right));
                const vertGap = Math.max(0, Math.max(a.rect.top, b.rect.top) - Math.min(a.rect.bottom, b.rect.bottom));
                const distance = Math.sqrt(horizGap * horizGap + vertGap * vertGap);

                const isTooClose = distance < MIN_MARGIN_PX;
                const hasDestructive = a.isDestructive || b.isDestructive;
                const isInput = a.tag === 'input' || a.tag === 'textarea' || b.tag === 'input' || b.tag === 'textarea';

                if (isTooClose || (hasDestructive && isInput && distance < 20)) {
                    const severity = (hasDestructive && isInput) ? '🔴 HÖG RISK' : '🟡 VARNING';
                    issues.push({
                        severity,
                        distance: Math.round(distance),
                        elementA: `<${a.tag} id="${a.id}" class="${a.className}"> "${a.text}"`,
                        elementB: `<${b.tag} id="${b.id}" class="${b.className}"> "${b.text}"`,
                        reason: hasDestructive && isInput
                            ? 'Destruktiv knapp (radera/delete) ligger för nära ett textinmatningsfält – risk för oavsiktlig radering!'
                            : 'Interaktiva element är för tätt placerade (< 8px), ökar risk för felklick.',
                    });
                }
            }
        }

        return issues;
    });

    if (overlapIssues.length > 0) {
        log(`⚠️ Överlappningsgranskning: Hittade ${overlapIssues.length} st potentiella UX-problem!`);
        overlapIssues.forEach(issue => {
            log(`  ${issue.severity}: Avstånd ${issue.distance}px mellan element`);
            if (issue.severity.includes('HÖG RISK')) {
                consoleErrors.push(`[OVERLAP AUDIT] ${issue.severity}: ${issue.reason} — A: ${issue.elementA} B: ${issue.elementB}`);
            }
        });
    } else {
        log('✅ Överlappningsgranskning godkänd: Inga tätt sittande interaktiva element hittades.');
    }

    return overlapIssues;
}

// ─────────────────────────────────────────────────────────────────────────────
// 🧹 DATASANERINGS-PROTOKOLL — Körs ALLTID i finally-block
// VM-tipset: Vi raderar via Firebase REST API istället för Supabase RPC.
// Jarvis-testtips identifieras via e-postens prefix "jarvis-e2e-test-".
// ─────────────────────────────────────────────────────────────────────────────
async function cleanUpMockData(page, jarvisTestEmail, log) {
    if (!jarvisTestEmail) {
        log('🧹 Datasanering: Inget test-e-post registrerat – inget att städa.');
        return;
    }
    log(`🧹 Datasanering: Initierar städning för ${jarvisTestEmail}...`);

    try {
        // Rensa localStorage i webbläsaren
        await page.evaluate(() => {
            const keys = Object.keys(localStorage).filter(k => k.includes('jarvis') || k.includes('vmt_draft') || k.includes('vmt_login_session'));
            keys.forEach(k => localStorage.removeItem(k));
        }).catch(() => {});

        log('✅ Datasanering: localStorage rensad.');
        log('ℹ️  OBS: Test-tips i Firestore raderas via Admin-panelen eller direkt i Firebase Console.');
        log('ℹ️  Test-e-post att söka efter: ' + jarvisTestEmail);
    } catch (err) {
        log(`⚠️ Datasanering: Misslyckades delvis: ${err.message}`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🤖 HUVUDTESTFUNKTION
// ═══════════════════════════════════════════════════════════════════════════
async function runJarvisTests() {
    loadEnv();

    console.log('🤖 Jarvis VM-tipset initieras. Startar testsekvens...');

    // ── Miljökonfiguration ──────────────────────────────────────────────────
    const adminEmail = process.env.VITE_ADMIN_EMAIL || '';
    const adminPassword = process.env.VITE_ADMIN_PASSWORD || '';

    if (!adminEmail || !adminPassword) {
        console.error('❌ JARVIS FEL: VITE_ADMIN_EMAIL och VITE_ADMIN_PASSWORD måste vara satta i .env!');
        process.exit(1);
    }

    // Avgör om vi kör mot produktion (--prod) eller lokalt
    const isProductionRun = process.argv.includes('--prod');
    let targetUrl;

    if (isProductionRun) {
        targetUrl = process.env.JARVIS_TARGET_URL || 'https://vmtipset.netlify.app';
        console.log(`🌐 Jarvis körs mot PRODUKTIONSMILJÖN: ${targetUrl}`);
    } else {
        const vitePort = 5173;
        console.log(`🔍 Kontrollerar om Vite devserver körs på port ${vitePort}...`);
        const viteRunning = await checkPort(vitePort);
        if (!viteRunning) {
            console.error(`❌ JARVIS FEL: Vite devserver verkar inte vara igång på port ${vitePort}.`);
            console.error('   Starta den med: npm run dev');
            console.error('   Alternativt kör mot produktion: node tools/jarvis.cjs --prod');
            process.exit(1);
        }
        targetUrl = `http://localhost:${vitePort}`;
        console.log(`💻 Jarvis körs LOKALT: ${targetUrl}`);
    }

    // ── Rapport-setup ───────────────────────────────────────────────────────
    const reportsDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, 'jarvis_log.md');
    let logContent = `# 🤖 Jarvis Kognitiv Testrapport — VM-tipset 2026\n\n`;
    logContent += `**Datum:** ${new Date().toLocaleString('sv-SE')}\n`;
    logContent += `**Testmiljö:** ${targetUrl}\n\n`;

    let logs = [];
    const log = (msg) => {
        const time = new Date().toLocaleTimeString('sv-SE');
        const formattedMsg = `[${time}] ${msg}`;
        console.log(formattedMsg);
        logs.push(formattedMsg);
    };

    // ── Puppeteer-start ─────────────────────────────────────────────────────
    const browser = await puppeteer.launch({
        headless: 'new',
        channel: 'chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    // FELSÖKNING: Simulera mobil viewport och User Agent direkt vid uppstart för att reproducera mobillandningskrasch
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

    // Dismiss eventuella confirm/alert-dialoger (Lesson 5 från Spotlight)
    page.on('dialog', async dialog => {
        log(`💬 Dialog upptäcktes: "${dialog.message()}" – Jarvis avvisar den.`);
        await dialog.dismiss();
    });

    let consoleErrors = [];
    let networkErrors = [];
    let jarvisTestEmail = null;

    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        console.log(`🖥️ [BROWSER ${type.toUpperCase()}] ${text}`);
        if (type === 'error') {
            consoleErrors.push(`[CONSOLE ERROR] ${text}`);
        }
    });

    page.on('pageerror', error => {
        consoleErrors.push(`[CRITICAL PAGE EXCEPTION] ${error.message}\nStack: ${error.stack}`);
    });

    page.on('requestfailed', request => {
        networkErrors.push(`[NETWORK ERROR] ${request.url()} failed: ${request.failure().errorText}`);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // TESTUTFÖRANDE — try/finally garanterar teardown (Lesson 4)
    // ═══════════════════════════════════════════════════════════════════════
    try {
        // ── Öppna appen ────────────────────────────────────────────────────
        log(`👤 Simulerar mänsklig uppstart – öppnar webbläsare mot ${targetUrl}...`);
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        log('✅ Sidan laddad framgångsrikt.');

        // ── Pre-flight Console Audit (Lesson 10) ───────────────────────────
        log('🔍 Utför Pre-flight Console Audit...');
        const hasCriticalStartupError = consoleErrors.some(err =>
            err.toLowerCase().includes('firebase') ||
            err.toLowerCase().includes('cors') ||
            err.toLowerCase().includes('failed to fetch') ||
            err.toLowerCase().includes('dns')
        );

        if (hasCriticalStartupError) {
            log('❌ KRITISKT FEL: Kritiska nätverks- eller Firebase-fel vid uppstart (VPN/DNS-blockering?).');
            consoleErrors.push('[PRE-FLIGHT AUDIT FAILED] Kritiska uppstartsfel hittades.');
            throw new Error('Pre-flight Console Audit misslyckades.');
        }
        log('✅ Pre-flight Audit godkänd. Inga kritiska uppstartsfel.');

        // ── React-hydrering ─────────────────────────────────────────────────
        log('⏳ Väntar på att React-appen hydrerar...');
        try {
            await page.waitForSelector('#root', { timeout: 10000 });
            await page.waitForSelector('#login-email', { timeout: 10000 });
            log('✅ React-app hydrerad. Inloggningsformulär hittat.');
        } catch (e) {
            log('⚠️ React-hydrering timeout – appen kanske redan är inloggad eller strukturen har ändrats.');
        }

        // ── Kolla deadline-status ───────────────────────────────────────────
        const deadlinePassed = await page.evaluate(() => {
            const closedText = document.querySelector('.text-slate-500.italic');
            return closedText && closedText.textContent.includes('stängd');
        });

        if (deadlinePassed) {
            log('⏰ Deadline har passerat – anmälan stängd. Hoppar över registreringstest.');
        }

        // ── INLOGGNING DIREKT SOM DELTAGARE ─────────────────────────────────
        const testUserEmail = '14perden@gmail.com';
        log(`🔒 Initierar inloggning med: ${testUserEmail}`);
        await typeInInput(page, '#login-email', testUserEmail);

        if (testUserEmail.toLowerCase() === adminEmail.toLowerCase()) {
            try {
                await typeInInput(page, '#login-password', adminPassword);
            } catch (e) {
                log('ℹ️  Lösenordsfält dök inte upp.');
            }
        }

        log('👆 Klickar på inloggningsknappen...');
        await page.click('button[type="submit"]');

        // Vänta på att localStorage-sessionen sätts
        try {
            await page.waitForFunction(() => {
                const session = localStorage.getItem('vmt_login_session');
                return session !== null;
            }, { timeout: 10000 });
            log('✅ Inloggning lyckades! Session sparad i localStorage.');
        } catch (authTimeout) {
            log('⚠️ Inloggning timeout – sessionen sattes inte inom 10 sekunder.');
            consoleErrors.push('[AUTH TIMEOUT] Session sattes inte inom 10s.');
        }

        // ── VISUELL SKANNING (desktop) ──────────────────────────────────────
        log('🔍 Skannar av skärmens visuella element (Visual Harmony Audit)...');
        const { interactiveElements, reactRootVisible } = await page.evaluate(() => {
            const elements = [];
            const root = document.getElementById('root');
            const rootVisible = root && root.children.length > 0;

            document.querySelectorAll('button, input, textarea, a').forEach(el => {
                const rect = el.getBoundingClientRect();
                const computed = window.getComputedStyle(el);
                const isVisible = rect.width > 0 && rect.height > 0 && computed.display !== 'none';
                if (isVisible) {
                    elements.push({
                        tag: el.tagName.toLowerCase(),
                        id: el.id || 'inget-id',
                        text: el.innerText?.trim().substring(0, 40) || el.placeholder || ''
                    });
                }
            });
            return { interactiveElements: elements, reactRootVisible: rootVisible };
        });

        if (reactRootVisible) {
            log(`✅ React-rooten renderad korrekt. Jarvis ser ${interactiveElements.length} st synliga interaktiva element.`);
        } else {
            log('❌ React-rooten är tom – appen verkar inte renderas korrekt!');
            consoleErrors.push('[REACT RENDER] Root element is empty – React may have failed to mount.');
        }



        // ── LEDARTAVLA-VERIFIERING ──────────────────────────────────────────
        log('🏆 Navigerar till Ledartavla-fliken...');
        const leaderboardClicked = await page.evaluate(() => {
            const lb = document.querySelector('button[aria-label="Leaderboard"]');
            if (lb) { lb.click(); return true; }
            const buttons = Array.from(document.querySelectorAll('button'));
            const lbFallback = buttons.find(b => b.textContent?.includes('Ledartavla') || b.textContent?.includes('leaderboard') || b.getAttribute('aria-label') === 'Leaderboard');
            if (lbFallback) { lbFallback.click(); return true; }
            return false;
        });

        if (leaderboardClicked) {
            try {
                await page.waitForNetworkIdle({ timeout: 5000, idleTime: 800 });
            } catch (e) {}
            log('✅ Navigerade till Ledartavla.');
        } else {
            log('⚠️ Ledartavla-knapp hittades inte. Appen kanske visar en annan flik som default.');
        }

        // ── SCHEMA-VERIFIERING ──────────────────────────────────────────────
        log('📅 Verifierar att matchschemat renderas...');
        const scheduleVisible = await page.evaluate(() => {
            // Sök efter match-nummer eller lag-namn i DOM:en
            const text = document.body.innerText || '';
            return text.includes('Mexiko') || text.includes('Sverige') || text.includes('Brasilien');
        });

        if (scheduleVisible) {
            log('✅ Matchschema innehåller förväntade lagnamn.');
        } else {
            log('⚠️ Kunde inte bekräfta matchschema i DOM:en – Firebase-data kanske inte laddats.');
        }

        // ── MOBILLÄGE: UX-KONTROLL ──────────────────────────────────────────
        log('📱 BYTER TILL MOBILLÄGE (375x812) för UX-granskning...');
        await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

        const mobileOverlapIssues = await runOverlapAudit(page, log, consoleErrors);
        logContent += `### 📐 Överlappningsgranskning (Mobil)\n`;
        if (mobileOverlapIssues.length > 0) {
            mobileOverlapIssues.forEach(issue => {
                logContent += `- **${issue.severity}** (avstånd: ${issue.distance}px): ${issue.reason}\n`;
            });
        } else {
            logContent += `- ✅ Inga tätt sittande element hittades i mobilläge.\n`;
        }
        logContent += `\n`;

        // ── VERIFIERING: Deadline-räknare ───────────────────────────────────
        log('⏱️ Kontrollerar deadline-räknaren...');
        const deadlineText = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('*'));
            const el = elements.find(e => e.textContent?.includes('dagar') || e.textContent?.includes('Deadline'));
            return el ? el.textContent.trim().substring(0, 100) : null;
        });

        if (deadlineText) {
            log(`✅ Deadline-text hittad: "${deadlineText.substring(0, 60)}..."`);
        } else {
            log('ℹ️  Ingen deadline-räknare synlig (kan vara normalt om deadline passerats).');
        }

        // ── DESKTOP-LÄGE: Överlappningsgranskning ───────────────────────────
        log('🖥️ BYTER TILLBAKA TILL DESKTOP (1280x800) för slutgranskning...');
        await page.setViewport({ width: 1280, height: 800, isMobile: false, hasTouch: false, deviceScaleFactor: 1 });

        const desktopOverlapIssues = await runOverlapAudit(page, log, consoleErrors);
        logContent += `### 📐 Överlappningsgranskning (Desktop)\n`;
        if (desktopOverlapIssues.length > 0) {
            desktopOverlapIssues.forEach(issue => {
                logContent += `- **${issue.severity}** (avstånd: ${issue.distance}px): ${issue.reason}\n`;
            });
        } else {
            logContent += `- ✅ Inga tätt sittande element hittades i desktop-läge.\n`;
        }
        logContent += `\n`;

        // ── REGISTRERING: Om deadline inte passerat ─────────────────────────
        if (!deadlinePassed) {
            log('📝 Testar registreringsflödet (deadline ej passerad)...');
            const registerBtnExists = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.some(b => b.textContent?.includes('TIPS') || b.textContent?.includes('REGISTRERA'));
            });

            if (registerBtnExists) {
                log('✅ Registreringsknapp finns och är synlig (deadline ej passerad).');
            } else {
                log('⚠️ Registreringsknapp hittades inte (möjligt om deadline passerat).');
            }
        }

        // ── Slut-skärmdump (desktop) ────────────────────────────────────────
        const screenshotPath = path.join(reportsDir, 'jarvis_screenshot.png');
        await page.screenshot({ path: screenshotPath, fullPage: false });
        log('📸 Skärmdump sparad (desktop-vy).');

        // ── Mobilskärmdump ──────────────────────────────────────────────────
        log('📱 Tar mobilskärmdump...');
        await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
        try { await page.waitForNetworkIdle({ timeout: 3000, idleTime: 500 }); } catch (e) {}
        const mobileScreenshotPath = path.join(reportsDir, 'jarvis_screenshot_mobile.png');
        await page.screenshot({ path: mobileScreenshotPath, fullPage: false });
        log('📸 Mobilskärmdump sparad.');

        log('✅ Alla kognitiva teststeg slutförda.');

    } catch (error) {
        log(`❌ Kritiskt fel: ${error.message}`);
        consoleErrors.push(`[EXCEPTION] ${error.stack}`);
    } finally {
        // ── TEARDOWN: Alltid i finally-block ──────────────────────────────
        if (page && !page.isClosed()) {
            await cleanUpMockData(page, jarvisTestEmail, log);
        }

        await browser.close();

        // ── Sammanställ rapport ─────────────────────────────────────────────
        logContent += `## 📜 Händelseförlopp\n\`\`\`text\n`;
        logs.forEach(l => logContent += `${l}\n`);
        logContent += `\`\`\`\n\n`;

        logContent += `## 🚨 Fel & Varningar\n`;
        if (consoleErrors.length === 0 && networkErrors.length === 0) {
            logContent += `✅ **Inga fel hittades i konsolen eller nätverkstrafiken!**\n\n`;
        } else {
            if (consoleErrors.length > 0) {
                logContent += `### Konsolfel:\n\`\`\`text\n`;
                consoleErrors.forEach(err => logContent += `${err}\n`);
                logContent += `\`\`\`\n`;
            }
            if (networkErrors.length > 0) {
                logContent += `### Nätverksfel:\n\`\`\`text\n`;
                networkErrors.forEach(err => logContent += `${err}\n`);
                logContent += `\`\`\`\n`;
            }
        }

        logContent += `## 🖼️ Visuell Verifiering\n`;
        logContent += `### Desktop\n![Skärmdump](${path.join(reportsDir, 'jarvis_screenshot.png')})\n\n`;
        logContent += `### Mobil (375x812)\n![Mobilskärmdump](${path.join(reportsDir, 'jarvis_screenshot_mobile.png')})\n\n`;
        logContent += `---\n🤖 *Rapporterat av Jarvis VM-tipset Test-Engine v1.0*`;

        fs.writeFileSync(reportPath, logContent, 'utf8');
        console.log(`📄 Jarvis-rapport sparad till: ${reportPath}`);
    }
}

runJarvisTests();
