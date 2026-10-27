import { test, expect, type Page } from '@playwright/test';
const items = ['GIFTCARDS','RINGS','GAMES','SOFTWARE'].map((categoryCode,index)=>({
  publicId:`footer-item-${index}`,title:`Collection item ${index}`,categoryCode,verticalCode:'MARKETPLACE',
  productType:categoryCode==='RINGS'?'PHYSICAL':'DIGITAL',deliveryType:'CODE',priceAmount:20+index,currencyCode:'USD',listingStatus:'ACTIVE',stockQuantity:10,demoSeed:true,imageUrl:null,description:'A sample listing',publicReviews:[],
}));
async function fixture(page:Page, authenticated=false) {
  await page.route('**/*',route=>{
    const pathname=new URL(route.request().url()).pathname;
    if(!pathname.includes('/bff/')&&!pathname.includes('/api/')) return route.continue();
    const send=(body:unknown)=>route.fulfill({contentType:'application/json',body:JSON.stringify(body)});
    if(pathname.endsWith('/session')) return send({authenticated,publicId:'footer-member',roles:['CUSTOMER'],csrfToken:'test-csrf'});
    if(pathname.endsWith('/context'))return send({countryCode:'USA',countryName:'United States',countrySupported:true,locale:'en-US'});
    if(pathname.includes('/content/pages/')) {const slug=pathname.split('/').pop();return send({slug,title:`Page ${slug}`,category:'Public information',countryCode:'USA',locale:'en-US',version:'2026.1',effectiveDate:'2026-10-26',lastReviewedAt:'2026-10-26',sections:[{heading:'Information',paragraphs:[`Public content for ${slug}`]}]});}
    if(pathname.endsWith('/listings')) return send(items);
    if(pathname.includes('/listings/'))return send(items[0]);
    if(pathname.endsWith('/home')) return send({featuredListings:items,verticals:[],categories:[]});
    return send({});
  });
}
for(const width of [320,390,768,1440]) test(`highlighted footer and storefront at ${width}px`,async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await fixture(page);await page.setViewportSize({width,height:1000});await page.goto('/app/');
  await expect(page.getByTestId('product-card')).toHaveCount(4);
  await expect(page.getByTestId('home-hero-title')).toBeVisible();
  await page.screenshot({path:`../outputs/storefront-${info.project.name}-${width}-top.png`,fullPage:true});
  const footer=page.getByTestId('site-footer');await expect(footer).toHaveCount(1);
  await footer.getByRole('link',{name:'Privacy Policy',exact:true}).scrollIntoViewIfNeeded();
  for(const title of ['SHOP','ABOUT','HELP','POLICIES'])await expect(footer.getByRole('heading',{name:title,exact:true})).toBeVisible();
  const dimensions=await footer.boundingBox();expect(dimensions!.x).toBeCloseTo(0,0);expect(dimensions!.width).toBeCloseTo(width,0);
  const checks=await footer.evaluate(el=>{
    const problems:string[]=[];const background=getComputedStyle(el).backgroundColor;
    if(background!=='rgb(23, 35, 55)')problems.push('Footer must be dark');
    for(const link of Array.from(el.querySelectorAll('a,[role="link"]'))){
      const rect=link.getBoundingClientRect();if(rect.left< -1||rect.right>innerWidth+1)problems.push(`Link outside viewport: ${link.textContent}`);
      if(rect.height<43)problems.push('Small touch target');
      if(!link.getAttribute('href'))problems.push('Missing link destination');
    }
    if(document.documentElement.scrollWidth>innerWidth+1)problems.push('Page overflow');return problems;
  });expect(checks).toEqual([]);expect(errors).toEqual([]);
  await page.getByTestId('page-scroll').evaluate(el=>el.scrollTop=el.scrollHeight);
  await page.screenshot({path:`../outputs/storefront-${info.project.name}-${width}-footer.png`,fullPage:true});
  await footer.getByRole('link',{name:'Privacy Policy',exact:true}).click();
  await expect(page).toHaveURL(/\/app\/legal\/privacy$/);
  await expect(page.getByText('Public content for privacy',{exact:true})).toBeVisible();
  await page.goBack();await expect(page.getByTestId('guest-storefront')).toBeVisible();
});
test('all public footer destinations open their matching content',async({page})=>{
  await fixture(page);await page.goto('/app/');
  for(const [label,slug] of [['About Sharity','about-us'],['Careers','careers'],['Press Center','press'],['Help Center','help-center'],['Contact Support','contact-us'],['Safety Center','safety'],['Terms of Use','terms'],['Privacy Policy','privacy'],['Community Guidelines','guidelines']]){
    await page.getByTestId('site-footer').getByRole('link',{name:label,exact:true}).click();
    await expect(page.getByText(`Public content for ${slug}`,{exact:true})).toBeVisible();
  }
});
test('signed-in storefront has the same footer and shopping links clear old filters',async({page})=>{
  await fixture(page,true);await page.goto('/app/home');
  await expect(page.getByRole('button',{name:'Sign out',exact:true})).toBeInViewport({ratio:1});
  const filters=page.getByTestId('catalog-filters');
  if(await filters.getByRole('button',{name:'Show categories',exact:true}).isVisible()) await filters.getByRole('button',{name:'Show categories',exact:true}).click();
  await filters.getByText('Rings',{exact:true}).click();
  await expect(page.getByTestId('product-card')).toHaveCount(1);
  await page.getByTestId('site-footer').getByRole('link',{name:'All products',exact:true}).click();
  await expect(page).toHaveURL(/\/app\/marketplaces$/);await expect(page.getByTestId('product-card')).toHaveCount(4);
  await expect(page.getByTestId('site-footer')).toHaveCount(1);
});
