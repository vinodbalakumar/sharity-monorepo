import { test, expect, type Page } from "@playwright/test";

async function memberFixture(
  page: Page,
  options: { logoutFailure?: boolean; partialFailure?: boolean } = {},
) {
  let authenticated = true;
  const writes: Record<string, unknown>[] = [];
  const profile = {
    firstName: "Morgan",
    lastName: "Taylor",
    phoneNumber: "2025550118",
    countryCode: "USA",
    countryName: "United States",
    phoneDialCode: "+1",
    dateOfBirth: "1998-06-10",
    gender: "OTHER",
    privacySetting: "LIMITED",
    profileImageUrl: null,
  };
  await page.route("**/*", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (!path.includes("/bff/") && !path.includes("/api/")) return route.continue();
    const send = (data: unknown, status = 200) =>
      route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
    if (path.endsWith("/session"))
      return send({
        authenticated,
        email: "member@example.test",
        publicId: "test-member",
        roles: ["CUSTOMER"],
        csrfToken: "fixture-csrf",
      });
    if (path.endsWith("/logout")) {
      expect(route.request().method()).toBe("POST");
      expect(route.request().headers()["x-csrf-token"]).toBe("fixture-csrf");
      if (options.logoutFailure) return send({ message: "Temporarily unavailable" }, 503);
      authenticated = false;
      return route.fulfill({ status: 204 });
    }
    if (path.endsWith("/users/me/profile")) {
      const body = route.request().postDataJSON();
      writes.push(body);
      Object.assign(profile, body);
      return send(profile);
    }
    if (path.endsWith("/users/me"))
      return send({
        publicId: "test-member",
        email: "member@example.test",
        username: "Morgan",
        status: "ACTIVE",
        profileCompletionStatus: "COMPLETE",
        emailVerified: true,
        roles: ["CUSTOMER"],
        apps: ["SHARITY"],
        profile,
      });
    if (path.endsWith("/users/me/sessions"))
      return options.partialFailure
        ? send({ message: "Unavailable" }, 503)
        : send([{ id: 7, deviceName: "Saved phone", lastUsedAt: "2026-10-25T12:00:00Z" }]);
    if (path.endsWith("/users/me/social-links")) return send([{ provider: "GOOGLE" }]);
    if (path.endsWith("/registration-options"))
      return send({
        countries: [
          {
            countryCode: "USA",
            countryName: "United States",
            phoneDialCode: "+1",
            defaultCurrencyCode: "USD",
          },
          { countryCode: "IND", countryName: "India", phoneDialCode: "+91", defaultCurrencyCode: "INR" },
        ],
        genders: [
          { code: "OTHER", label: "Other" },
          { code: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
        ],
      });
    if (path.endsWith("/context"))
      return send({ countryCode: "USA", countrySupported: true, locale: "en-US" });
    if (path.endsWith("/home"))
      return send({ categories: [], featuredListings: [], trendingListings: [], marketplaces: [] });
    if (path.endsWith("/listings")) return send([]);
    return send({});
  });
  return writes;
}

