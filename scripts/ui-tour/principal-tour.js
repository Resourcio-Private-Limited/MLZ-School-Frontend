// Tour of the Principal portal against a mocked API (no backend writes, no credentials).
// Usage (from the project root, dev server on :3000): node scripts/ui-tour/principal-tour.js <outDir> [width] [height] [onlyMatching]
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");
const { respond, respondWrite, me, unknown } = require("./principal-mock");

const OUT = process.argv[2];
const W = Number(process.argv[3] || 390);
const H = Number(process.argv[4] || 844);
const ONLY = process.argv[5];
const BASE = "http://localhost:3000/principal";
const CLS = "/classroom/cls-7b";

if (!OUT) {
    console.error("Usage: node scripts/ui-tour/principal-tour.js <outDir> [width] [height] [onlyMatching]");
    process.exit(1);
}

const wait = (p, ms = 450) => p.waitForTimeout(ms);
const btn = (p, name) => p.getByRole("button", { name }).first();

const S = [];
const add = (folder, file, route, steps = async () => {}, full = false) => S.push({ folder, file, route, steps, full });

add("00-navigation", "01-top-bar", "");
add("00-navigation", "02-menu-open", "", async (p) => btn(p, /open menu/i).click());
add("00-navigation", "03-menu-on-classroom", CLS, async (p) => btn(p, /open menu/i).click());

add("01-classrooms", "01-home-full", "", async () => {}, true);
add("01-classrooms", "02-level-primary", "", async (p) => p.getByRole("group", { name: /filter by level/i }).getByRole("button", { name: /^primary/i }).click(), true);
add("01-classrooms", "03-no-class-teacher", "", async (p) => btn(p, /^show them$/i).click(), true);
add("01-classrooms", "04-settings", "", async (p) => btn(p, /^settings for /i).click());
add("01-classrooms", "05-create", "", async (p) => btn(p, /^create classroom$/i).click());
add("01-classrooms", "06-delete", "", async (p) => btn(p, /^delete /i).click());

add("02-classroom", "01-overview", CLS, async () => {}, true);
add("02-classroom", "02-not-eligible", CLS, async (p) => p.getByRole("group", { name: /filter students/i }).getByRole("button", { name: /^not eligible/i }).click(), true);
add("02-classroom", "03-student-detail", CLS, async (p) => btn(p, /^view /i).click());
add("02-classroom", "04-student-fees", CLS, async (p) => {
    await btn(p, /^view /i).click();
    await wait(p);
    await p.getByRole("dialog").getByRole("tab", { name: /^fees$/i }).click();
});
add("02-classroom", "05-promote", CLS, async (p) => btn(p, /^promote students$/i).click());
add("02-classroom", "06-promote-review", CLS, async (p) => {
    await btn(p, /^promote students$/i).click();
    await wait(p);
    const d = p.getByRole("dialog");
    await d.locator("#promote-target").selectOption({ index: 1 });
    await d.getByRole("button", { name: /^select all/i }).click();
    await d.getByRole("button", { name: /^review$/i }).click();
});
add("02-classroom", "07-admit", CLS, async (p) => btn(p, /^admit student$/i).click());
add("02-classroom", "08-arrange-rolls", CLS, async (p) => btn(p, /^arrange rolls by name$/i).click());

add("03-teachers", "01-all", "/teachers", async () => {}, true);
add("03-teachers", "02-class-teachers", "/teachers", async (p) => p.getByRole("group", { name: /^show$/i }).getByRole("button", { name: /^class teachers/i }).click(), true);
add("03-teachers", "03-search", "/teachers", async (p) => p.getByLabel(/search teachers/i).fill("science"), true);
add("03-teachers", "04-page-2", "/teachers", async (p) => p.getByRole("button", { name: "Page 2" }).click(), true);
add("03-teachers", "05-inactive", "/teachers", async (p) => p.getByRole("group", { name: /^show$/i }).getByRole("button", { name: /^inactive/i }).click(), true);

