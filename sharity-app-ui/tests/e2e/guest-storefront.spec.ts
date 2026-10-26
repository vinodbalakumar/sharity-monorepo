import { test, expect, type Page } from "@playwright/test";
const item = {
  publicId: "guest-gift",
  title: "Steam gift card",
  description: "Gift card details",
  productType: "DIGITAL",
  deliveryType: "CODE",
  currencyCode: "USD",
  priceAmount: 20,
  imageUrl: null,
  categoryCode: "GIFT_CARDS",
  verticalCode: "MARKETPLACE",
  listingStatus: "ACTIVE",
  publicReviews: [],
  createdAt: "2026-10-25T12:00:00Z",
};
async function mock(page: Page, authenticated = false) {
  const privateRequests: string[] = [];
  await page.route("**/bff/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    const send = (body: unknown, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    if (path.endsWith("/session"))
      return send({ authenticated, roles: authenticated ? ["CUSTOMER"] : [] });
    if (path.endsWith("/context"))
      return send({
        countryCode: "USA",
        countrySupported: true,
        locale: "en-US",
      });
    if (path.endsWith("/home"))
      return send({ verticals: [], categories: [], featuredListings: [item] });
    if (path.endsWith("/listings")) return send([item]);
    if (path.endsWith("/listings/guest-gift")) return send(item);
    if (path.endsWith("/login"))
      return route.fulfill({
        contentType: "text/html",
        body: '<h1>Sign in to Sharity</h1><input aria-label="Email" />',
      });
    if (path.includes("/bff/api/")) privateRequests.push(path);
    return send({});
  });
  return privateRequests;
}
for (const path of ["/app/", "/app/?login=success", "/app/home", "/app/orders"])
  test(`anonymous ${path} opens landing without private calls`, async ({
    page,
  }) => {
    const privateRequests = await mock(page);
    await page.goto(path);
    await expect(page.getByTestId("guest-storefront")).toBeVisible();
    await expect(page).toHaveURL(/\/app\/$/);
    await expect(page.getByTestId("member-storefront")).toHaveCount(0);
    await page.evaluate(() => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("pageshow"));
    });
    await expect(page.getByTestId("guest-storefront")).toBeVisible();
    expect(privateRequests).toEqual([]);
  });
test("sign-in and browser Back retain public browsing and product deep links", async ({
  page,
}) => {
  const privateRequests = await mock(page);
  await page.goto("/app/marketplaces");
  await page
    .getByRole("button", { name: "View Steam gift card", exact: true })
    .click();
  await expect(page).toHaveURL(/\/app\/products\/guest-gift$/);
  await expect(
    page.getByText("Steam gift card", { exact: true }).first(),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Steam gift card", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Sign in", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Sign in to Sharity" }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/app\/products\/guest-gift$/);
  await expect(
    page.getByText("Steam gift card", { exact: true }).first(),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/app\/marketplaces$/);
  await expect(page.getByTestId("product-card")).toHaveCount(1);
  expect(privateRequests).toEqual([]);
});
test("verified sign-in restores only a valid intended route", async ({
  page,
}) => {
  await mock(page, true);
  await page.addInitScript(() =>
    sessionStorage.setItem(
      "sharity_login_return",
      JSON.stringify({
        savedAt: Date.now(),
        snapshot: { route: "digitalProduct", digitalProductId: "guest-gift" },
      }),
    ),
  );
  await page.goto("/app/?login=success");
  await expect(page).toHaveURL(/\/app\/products\/guest-gift$/);
  await expect(
    page.getByText("Steam gift card", { exact: true }).first(),
  ).toBeVisible();
  expect(
    await page.evaluate(() => sessionStorage.getItem("sharity_login_return")),
  ).toBeNull();
});
test("invalid return intent cannot redirect outside the app", async ({
  page,
}) => {
  await mock(page, true);
  await page.addInitScript(() =>
    sessionStorage.setItem(
      "sharity_login_return",
      JSON.stringify({
        savedAt: Date.now(),
        snapshot: { route: "https://example.com" },
      }),
    ),
  );
  await page.goto("/app/?login=success");
  await expect(page.getByTestId("member-storefront")).toBeVisible();
  await expect(page).toHaveURL(/\/app\/home$/);
});

for (const width of [320, 390, 430, 768, 1440])
  test(`guest landing typography and layout at ${width}px`, async ({
    page,
  }) => {
    await mock(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/app/");
    await expect(page.getByTestId("product-card")).toHaveCount(1);
    await page.evaluate(() => document.fonts.ready);
    const problems = await page.evaluate(() => {
      const issues: string[] = [];
      if (document.documentElement.scrollWidth > innerWidth + 1)
        issues.push("Horizontal overflow");
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
      );
      while (walker.nextNode()) {
        const node = walker.currentNode,
          el = node.parentElement;
        if (!el || !node.textContent?.trim()) continue;
        const css = getComputedStyle(el),
          rect = el.getBoundingClientRect();
        if (
          !rect.width ||
          !rect.height ||
          /ionicons|material|fontawesome/i.test(css.fontFamily)
        )
          continue;
        if (parseFloat(css.fontSize) < 11)
          issues.push(`Small font: ${node.textContent}`);
        if (/Times New Roman|^serif$/i.test(css.fontFamily))
          issues.push("Unexpected font");
      }
      return issues;
    });
    expect(problems).toEqual([]);
    await page.getByLabel("Search marketplace", { exact: true }).fill("Steam");
    await expect(page.getByText("1 matching listings")).toBeVisible();
  });

for(const width of [320,390,768,1024,1440])test(`product media and summary do not overlap at ${width}px`,async({page})=>{
 await mock(page);await page.setViewportSize({width,height:900});await page.goto('/app/products/guest-gift');
 await expect(page.getByTestId('product-summary')).toBeVisible();
 const gallery=await page.getByTestId('product-gallery').boundingBox();
 const summary=await page.getByTestId('product-summary').boundingBox();
 expect(gallery!.height).toBeGreaterThan(240);expect(summary!.height).toBeGreaterThan(200);
 if(width<992)expect(summary!.y).toBeGreaterThanOrEqual(gallery!.y+gallery!.height);
 else expect(summary!.x).toBeGreaterThanOrEqual(gallery!.x+gallery!.width);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
test('sign-out clears private navigation before browser Back',async({page})=>{
 await mock(page,true);let authenticated=true;
 await page.route('**/bff/session',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({authenticated,publicId:'buyer',roles:authenticated?['CUSTOMER']:[],csrfToken:'test-csrf'})}));
 await page.route('**/bff/logout',route=>{authenticated=false;return route.fulfill({status:204});});
 await page.route('**/users/me',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({publicId:'buyer',username:'buyer',profile:{countryCode:'USA'},roles:['CUSTOMER']})}));
 await page.route('**/users/me/sessions',route=>route.fulfill({contentType:'application/json',body:'[]'}));
 await page.route('**/users/me/social-links',route=>route.fulfill({contentType:'application/json',body:'[]'}));
 await page.route('**/public/registration-options',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({countries:[],genders:[]})}));
 await page.goto('/app/home');await expect(page.getByTestId('member-storefront')).toBeVisible();
 await page.getByRole('button',{name:'Profile',exact:true}).click();
 await page.getByRole('button',{name:'Sign out',exact:true}).click();
 await expect(page.getByTestId('guest-storefront')).toBeVisible();
 await page.goBack();await expect(page.getByTestId('guest-storefront')).toBeVisible();
 await expect(page).toHaveURL(/\/app\/$/);
});