for (const width of [320, 390, 768, 1440]) {
  test(`profile layout, editable fields and privacy at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const writes = await memberFixture(page);
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/app/profile");
    await expect(page.getByRole("heading", { name: "Account settings", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeInViewport({ratio:1});
    await expect(page.getByLabel("First name", { exact: true })).toHaveValue("Morgan");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const font = await page.getByLabel('First name', {exact:true}).evaluate(el => ({family:getComputedStyle(el).fontFamily,size:getComputedStyle(el).fontSize}));
    expect(font.family).not.toMatch(/^(?:"Times New Roman"|serif)$/i);
    expect(font.size).toBe('16px');
    await page.screenshot({path:`../outputs/member-profile-${test.info().project.name}-${width}.png`,fullPage:true});
    await expect(page.getByRole("button", { name: "Save changes", exact: true })).toBeDisabled();
    await page.getByLabel("First name", { exact: true }).fill("Morgan updated");
    await page.getByLabel("Date of birth", { exact: true }).fill("1998-07-11");
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(page.getByText("Your changes have been saved.", { exact: true })).toBeVisible();
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({
      firstName: "Morgan updated",
      dateOfBirth: "1998-07-11",
      privacySetting: "LIMITED",
    });
    await page.getByLabel("First name", { exact: true }).fill("Discard me");
    await page.getByRole("button", { name: "Discard changes", exact: true }).click();
    await expect(page.getByLabel("First name", { exact: true })).toHaveValue("Morgan updated");
    await page.getByRole("tab", { name: "Privacy", exact: true }).click();
    await expect(page.getByRole("radio", { name: "Visible after an order", exact: true })).toBeChecked();
    await page.getByRole("radio", { name: "Private", exact: true }).click();
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(page.getByText("Your changes have been saved.", { exact: true })).toBeVisible();
    expect(writes[1]).toMatchObject({ privacySetting: "PRIVATE" });
    await page.getByRole("tab", { name: "Security & devices", exact: true }).click();
    await expect(page.getByText("This browser", { exact: true })).toBeVisible();
    await expect(page.getByText("Current", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Revoke", exact: true })).toHaveCount(1);
    const issues = await page.evaluate(() => {
      const result: string[] = [];
      if (document.documentElement.scrollWidth > innerWidth + 1) result.push("Page overflow");
      for (const el of Array.from(document.querySelectorAll(
        'button,input,[role="button"],[role="tab"],[role="radio"]',
      ))) {
        const r = el.getBoundingClientRect();
        if (r.width && r.height && (r.left < -1 || r.right > innerWidth + 1)) result.push("Control overflow");
      }
      return result;
    });
    expect(issues).toEqual([]);
    expect(errors).toEqual([]);
  });
}

for (const path of [
  "/app/home",
  "/app/marketplaces",
  "/app/orders",
  "/app/wallet",
  "/app/profile",
  "/chat",
]) {
  test(`sign out is accessible without visiting profile: ${path}`, async ({ page }) => {
    await memberFixture(page);
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(path);
    const signOut = page.getByRole("button", { name: "Sign out", exact: true });
    await expect(signOut).toBeInViewport({ratio:1});
    await signOut.click();
    await expect(page).toHaveURL(/\/app\/$/);
    await expect(page.getByRole("button", { name: "Sign in", exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out", exact: true })).toHaveCount(0);
    await page.goBack();
    await expect(page.getByRole("button", { name: "Sign out", exact: true })).toHaveCount(0);
  });
}

test("logout failure stays signed in and offers retry", async ({ page }) => {
  await memberFixture(page, { logoutFailure: true });
  await page.goto("/app/profile");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Could not sign out. Try again.");
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue("Morgan");
  await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeEnabled();
});

test("device-service failure does not hide personal details", async ({ page }) => {
  await memberFixture(page, { partialFailure: true });
  await page.goto("/app/profile");
  await expect(page.getByLabel("First name", { exact: true })).toHaveValue("Morgan");
  await expect(
    page.getByText("Some account options are temporarily unavailable.", { exact: false }),
  ).toBeVisible();
});

test('failed save preserves edits and can be retried', async ({page}) => {
  await memberFixture(page);
  await page.route('**/users/me/profile', route => route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({message:'Profile update temporarily unavailable'})}));
  await page.goto('/app/profile');
  await page.getByLabel('First name',{exact:true}).fill('Keep this edit');
  await page.getByRole('button',{name:'Save changes',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Profile update temporarily unavailable');
  await expect(page.getByLabel('First name',{exact:true})).toHaveValue('Keep this edit');
  await expect(page.getByRole('button',{name:'Save changes',exact:true})).toBeEnabled();
});

test('cancelling a photo selection restores the upload action', async ({page}) => {
  await memberFixture(page); await page.goto('/app/profile');
  await expect(page.getByLabel('First name',{exact:true})).toBeVisible();
  const chooser=page.waitForEvent('filechooser');
  await page.getByRole('button',{name:'Change profile photo',exact:true}).click();
  await chooser;
  await page.locator('input[type=file]').evaluate(el=>el.dispatchEvent(new Event('cancel')));
  await expect(page.getByRole('button',{name:'Change profile photo',exact:true})).toBeEnabled();
});

test('a verified new login clears the previous local logout marker', async ({page}) => {
  await memberFixture(page);
  await page.addInitScript(()=>localStorage.setItem('sharity_logout_override','1'));
  await page.goto('/app/profile?login=success');
  await expect(page.getByLabel('First name',{exact:true})).toHaveValue('Morgan');
  await expect(page.getByRole('button',{name:'Sign out',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('sharity_logout_override'))).toBeNull();
});
