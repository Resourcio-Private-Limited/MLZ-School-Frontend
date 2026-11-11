// Full mobile tour of the Super Admin portal, against a mocked API (no backend writes, no credentials).
// Usage (from the project root, dev server on :3000): node scripts/ui-tour/tour.js <outDir> [width] [height] [onlyMatching]
// Captures Super Admin screens; add scenarios and mock endpoints to cover other portals.
const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");
const { respond } = require("./mock");

const OUT = process.argv[2];
const W = Number(process.argv[3] || 390);
const H = Number(process.argv[4] || 844);
const ONLY = process.argv[5];
const BASE = "http://localhost:3000/super-admin";

const wait = (p, ms = 450) => p.waitForTimeout(ms);
const btn = (p, name) => p.getByRole("button", { name }).first();

// Each scenario: [folder, file, route, steps(page), fullPage]
const S = [];
const add = (folder, file, route, steps = async () => {}, full = false) => S.push({ folder, file, route, steps, full });

// Navigation
add("00-navigation", "01-top-bar", "", async () => {}, false);
add("00-navigation", "02-menu-open", "", async (p) => btn(p, /open menu/i).click());
add("00-navigation", "03-menu-on-finance-page", "/income", async (p) => btn(p, /open menu/i).click());

// Dashboard
add("01-dashboard", "01-dashboard-full", "", async () => {}, true);
add("01-dashboard", "02-transactions-income-only", "", async (p) => {
    await p.getByRole("group", { name: /show transactions/i }).getByRole("button", { name: "Income" }).click();
    await p.getByText("Latest transactions").scrollIntoViewIfNeeded();
});
add("01-dashboard", "03-transactions-expenses-only", "", async (p) => {
    await p.getByRole("group", { name: /show transactions/i }).getByRole("button", { name: "Expenses" }).click();
    await p.getByText("Latest transactions").scrollIntoViewIfNeeded();
});

// Users
add("02-users", "01-teachers", "/users", async () => {}, true);
add("02-users", "02-staff", "/users", async (p) => p.getByRole("tab", { name: /staff/i }).click(), true);
add("02-users", "03-students", "/users", async (p) => p.getByRole("tab", { name: /students/i }).click(), true);
add("02-users", "04-search-results", "/users", async (p) => p.getByLabel(/search teachers/i).fill("Ghosh"), true);
add("02-users", "05-search-no-match", "/users", async (p) => p.getByLabel(/search teachers/i).fill("zzzz"));
add("02-users", "06-password-revealed", "/users", async (p) => p.getByRole("button", { name: /^show password for/i }).first().click());
add("02-users", "07-deactivate-with-undo", "/users", async (p) => {
    await p.getByRole("switch").first().click();
    await wait(p, 700);
});
add("02-users", "08-add-user-modal", "/users", async (p) => btn(p, /^add user$/i).click());
add("02-users", "09-add-user-modal-scrolled", "/users", async (p) => {
    await btn(p, /^add user$/i).click();
    await wait(p);
    await p.mouse.wheel(0, 900);
});
add("02-users", "10-edit-user-modal", "/users", async (p) => p.getByRole("button", { name: /^edit /i }).first().click());
add("02-users", "11-change-password-modal", "/users", async (p) => p.getByRole("button", { name: /^change password for/i }).first().click());

