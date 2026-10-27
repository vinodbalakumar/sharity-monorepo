const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({args:['--disable-quic','--host-resolver-rules=MAP vinodbalakumar.com 104.21.85.140']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const report={checkedAt:new Date().toISOString(),errors:[]};page.on('pageerror',error=>report.errors.push(error.message));
 try{
  await page.goto('https://vinodbalakumar.com/chat',{waitUntil:'domcontentloaded'});
  await expect(page.getByLabel('Message Sharity AI')).toBeVisible({timeout:45000});
  await page.getByLabel('Message Sharity AI').fill('Who founded Sharity?');
  const response=page.waitForResponse(r=>new URL(r.url()).pathname==='/bff/ai/chat'&&r.request().method()==='POST');
  await page.getByRole('button',{name:'Send message',exact:true}).click();
  const answer=await (await response).json();
  await expect(page.getByTestId('message-assistant')).toContainText('Vinod');
  await expect(page.getByRole('link',{name:/Approved founder|Sharity project overview|Approved public technology/})).toHaveCount(0);
  await expect(page.getByText(/Approved founder profile|Approved public technology summary/)).toHaveCount(0);
  await expect(page.getByTestId('response-time')).toBeVisible();
  await page.getByRole('button',{name:'Message info',exact:true}).click();
  await expect(page.getByTestId('message-info')).toBeVisible();
  report.responseSourceCount=answer.sources?.length??0;report.sourceBadgesRemoved=true;report.messageInfoPreserved=true;
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'../outputs/chat-sources-removed-mobile.png'});
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole('button',{name:'Delete chat',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Welcome to Sharity AI'})).toBeVisible();
  expect(report.errors).toEqual([]);console.log(JSON.stringify(report,null,2));
 }catch(error){report.failure=String(error);throw error;}
 finally{fs.writeFileSync('../outputs/chat-sources-public-verification.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
