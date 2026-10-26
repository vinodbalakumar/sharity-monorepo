const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({args:['--disable-quic','--host-resolver-rules=MAP vinodbalakumar.com 104.21.85.140']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const report={checkedAt:new Date().toISOString(),checks:[],errors:[],privateRequests:[]};
 page.on('pageerror',error=>report.errors.push(error.message));
 page.on('request',request=>{if(new URL(request.url()).pathname.startsWith('/bff/api/'))report.privateRequests.push(new URL(request.url()).pathname);});
 try{
  await page.goto('https://vinodbalakumar.com/app/',{waitUntil:'domcontentloaded'});
  await expect(page.getByTestId('guest-storefront')).toBeVisible({timeout:45000});
  await expect(page.getByTestId('product-card').first()).toBeVisible({timeout:30000});
  report.checks.push('Anonymous landing with live API listings');
  report.listingCount=await page.getByTestId('product-card').count();
  await page.screenshot({path:'../outputs/storefront-after-desktop.png'});
  for(const width of [320,390,430,768,1440]){
   await page.setViewportSize({width,height:900});
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
   await expect(page.getByLabel('Search marketplace',{exact:true})).toBeVisible();
  }
  report.checks.push('No horizontal overflow at 320, 390, 430, 768 and 1440px');
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'../outputs/storefront-after-mobile.png'});
  await page.getByRole('button',{name:'Shop all products',exact:true}).click();
  await expect(page).toHaveURL(/\/app\/marketplaces$/);
  await expect(page.getByTestId('product-card').first()).toBeVisible();
  await page.screenshot({path:'../outputs/storefront-catalog-mobile.png'});
  await page.getByTestId('product-card').first().click();
  await expect(page).toHaveURL(/\/app\/products\/[a-zA-Z0-9_-]+$/);
  const productUrl=page.url();
  await expect(page.getByText('Loading product details...')).not.toBeVisible({timeout:30000});
  await expect(page.getByText('Unable to load product details.')).not.toBeVisible();
  await expect(page.getByRole('button',{name:'Buy Now',exact:true}).first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button',{name:'Buy Now',exact:true}).first()).toBeVisible({timeout:30000});
  report.checks.push('Public product route and refresh load actual listing');
  await page.screenshot({path:'../outputs/storefront-product-mobile.png'});
  await page.getByRole('button',{name:'Sign in',exact:true}).first().click();
  await expect(page.locator('input[type="password"]')).toBeVisible({timeout:30000});
  report.checks.push('Explicit sign-in reaches actual authentication form');
  await page.goBack();
  await expect(page).toHaveURL(productUrl);
  await expect(page.getByRole('button',{name:'Buy Now',exact:true}).first()).toBeVisible({timeout:30000});
  report.checks.push('Browser Back from actual sign-in retains public product');
  for(const path of ['/app/home','/app/?login=success','/app/orders']){
   await page.goto('https://vinodbalakumar.com'+path);
   await expect(page.getByTestId('guest-storefront')).toBeVisible({timeout:30000});
   await expect(page).toHaveURL('https://vinodbalakumar.com/app/');
  }
  report.checks.push('Private routes and unverified login marker return to landing');
  expect(report.errors).toEqual([]);expect(report.privateRequests).toEqual([]);
  report.checks.push('No browser errors or anonymous private API calls');
  console.log(JSON.stringify(report,null,2));
 }catch(error){report.failure=String(error);await page.screenshot({path:'../outputs/storefront-public-failure.png'});throw error;}
 finally{fs.writeFileSync('../outputs/storefront-public-verification.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