// Notice board
add("03-noticeboard", "01-all-notices", "/noticeboard", async () => {}, true);
add("03-noticeboard", "02-filter-exams", "/noticeboard", async (p) => p.getByRole("group", { name: /filter by category/i }).getByRole("button", { name: /exams/i }).click(), true);
add("03-noticeboard", "03-search", "/noticeboard", async (p) => p.getByPlaceholder(/search notices/i).fill("sports"), true);
add("03-noticeboard", "04-new-notice-empty", "/noticeboard", async (p) => btn(p, /new notice/i).click());
add("03-noticeboard", "05-new-notice-filled", "/noticeboard", async (p) => {
    await btn(p, /new notice/i).click();
    await wait(p);
    await p.getByLabel(/^title/i).fill("Parent–teacher meeting on Saturday");
    await p.getByText("Events", { exact: true }).last().click();
    await p.getByLabel(/^message/i).fill("Parents of Classes 6 to 10 are invited to meet class teachers between 9 am and 1 pm in the main building.");
    await p.getByLabel(/^link/i).fill("https://mlzs.in/ptm");
}, true);
add("03-noticeboard", "06-edit-notice", "/noticeboard", async (p) => p.getByRole("button", { name: /^edit “/i }).first().click(), true);
add("03-noticeboard", "07-delete-confirmation", "/noticeboard", async (p) => p.getByRole("button", { name: /^delete “/i }).first().click());

// Messages
add("04-messages", "01-principals", "/messages", async () => {});
add("04-messages", "02-accountants", "/messages", async (p) => p.getByRole("tab", { name: /accountants/i }).click());
add("04-messages", "03-teachers", "/messages", async (p) => p.getByRole("tab", { name: /teachers/i }).click(), true);
add("04-messages", "04-students-by-class", "/messages", async (p) => p.getByRole("tab", { name: /students/i }).click(), true);
add("04-messages", "05-students-class-7-section-b", "/messages", async (p) => {
    await p.getByRole("tab", { name: /students/i }).click();
    await p.getByRole("button", { name: "Class 7", exact: true }).click();
    await p.getByRole("button", { name: "Section B" }).click();
}, true);
add("04-messages", "06-students-recent", "/messages", async (p) => {
    await p.getByRole("tab", { name: /students/i }).click();
    await p.getByRole("button", { name: "Recent" }).click();
});
add("04-messages", "07-search-across-tabs", "/messages", async (p) => p.getByLabel(/search people/i).fill("Das"), true);
add("04-messages", "08-conversation", "/messages", async (p) => btn(p, /Sunita/).click());
add("04-messages", "09-conversation-typing", "/messages", async (p) => {
    await btn(p, /Sunita/).click();
    await wait(p);
    await p.getByLabel(/^message dr/i).fill("I will send the revised budget by Thursday evening.");
});
add("04-messages", "10-new-message-empty", "/messages", async (p) => btn(p, /new message/i).click());
add("04-messages", "11-new-message-to-student", "/messages", async (p) => {
    await btn(p, /new message/i).click();
    await wait(p);
    const d = p.getByRole("dialog");
    await d.locator("select").nth(0).selectOption("STUDENT");
    await wait(p, 200);
    await d.locator("select").nth(1).selectOption("Class 5 - Section A");
    await wait(p, 200);
    await d.locator("select").nth(2).selectOption({ index: 1 });
    await d.locator("textarea").fill("Please collect your science project kit from the lab on Monday.");
});

// Financial overview
add("05-financial", "01-overview-full", "/financial", async () => {}, true);
add("05-financial", "02-previous-month", "/financial", async (p) => p.getByRole("button", { name: /^show /i }).first().click(), true);
add("05-financial", "03-chart-month-details", "/financial", async (p) => {
    const bar = p.getByRole("button", { name: /^October \d{4}:/ });
    await bar.scrollIntoViewIfNeeded();
    await p.mouse.wheel(0, -120);
    await bar.hover();
});
add("05-financial", "04-entries-income-only", "/financial", async (p) => {
    await p.getByRole("group", { name: /show entries/i }).getByRole("button", { name: "Income" }).click();
    await p.getByText(/^Entries in/).scrollIntoViewIfNeeded();
});
add("05-financial", "05-entries-expenses-only", "/financial", async (p) => {
    await p.getByRole("group", { name: /show entries/i }).getByRole("button", { name: "Expenses" }).click();
    await p.getByText(/^Entries in/).scrollIntoViewIfNeeded();
});

