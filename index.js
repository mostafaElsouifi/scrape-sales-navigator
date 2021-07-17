require('dotenv').config();
const puppeteer = require('puppeteer');
const xlsx = require('xlsx');
const autoScroll = require('puppeteer-autoscroll-down');
const wait = (sec)=>{
    return new Promise(resolve=>{
        setTimeout(resolve, sec * 1000)
    })
}

(async()=>{
    const allData = [];
    const allUrls = [];
    const wb = xlsx.readFile('./2021.07.16_Mostafa_specifictitles_people_sample_companies.xlsx');
    const ws = wb.Sheets["Sample_people_pull_pivot_vals"];
    const data = xlsx.utils.sheet_to_json(ws);
    for(let url of data){
        allUrls.push(url.allurls)
    }

    const browser = await puppeteer.launch({headless: false})
    const page = await browser.newPage();
    
         await page.goto(allUrls[0]);
         await wait(5);
         await page.click('button[data-tracking-control-name="auth_wall_desktop_company-login-toggle"]');
         await page.type('.login-email', process.env.EMAIL);
         await page.type('.login-password', process.env.PASSWORD);
         await page.click('#login-submit');
         await wait(60);
    
   
    try{
        console.log(`${new Date().getHours()} : ${new Date().getMinutes()}`);
        // loop through all companies 
        for(let i = 111; i < 6000; i++){
            console.log(`comapny :  ${i}`);
            await page.goto(allUrls[i]);
            await wait(2);
        
            await page.click('.artdeco-dropdown__trigger.artdeco-dropdown__trigger--placement-bottom.ember-view.org-overflow-menu__dropdown-trigger.artdeco-button.artdeco-button--2.artdeco-button--secondary.artdeco-button--muted');
            await wait(1)
            const getSalesUrl = await page.evaluate(()=>{
                if(document.querySelector('.artdeco-dropdown__content-inner li:nth-of-type(3) a')){
                    return document.querySelector('.artdeco-dropdown__content-inner li:nth-of-type(3) a').href;
                }else{
                    return false;
                }
               
            })
            await wait(2);
            if(getSalesUrl !== false){
                await page.goto(getSalesUrl);
                await wait(5);
                // company id 
                let companyId = getSalesUrl.split('=')[1];
                companyId = companyId.replace(companyId.substr(companyId.indexOf('&')), '');
                //company name 
                let companyName = await page.evaluate(()=>{
                    return document.querySelector('.artdeco-entity-lockup__title.ember-view').textContent.trim();
                })
               
                try{
                    await page.click('.ember-view.link-without-visited-and-hover-state');
                }catch(e){
                    await page.reload();
                    await wait(5);
                    await page.click('.ember-view.link-without-visited-and-hover-state');
                }
                
                await wait(3);
                const allEmployees = [];
                let data;
                for(let i = 0; i < 50; i++){
                     data = await page.evaluate(()=>{
                        if(document.querySelector('.search-results__no-results') === null ){
                            return true;
                        }else{
                            return false;
                        }
                    })
                    await wait(1);
                    if(data){
                        await autoScroll(page);
                        await wait(3);
                        const employees = await page.evaluate(()=>{
                            const employees = [];
                            const allemployees = document.querySelectorAll('.horizontal-person-entity-lockup-4.result-lockup__entity.ml6');
                            let role;
                            for(let i = 0; i < allemployees.length; i++){
                                if(allemployees[i].childNodes[3].childNodes[6].childNodes[2]){
                                    role = allemployees[i].childNodes[3].childNodes[6].childNodes[2].textContent.trim().toLowerCase();
                                }else{
                                    role = '';
                                }
                                
                                if(role.includes('ceo') || role.includes('founder') || role.includes('chief executive officer') || role.includes('chief executive officer - petroleum') || role.includes('cfo') || role.includes('director') || role.includes('finance') || role.includes('financial') || role.includes('accountant') || role.includes('payable') || role.includes('accounts') || role.includes('account') || role.includes('payables')){
                                    employees.push({
                                        url: allemployees[i].childNodes[1].childNodes[1].href,
                                        fullName: allemployees[i].childNodes[3].childNodes[1].textContent.trim(),
                                        firstName : allemployees[i].childNodes[3].childNodes[1].textContent.trim().split(' ')[0],
                                        lastName : allemployees[i].childNodes[3].childNodes[1].textContent.trim().split(' ')[1],
                                        title: allemployees[i].childNodes[3].childNodes[6].childNodes[2].textContent.trim()
                                    })
                                }
                            }
                            return employees;
                        })
                        allEmployees.push(...employees);
                    }else{
                        break;
                    }
                    await page.click('.search-results__pagination-next-button')
                    await wait(2);
                  
                }
                
                // loop through all employes
                await wait(2);
                for(let i = 0; i < allEmployees.length; i++){
                    await page.goto(allEmployees[i].url)
                    await wait(1);
              
                    let location = await page.evaluate(()=>{
                        return document.querySelector('.profile-topcard__location-data.inline.t-14.t-black--light.mr5').textContent.trim()
                    })
                        let connections = await page.evaluate(()=>{
                            if(document.querySelector('.profile-topcard__connections-data.type-total')){
                                return document.querySelector('.profile-topcard__connections-data.type-total').textContent.replace('connections', '').trim()
                            }else{
                                return ''
                            }
                            
                        })
                    let summary = await page.evaluate(()=>{
                        if(document.querySelector('.display-block.overflow-hidden.profile-topcard__summary-content.profile-topcard__summary')){
                            return document.querySelector('.display-block.overflow-hidden.profile-topcard__summary-content.profile-topcard__summary').textContent.trim()
                        }else{
                            return ''
                        }
                    
                    })
                    let isPremium = await page.evaluate(()=>{
                        if(document.querySelector('span[aria-describedby="artdeco-hoverable-profile-badges-premium-tooltip"]') === null) {
                            return false;
                        }else{
                            return true;
                        }
                    })
                    let contacts = await page.evaluate(()=>{
                        const contacts = [];
                        const allContactsNodes = document.querySelectorAll('.profile-topcard__contact-info-item-link.inverse-link-on-a-light-background.t-14');
                        for(let i = 0; i < allContactsNodes.length; i++){
                            contacts.push(allContactsNodes[i].href)
                        }
                        return contacts;
                    })
                    const data = {
                        fullName: allEmployees[i].fullName,
                        fistName: allEmployees[i].firstName,
                        lastName: allEmployees[i].lastName,
                        title: allEmployees[i].title,
                        location: location,
                        summary: summary,
                        companyName: companyName,
                        companyId: companyId,
                        profileUrl : allEmployees[i].url,
                        isPremium: isPremium,
                        connections: connections,
                        companyUrl: allUrls[i],
                    }
                    contacts[0] ? data.contact1 = contacts[0] : data.contact1 = '';
                    contacts[1] ? data.contact2 = contacts[1] : data.contact2 = '';
                    contacts[2] ? data.contact1 = contacts[2] : data.contact3 = '';
                    allData.push(data)
                    console.log(`employee :  ${i}`);
                }
            }
           
        }   
    }catch(e){
        console.log(`${new Date().getHours()} : ${new Date().getMinutes()}`);
        console.log(e)
        const newWB = xlsx.utils.book_new();
        const newWS = xlsx.utils.json_to_sheet(allData);
        xlsx.utils.book_append_sheet(newWB, newWS, "allData");
        xlsx.writeFile(newWB, 'navigator.xlsx');
  
    }
    console.log(`${new Date().getHours()} : ${new Date().getMinutes()}`);
    const newWB = xlsx.utils.book_new();
    const newWS = xlsx.utils.json_to_sheet(allData);
    xlsx.utils.book_append_sheet(newWB, newWS, "allData");
    xlsx.writeFile(newWB, 'navigator.xlsx');
  
})();