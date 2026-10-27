const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');
const root = process.env.SHARITY_WORKSPACE_ROOT || path.resolve(__dirname,'../../..');
const {chromium,expect:baseExpect} = createRequire(path.join(root,'sharity-app-ui/package.json'))('@playwright/test');
const expect = baseExpect.configure({timeout:30000});
const origin = process.env.SHARITY_SMOKE_ORIGIN || 'https://vinodbalakumar.com';
const ipv4 = process.env.SHARITY_SMOKE_IPV4;
(async()=>{
  const browser = await chromium.launch({args:['--disable-quic',...(ipv4?[`--host-resolver-rules=MAP ${new URL(origin).hostname} ${ipv4}`]:[])]});
  const context = await browser.newContext(); const page = await context.newPage();page.setDefaultTimeout(30000);
  const report = {checkedAt:new Date().toISOString(),origin,screens:[],publicPages:[],browserErrors:[],mutationsPerformed:false};
  page.on('pageerror',error=>report.browserErrors.push(error.message));
  try {
    const catalogResponse = await context.request.get(`${origin}/bff/public/marketplace-service/api/v1/marketplace/listings`);
    expect(catalogResponse.ok()).toBe(true); const catalog=await catalogResponse.json();
    expect(catalog.length).toBeGreaterThan(0);
    for(const width of [320,390,768,1440]) {
      await page.setViewportSize({width,height:1000}); await page.goto(`${origin}/app/`);
      await expect(page.getByTestId('product-card')).toHaveCount(catalog.length);
      await expect(page.getByTestId('product-card').getByTestId('listing-image')).toHaveCount(catalog.length);
      await expect(page.getByTestId('home-hero-title')).toBeVisible();
      await expect(async()=>expect(await page.getByTestId('product-card').getByTestId('listing-image').evaluateAll(nodes=>nodes.every(node=>{
        const img=node.matches('img')?node:node.querySelector('img');return img?.complete&&img.naturalWidth>0;
      }))).toBe(true)).toPass({timeout:30000});
      await page.screenshot({path:path.join(root,`outputs/live-storefront-${width}-top.png`)});
      const footer=page.getByTestId('site-footer');await expect(footer).toHaveCount(1);
      await page.getByTestId('page-scroll').evaluate(el=>el.scrollTop=el.scrollHeight);
      const dimensions=await footer.boundingBox();expect(dimensions.x).toBeCloseTo(0,0);expect(dimensions.width).toBeCloseTo(width,0);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
      for(const title of ['SHOP','ABOUT','HELP','POLICIES'])await expect(footer.getByRole('heading',{name:title,exact:true})).toBeVisible();
      await page.screenshot({path:path.join(root,`outputs/live-storefront-${width}-footer.png`)});
      report.screens.push({width,footerWidth:dimensions.width,products:catalog.length,imagesLoaded:true,overflow:false});
    }
    for(const [label,slug] of [['About Sharity','about-us'],['Careers','careers'],['Press Center','press'],['Help Center','help-center'],['Contact Support','contact-us'],['Safety Center','safety'],['Terms of Use','terms'],['Privacy Policy','privacy'],['Community Guidelines','guidelines']]) {
      const contentResponse = page.waitForResponse(response=>new URL(response.url()).pathname.endsWith(`/content/pages/${slug}`) && response.status()===200);
      await page.getByTestId('site-footer').getByRole('link',{name:label,exact:true}).click();
      await expect(page).toHaveURL(new RegExp(`/app/(?:company|support|legal)/${slug}$`));
      await expect(page.getByText('Loading approved content...',{exact:true})).toHaveCount(0);
      await expect(page.getByText('This page is unavailable right now.',{exact:true})).toHaveCount(0);
      const response=await contentResponse;expect(response.ok()).toBe(true);
      const body=await response.json();const paragraph=body.sections?.[0]?.paragraphs?.[0];expect(typeof paragraph).toBe('string');
      await expect(page.getByText(paragraph,{exact:true})).toBeVisible();
      report.publicPages.push({slug,status:response.status()});
    }
    expect(report.browserErrors).toEqual([]);report.passed=true;
  } catch(error) {report.failure=String(error);process.exitCode=1;}
  finally {fs.writeFileSync(path.join(root,'outputs/storefront-shell-live.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));await context.close();await browser.close();}
})().catch(error=>{console.error(error.name);process.exitCode=1;});
