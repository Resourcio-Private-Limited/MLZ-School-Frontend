// Tour of the Student portal against a mocked API (no backend writes, no credentials).
// Usage (from the project root, dev server on :3000): node scripts/ui-tour/student-tour.js <outDir> [width] [height] [onlyMatching]
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");
const { respond, me } = require("./student-mock");

const OUT = process.argv[2];
const W = Number(process.argv[3] || 390);
const H = Number(process.argv[4] || 844);
const ONLY = process.argv[5];
const BASE = "http://localhost:3000/student";

const wait = (p, ms = 450) => p.waitForTimeout(ms);
const btn = (p, name) => p.getByRole("button", { name }).first();

const S = [];
const add = (folder, file, route, steps = async () => {}, full = false) => S.push({ folder, file, route, steps, full });

add("00-navigation", "01-top-bar", "");
add("00-navigation", "02-menu-open", "", async (p) => btn(p, /open menu/i).click());
add("00-navigation", "03-menu-on-messages", "/classroom/messages", async (p) => btn(p, /open menu/i).click());

add("01-home", "01-home-full", "", async () => {}, true);

add("02-classroom", "01-classroom", "/classroom", async () => {}, true);
add("02-classroom", "02-announcements", "/classroom/announcements?classroomId=cls-7b", async () => {}, true);
add("02-classroom", "03-announcements-by-teacher", "/classroom/announcements?classroomId=cls-7b", async (p) => p.getByRole("group", { name: /filter by teacher/i }).getByRole("button", { name: /Arnab/ }).click(), true);
add("02-classroom", "04-announcements-page-2", "/classroom/announcements?classroomId=cls-7b", async (p) => p.getByRole("button", { name: "Page 2" }).click(), true);

add("03-messages", "01-teachers", "/classroom/messages", async () => {}, true);
add("03-messages", "02-office-read-only", "/classroom/messages", async (p) => p.getByRole("tab", { name: /school office/i }).click());
add("03-messages", "03-conversation", "/classroom/messages", async (p) => btn(p, /Rituparna/).click());
add("03-messages", "04-read-only-conversation", "/classroom/messages", async (p) => {
    await p.getByRole("tab", { name: /school office/i }).click();
    await btn(p, /Priyanka/).click();
});
add("03-messages", "05-new-message", "/classroom/messages", async (p) => {
    await btn(p, /new message/i).click();
    await wait(p);
    const d = p.getByRole("dialog");
    await d.locator("select").selectOption("u-t2");
    await d.locator("textarea").fill("Sir, could you explain question 4 of exercise 6.3 again tomorrow?");
});
add("03-messages", "06-deep-link-from-classroom", "/classroom/messages?to=u-t3");

add("04-noticeboard", "01-all", "/noticeboard", async () => {}, true);
add("04-noticeboard", "02-filter-events", "/noticeboard", async (p) => p.getByRole("group", { name: /filter by category/i }).getByRole("button", { name: /events/i }).click(), true);
add("04-noticeboard", "03-search-none", "/noticeboard", async (p) => p.getByPlaceholder(/search notices/i).fill("zzzz"));

add("05-exams", "01-upcoming", "/exams", async () => {}, true);
add("05-exams", "02-past", "/exams", async (p) => p.getByRole("tab", { name: /past/i }).click(), true);
add("05-exams", "03-admit-cards", "/admit-cards", async () => {}, true);
add("05-exams", "04-admit-card-preview", "/admit-cards", async (p) => btn(p, /^preview$/i).click());

add("06-payment", "01-payment-full", "/payment", async () => {}, true);
add("06-payment", "02-months-selected", "/payment", async (p) => {
    const boxes = p.getByRole("checkbox");
    await boxes.nth(0).check();
    await boxes.nth(1).check();
    await wait(p);
}, false);
add("06-payment", "03-all-months", "/payment", async (p) => p.getByRole("group", { name: /show months/i }).getByRole("button", { name: /^all months/i }).click(), true);
add("06-payment", "04-receipt", "/payment", async (p) => {
    await p.getByRole("group", { name: /show months/i }).getByRole("button", { name: /^paid/i }).click();
    await p.getByRole("button", { name: /^view the january receipt/i }).click();
    await wait(p, 900);
});

add("07-profile", "01-profile", "/profile", async () => {}, true);
add("07-profile", "02-change-password", "/profile/reset-password", async (p) => {
    await p.getByLabel(/^new password/i).fill("secret12");
    await p.getByLabel(/^confirm new password/i).fill("secret1");
    await p.getByLabel(/^new password/i).focus();
    await wait(p, 200);
});

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, reducedMotion: "reduce", isMobile: false });
    await context.addInitScript((id) => {
        localStorage.setItem("accessToken", "mock-token");
        localStorage.setItem("authUser", JSON.stringify({ id, role: "STUDENT" }));
    }, me);
    await context.route("http://localhost:6969/**", (route) => {
        const req = route.request();
        const body = req.method() === "GET" ? respond(req.url()) : { id: "new" };
        return route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) });
    });
    const page = await context.newPage();
    const failures = [];
    const overflow = [];
    let n = 0;
    for (const s of S.filter((x) => !ONLY || `${x.folder}/${x.file}`.includes(ONLY))) {
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
    console.log(`saved ${n}/${S.filter((x) => !ONLY || `${x.folder}/${x.file}`.includes(ONLY)).length} at ${W}x${H}`);
    if (overflow.length) console.log("HORIZONTAL OVERFLOW:\n" + overflow.join("\n"));
    if (failures.length) console.log("FAILED:\n" + failures.join("\n"));
    await browser.close();
})();
