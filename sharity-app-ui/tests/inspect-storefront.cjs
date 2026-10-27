const { chromium }=require('@playwright/test');
const fs=require('node:fs');
(async()=>{
  const browser=await chromium.launch({args:['--disable-quic','--host-resolver-rules=MAP vinodbalakumar.com 104.21.85.140']});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('https://vinodbalakumar.com/app/',{waitUntil:'domcontentloaded'});
  await page.getByText(/sign in/i).first().waitFor({timeout:45000});
  await page.screenshot({path:'../outputs/storefront-before-desktop.png',fullPage:false});
  const report={url:page.url(),errors,headings:await page.getByRole('heading').allTextContents(),buttons:await page.getByRole('button').allTextContents()};
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'../outputs/storefront-before-mobile.png'});
  fs.writeFileSync('../outputs/storefront-before.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  await browser.close();
})();