// Income and expenses share one layout
for (const [folder, route, noun, title, cat, party] of [
    ["06-income", "/income", "income", "Annual day ticket sales", "Events", null],
    ["07-expenses", "/expenses", "expense", "Projector repair for Room 12", "Maintenance", "Bright Electronics"],
]) {
    add(folder, "01-academic-year", route, async () => {}, true);
    add(folder, "02-this-month", route, async (p) => btn(p, /this month/i).click(), true);
    add(folder, "03-all-time", route, async (p) => btn(p, /all time/i).click());
    add(folder, "04-category-tab", route, async (p) => p.getByRole("tab", { name: new RegExp(`^${noun === "income" ? "Donations" : "Salaries"}`) }).click(), true);
    add(folder, "05-sorted-largest-first", route, async (p) => {
        await p.locator('select:has(option[value="amount-desc"])').selectOption("amount-desc");
        await p.getByRole("tablist", { name: /category/i }).scrollIntoViewIfNeeded();
    });
    add(folder, "06-search", route, async (p) => p.getByPlaceholder(/search/i).fill(noun === "income" ? "donation" : "bill"), true);
    add(folder, "07-record-modal", route, async (p) => btn(p, new RegExp(`^record ${noun}$`, "i")).click());
    add(folder, "08-record-modal-needs-amount", route, async (p) => {
        await btn(p, new RegExp(`^record ${noun}$`, "i")).click();
        await wait(p);
        await p.getByRole("dialog").locator("input").first().fill(title);
    });
    add(folder, "09-record-modal-cheque-filled", route, async (p) => {
        await btn(p, new RegExp(`^record ${noun}$`, "i")).click();
        await wait(p);
        const d = p.getByRole("dialog");
        await d.locator("input").first().fill(title);
        if (party) await d.getByLabel(/paid to/i).fill(party);
        await d.getByLabel(/^amount/i).fill("18500");
        await d.getByText(cat, { exact: true }).click();
        await d.getByText("Cheque", { exact: true }).click();
        await d.getByLabel(/cheque number/i).fill("204517");
        await p.mouse.wheel(0, 600);
    });
    add(folder, "10-recorded-toast", route, async (p) => {
        await btn(p, new RegExp(`^record ${noun}$`, "i")).click();
        await wait(p);
        const d = p.getByRole("dialog");
        await d.locator("input").first().fill(title);
        await d.getByLabel(/^amount/i).fill("18500");
        await d.getByRole("button", { name: new RegExp(`^record ${noun}$`, "i") }).click();
        await wait(p, 700);
    });
}

// Profile
add("08-profile", "01-profile", "/profile", async () => {}, true);
add("08-profile", "02-edit-details", "/profile", async (p) => btn(p, /edit details/i).click(), true);
add("08-profile", "03-saved-toast", "/profile", async (p) => {
    await btn(p, /edit details/i).click();
    await wait(p);
    await btn(p, /save changes/i).click();
    await wait(p, 700);
});

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 3, reducedMotion: "reduce", isMobile: false });
    await context.addInitScript(() => {
        localStorage.setItem("accessToken", "mock-token");
        localStorage.setItem("authUser", JSON.stringify({ id: "sa-1", role: "SUPER_ADMIN" }));
    });
    await context.route("http://localhost:6969/**", (route) => {
        const req = route.request();
        const body = req.method() === "GET" ? respond(req.url()) : { id: "new", fullName: "Vikram Seth" };
        return route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) });
    });
    const page = await context.newPage();
    const failures = [];
    let n = 0;
    for (const s of S.filter((x) => !ONLY || `${x.folder}/${x.file}`.includes(ONLY))) {
        try {
            await page.goto(`${BASE}${s.route}`, { waitUntil: "networkidle" });
            await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
            await wait(page, 600);
            await s.steps(page);
            await wait(page, 500);
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
    console.log(`saved ${n}/${S.length}`);
    if (failures.length) console.log("FAILED:\n" + failures.join("\n"));
    await browser.close();
})();