const pickClass = async (p) => {
    await p.locator("#admit-class").selectOption("cls-7b");
    await wait(p, 700);
};
add("04-admit-cards", "01-page", "/admit-card", async () => {}, true);
add("04-admit-cards", "02-class-half-yearly", "/admit-card", async (p) => {
    await pickClass(p);
    await p.getByRole("group", { name: /^exam$/i }).getByRole("button", { name: /half-yearly/i }).click();
}, true);
add("04-admit-cards", "03-final-missing-date", "/admit-card", async (p) => {
    await pickClass(p);
    await p.getByRole("group", { name: /^exam$/i }).getByRole("button", { name: /^final/i }).click();
}, true);
add("04-admit-cards", "04-preview", "/admit-card", async (p) => {
    await pickClass(p);
    await p.getByRole("group", { name: /^exam$/i }).getByRole("button", { name: /half-yearly/i }).click();
    await wait(p, 700);
    await btn(p, /^preview admit card for /i).click();
    await wait(p, 800);
});
add("04-admit-cards", "05-selected", "/admit-card", async (p) => {
    await pickClass(p);
    await p.getByRole("group", { name: /^exam$/i }).getByRole("button", { name: /half-yearly/i }).click();
    await wait(p, 700);
    await btn(p, /^select all eligible/i).click();
}, true);

add("05-noticeboard", "01-all", "/noticeboard", async () => {}, true);
add("05-noticeboard", "02-composer", "/noticeboard", async (p) => {
    await btn(p, /^new notice$/i).click();
    await wait(p);
    await p.getByLabel(/^title/i).first().fill("Annual sports day on 5 December");
    await p.getByLabel(/^link/i).first().fill("not a link");
}, true);
add("05-noticeboard", "03-delete", "/noticeboard", async (p) => btn(p, /^delete /i).click());

add("06-profile", "01-profile", "/profile", async () => {}, true);
add("06-profile", "02-edit", "/profile", async (p) => btn(p, /^edit details$/i).click(), true);

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, reducedMotion: "reduce", isMobile: false });
    await context.addInitScript((id) => {
        localStorage.setItem("accessToken", "mock-token");
        localStorage.setItem("authUser", JSON.stringify({ id, role: "PRINCIPAL" }));
        localStorage.setItem("userRole", "PRINCIPAL");
    }, me);
    await context.route("http://localhost:6969/**", (route) => {
        const req = route.request();
        const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
        if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
        // Admit cards come back as a PDF blob.
        if (req.method() === "POST" && new URL(req.url()).pathname === "/principal/admit-cards")
            return route.fulfill({ status: 200, contentType: "application/pdf", headers, body: "%PDF-1.4\n%mock\n" });
        let body;
        if (req.method() === "GET") body = respond(req.url());
        else {
            let payload = null;
            try {
                payload = req.postDataJSON();
            } catch {}
            body = respondWrite(req.method(), req.url(), payload);
        }
        return route.fulfill({ status: 200, contentType: "application/json", headers, body: JSON.stringify(body) });
    });
    const page = await context.newPage();
    const failures = [];
    const overflow = [];
    let n = 0;
    const run = S.filter((x) => !ONLY || `${x.folder}/${x.file}`.includes(ONLY));
    for (const s of run) {
        try {
            await page.goto(`${BASE}${s.route}`, { waitUntil: "networkidle" });
            await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
            await wait(page, 600);
            await s.steps(page);
            await wait(page, 500);
            // No horizontal page scroll is allowed at any width.
            const wide = await page.evaluate(() => {
                const main = document.querySelector("main");
                return Math.max(document.documentElement.scrollWidth - window.innerWidth, main ? main.scrollWidth - main.clientWidth : 0);
            });
            if (wide > 1) overflow.push(`${s.folder}/${s.file}: ${wide}px`);
            if (s.full)
                await page.evaluate(() => {
                    let el = document.querySelector("main");
                    while (el && el !== document.body) {
                        el.style.overflow = "visible";
                        el.style.height = "auto";
                        el = el.parentElement;
                    }
                });
            const dir = path.join(OUT, s.folder);
            fs.mkdirSync(dir, { recursive: true });
            await page.screenshot({ path: path.join(dir, `${s.file}.png`), fullPage: s.full });
            n++;
        } catch (e) {
            failures.push(`${s.folder}/${s.file}: ${e.message.split("\n")[0]}`);
        }
    }
    console.log(`saved ${n}/${run.length} at ${W}x${H}`);
    if (overflow.length) console.log("HORIZONTAL OVERFLOW:\n" + overflow.join("\n"));
    if (failures.length) console.log("FAILED:\n" + failures.join("\n"));
    if (unknown.size) console.log("UNMOCKED GET ENDPOINTS (returned []):\n" + [...unknown].join("\n"));
    await browser.close();
})();
