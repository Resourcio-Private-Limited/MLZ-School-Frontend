// Tour of the Teacher portal against a mocked API (no backend writes, no credentials).
// Usage (from the project root, dev server on :3000): node scripts/ui-tour/teacher-tour.js <outDir> [width] [height] [onlyMatching]
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");
const { respond, me, teacherId, state } = require("./teacher-mock");

const OUT = process.argv[2];
const W = Number(process.argv[3] || 390);
const H = Number(process.argv[4] || 844);
const ONLY = process.argv[5];
const BASE = "http://localhost:3000/teacher";
const CLS = "/classroom/cls-7b";

const wait = (p, ms = 450) => p.waitForTimeout(ms);
const btn = (p, name) => p.getByRole("button", { name }).first();

const S = [];
// marked: whether today's register is already saved in the mock.
const add = (folder, file, route, steps = async () => {}, full = false, marked = false) => S.push({ folder, file, route, steps, full, marked });

add("00-navigation", "01-top-bar", "");
add("00-navigation", "02-menu-open", "", async (p) => btn(p, /open menu/i).click());
add("00-navigation", "03-menu-on-classroom", CLS, async (p) => btn(p, /open menu/i).click());

add("01-home", "01-home-full", "", async () => {}, true);

add("02-classroom", "01-overview", CLS, async () => {}, true);
add("02-classroom", "02-subject-teacher-view", "/classroom/cls-8a", async () => {}, true);
add("02-classroom", "03-students", `${CLS}/students`, async () => {}, true);
add("02-classroom", "04-students-absent", `${CLS}/students`, async (p) => p.getByRole("group", { name: /filter by last attendance/i }).getByRole("button", { name: /^absent/i }).click(), true);
add("02-classroom", "05-students-page-2", `${CLS}/students`, async (p) => p.getByRole("button", { name: "Page 2" }).click(), true);

add("03-attendance", "01-not-marked", `${CLS}/attendance`, async () => {}, true);
add("03-attendance", "02-mark-dialog", `${CLS}/attendance`, async (p) => {
    await btn(p, /^mark attendance$/i).click();
    await wait(p);
    const d = p.getByRole("dialog");
    await d.getByRole("switch").nth(3).click();
    await d.getByRole("switch").nth(8).click();
});
add("03-attendance", "03-review", `${CLS}/attendance`, async (p) => {
    await btn(p, /^mark attendance$/i).click();
    await wait(p);
    const d = p.getByRole("dialog");
    await d.getByRole("switch").nth(3).click();
    await d.getByRole("switch").nth(8).click();
    await d.getByRole("button", { name: /^review$/i }).click();
});
add("03-attendance", "04-marked", `${CLS}/attendance`, async () => {}, true, true);
add("03-attendance", "05-subject-teacher-view-only", "/classroom/cls-8a/attendance", async () => {}, true);
add("03-attendance", "06-history", `${CLS}/attendance/history`, async () => {}, true, true);
add("03-attendance", "07-history-day", `${CLS}/attendance/history`, async (p) => {
    const view = p.getByRole("button", { name: /view register/i }).first();
    await view.click();
    await wait(p, 700);
}, false, true);
add("03-attendance", "08-history-previous-month", `${CLS}/attendance/history`, async (p) => btn(p, /previous month/i).click(), true, true);

add("04-announcements", "01-list", `${CLS}/announcements`, async () => {}, true);
add("04-announcements", "02-composer", `${CLS}/announcements`, async (p) => {
    await btn(p, /new announcement/i).click();
    await wait(p);
    await p.getByLabel(/^title/i).fill("Poem recitation round");
    await p.getByLabel(/^message/i).fill("Pick one poem from chapter 4 for next Tuesday's recitation round.");
    await p.getByLabel(/attachment link/i).fill("drive.google.com/abc");
}, true);

add("05-messages", "01-students", "/messages", async () => {}, true);
add("05-messages", "02-other-section", "/messages", async (p) => p.getByRole("group", { name: /^section$/i }).getByRole("button", { name: /section a/i }).click(), true);
add("05-messages", "03-office-read-only", "/messages", async (p) => p.getByRole("tab", { name: /school office/i }).click());
add("05-messages", "04-conversation", "/messages?class=cls-7b&to=u-cls-7b-s3");
add("05-messages", "05-read-only-conversation", "/messages", async (p) => {
    await p.getByRole("tab", { name: /school office/i }).click();
    await btn(p, /accountant/i).click();
});
add("05-messages", "06-new-message", "/messages", async (p) => {
    await btn(p, /new message/i).click();
    await wait(p);
    const d = p.getByRole("dialog");
    await d.locator("select").selectOption("u-p1");
    await d.locator("textarea").fill("Ma'am, the half-yearly English marks for 7B are entered. Please review.");
});

add("06-noticeboard", "01-all", "/noticeboard", async () => {}, true);

add("07-marks", "01-class-exam-marks", `${CLS}/exams`, async () => {}, true);
add("07-marks", "02-class-exam-edit", `${CLS}/exams`, async (p) => {
    await p.getByRole("button", { name: /marks for/i }).first().click();
    await wait(p);
    await p.getByRole("dialog").getByRole("spinbutton").fill("72");
});
add("07-marks", "03-final-locked", `${CLS}/exams`, async (p) => p.getByRole("group", { name: /^exam$/i }).getByRole("button", { name: /^final/i }).click(), true);
add("07-marks", "04-primary-grades", "/classroom/cls-3a/exams", async (p) => {
    await p.getByRole("group", { name: /^exam$/i }).getByRole("button", { name: /half-yearly/i }).click();
    await wait(p);
    await p.getByRole("button", { name: /marks for/i }).first().click();
});
add("07-marks", "05-marks-entry", "/exams", async () => {}, true);
add("07-marks", "06-marks-entry-missing", "/exams", async (p) => p.getByRole("group", { name: /^show$/i }).getByRole("button", { name: /not entered/i }).click(), true);

add("08-profile", "01-profile", "/profile", async () => {}, true);

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, reducedMotion: "reduce", isMobile: false });
    await context.addInitScript(([id, tid]) => {
        localStorage.setItem("accessToken", "mock-token");
        localStorage.setItem("authUser", JSON.stringify({ id, role: "TEACHER", teacher: { id: tid } }));
    }, [me, teacherId]);
    await context.route("http://localhost:6969/**", (route) => {
        const req = route.request();
        const body = req.method() === "GET" ? respond(req.url()) : { id: "new", success: true, count: 1 };
        return route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) });
    });
    const page = await context.newPage();
    const failures = [];
    const overflow = [];
    let n = 0;
    const run = S.filter((x) => !ONLY || `${x.folder}/${x.file}`.includes(ONLY));
    for (const s of run) {
        try {
            state.todayMarked = s.marked;
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
    await browser.close();
})();
