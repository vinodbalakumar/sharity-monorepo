const {chromium,expect}=require('@playwright/test');
(async()=>{
 const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000}});
 try{
  await page.route('**/bff/**',async route=>{const request=new URL(route.request().url());const response=await route.fetch({url:'http://localhost:8080'+request.pathname+request.search});await route.fulfill({response});});
  await page.goto('http://127.0.0.1:8097/app/');
  await expect(page.getByTestId('guest-storefront')).toBeVisible();await expect(page.getByTestId('product-card').first()).toBeVisible();
  await page.screenshot({path:'../outputs/storefront-preview-desktop.png'});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'../outputs/storefront-preview-mobile.png'});
  await page.getByRole('button',{name:'Shop all products',exact:true}).click();
  await expect(page.getByTestId('product-card').first()).toBeVisible();await page.screenshot({path:'../outputs/storefront-preview-catalog.png'});
  await page.getByTestId('product-card').first().click();await expect(page.getByRole('button',{name:'Buy Now',exact:true}).first()).toBeVisible();
  await page.screenshot({path:'../outputs/storefront-preview-product.png'});
  console.log('Live local API preview: landing, catalog and product passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
