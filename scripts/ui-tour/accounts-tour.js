// Tour of the Accounts portal against a mocked API (no backend writes, no credentials).
// Usage (from the project root, dev server on :3000): node scripts/ui-tour/accounts-tour.js <outDir> [width] [height] [onlyMatching]
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");
const { respond, respondWrite, meUser, unknown, allStudents } = require("./accounts-mock");

const OUT = process.argv[2];
const W = Number(process.argv[3] || 390);
const H = Number(process.argv[4] || 844);
const ONLY = process.argv[5];
const BASE = "http://localhost:3000/accounts";
const CLS = "/student/cls-7b";
const STUDENT = allStudents.find((s) => s.classroomId === "cls-7b").studentId;

if (!OUT) {
    console.error("Usage: node scripts/ui-tour/accounts-tour.js <outDir> [width] [height] [onlyMatching]");
    process.exit(1);
}

const wait = (p, ms = 450) => p.waitForTimeout(ms);
const btn = (p, name) => p.getByRole("button", { name }).first();

const S = [];
const add = (folder, file, route, steps = async () => {}, full = false) => S.push({ folder, file, route, steps, full });

add("00-navigation", "01-top-bar", "");
add("00-navigation", "02-menu-open", "", async (p) => btn(p, /open menu/i).click());
add("00-navigation", "03-menu-on-student", `${CLS}/details/${STUDENT}`, async (p) => btn(p, /open menu/i).click());

add("01-fees", "01-home-full", "", async () => {}, true);
add("01-fees", "02-fees-not-set", "", async (p) => btn(p, /^show them$/i).click(), true);
add("01-fees", "03-level-primary", "", async (p) => p.getByRole("group", { name: /filter by level/i }).getByRole("button", { name: /^primary/i }).click(), true);
add("01-fees", "04-find-student", "", async (p) => {
    await p.locator("#find-student-search").fill("bose");
    await wait(p, 900);
});
// The flows: each one must land on the right page.
add("01-fees", "05-flow-search-to-student", "", async (p) => {
    await p.locator("#find-student-search").fill("bose");
    await wait(p, 900);
    await p.getByRole("list", { name: /matching students/i }).getByRole("link").first().click();
    await p.waitForURL(/\/accounts\/student\/[^/]+\/details\/[^/]+$/);
}, true);
add("01-fees", "06-flow-open-class", "", async (p) => {
    await p.getByRole("link", { name: /^open /i }).first().click();
    await p.waitForURL(/\/accounts\/student\/[^/]+$/);
}, true);
add("01-fees", "07-fee-settings", "", async (p) => btn(p, /^fee settings for /i).click());
add("01-fees", "08-other-fees-review", "", async (p) => {
    await btn(p, /^add other fees for /i).click();
    await wait(p);
    const d = p.getByRole("dialog");
    await d.getByLabel(/^amount for each student/i).fill("350");
    await d.getByLabel(/^what it's for/i).fill("Science fair kit");
    await d.getByRole("button", { name: /^review$/i }).click();
});
add("02-class", "01-class-fees", CLS, async () => {}, true);
add("02-class", "02-previous-month", CLS, async (p) => btn(p, /^previous month$/i).click(), true);
add("02-class", "03-page-2", CLS, async (p) => p.getByRole("button", { name: "Page 2" }).click(), true);
add("02-class", "04-record-payment", CLS, async (p) => btn(p, /^record payment for /i).click());
add("02-class", "05-flow-view-fees", CLS, async (p) => {
    await p.getByRole("link", { name: /^view fees for /i }).first().click();
    await p.waitForURL(/\/details\/[^/]+$/);
}, true);
add("03-student", "01-student-fees", `${CLS}/details/${STUDENT}`, async () => {}, true);
add("03-student", "02-edit-month", `${CLS}/details/${STUDENT}`, async (p) => btn(p, /^edit .* fees$/i).click());
add("03-student", "03-transport", `${CLS}/details/${STUDENT}`, async (p) => btn(p, /^change school transport$/i).click());
add("03-student", "04-eligibility", `${CLS}/details/${STUDENT}`, async (p) => btn(p, /^change exam eligibility$/i).click());

add("04-payments", "01-all", "/payments", async () => {}, true);
add("04-payments", "02-online", "/payments", async (p) => p.getByRole("group", { name: /filter by payment mode/i }).getByRole("button", { name: /^online/i }).click(), true);
add("04-payments", "03-search", "/payments", async (p) => p.getByLabel(/search payments/i).fill("class 7"), true);
add("04-payments", "04-page-2", "/payments", async (p) => p.getByRole("button", { name: "Page 2" }).click(), true);

add("05-income", "01-income", "/income", async () => {}, true);
add("05-income", "02-record", "/income", async (p) => btn(p, /^record income$/i).click());
add("05-income", "03-edit", "/income", async (p) => btn(p, /^edit /i).click());
add("05-income", "04-delete", "/income", async (p) => btn(p, /^delete /i).click());
add("06-expenses", "01-expenses", "/expenses", async () => {}, true);
add("06-expenses", "02-all-time", "/expenses", async (p) => p.getByRole("group", { name: /^period$/i }).getByRole("button", { name: /^all time$/i }).click(), true);
add("06-expenses", "03-record", "/expenses", async (p) => btn(p, /^record expense$/i).click());

add("07-analysis", "01-this-month", "/analysis", async () => {}, true);
add("07-analysis", "02-previous-month", "/analysis", async (p) => btn(p, /^show (january|february|march|april|may|june|july|august|september|october|november|december)/i).click(), true);
add("07-analysis", "03-bar-tooltip", "/analysis", async (p) => p.getByRole("button", { name: /: income ₹/ }).nth(2).hover());
add("07-analysis", "04-expenses-only", "/analysis", async (p) => p.getByRole("group", { name: /show entries/i }).getByRole("button", { name: /^expenses/i }).click(), true);

add("08-messages", "01-messages", "/messages", async () => {}, true);
add("08-messages", "02-teachers", "/messages", async (p) => p.getByRole("tab", { name: /^class teachers/i }).click(), true);
add("08-messages", "03-students", "/messages", async (p) => p.getByRole("tab", { name: /^students/i }).click(), true);
add("08-messages", "04-conversation", "/messages", async (p) => p.getByRole("button", { name: /^principal/i }).first().click());
add("08-messages", "05-new-message", "/messages", async (p) => btn(p, /^new message$/i).click());

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, reducedMotion: "reduce", isMobile: false });
    await context.addInitScript((user) => {
        localStorage.setItem("accessToken", "mock-token");
        localStorage.setItem("authUser", JSON.stringify(user));
        localStorage.setItem("userRole", "ACCOUNTANT");
    }, meUser);
    await context.route("http://localhost:6969/**", (route) => {
        const req = route.request();
        const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" };
        if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
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
