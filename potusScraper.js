// const ObjectsToCsv = require('objects-to-csv');
const $ = require('cheerio');
const puppeteer = require('puppeteer');
const beginUrl = "http://serguide.maccabi4u.co.il"
const url = 'https://serguide.maccabi4u.co.il/heb/doctors/doctorssearchresults/?PageNumber=';
let str = "&City=70&Field=089&RequestId=7ba9ff7d-07c8-3eae-335d-fd70b3b80d5f&Source=SearchPage"
let doctors = []
let finalDoctors = []
process.setMaxListeners(Infinity)   


const maccabiDocs = async function (pageUrl) {
    const browser = await puppeteer.launch()
    let page = await browser.newPage();
    await page.goto(pageUrl, {
        timeout: 0,
        waitUntil: 'networkidle0'
    });
    await page.waitForSelector('#index0', { visible: true });
    browser.close()
    return page.content()
        .then(async function (html) {
            for (let i = 0; i < 10; i++) {
                doctors.push({ name: $('#index' + i, html).text(), link: beginUrl + $('#index' + i, html).attr('href') })
            }
            await browser.close();
        })
        .catch(function (error) {
            console.log(error)
        })

}

const maccabiDocsHours = async function (pageUrl) {
    while (true) {
        const browser = await puppeteer.launch({ headless: true });
        let page = await browser.newPage();
        try {
            await page.goto(pageUrl, {
                timeout: "60000",
                waitUntil: 'networkidle0'
            });
            await page.waitForSelector('#app', { visible: true });
            return page.content()
        }
        catch{
            await page.reload(pageUrl);
        }
        finally {
            browser.close()
        }
    }
}

for (let i = 1; i <= 5; i++) {
    let pageUrl = url + i + str
    maccabiDocs(pageUrl)
}

setTimeout(function () {
    clean(doctors);
    const dPromises = []
    for (let j = 0; j < doctors.length; j++) {
        dPromises.push(maccabiDocsHours(doctors[j].link))
        console.log(doctors[j].name);
    }
    Promise.all(dPromises).then(async function (html) {
        for (let i = 0; i < html.length; i++) {
            let times = ""
            $('[itemprop=openingHours]', html[i]).each(function () {
                times += $(this).text() + " ";
            })
            finalDoctors.push({
                name: $('.docPropTitle', html[i]).text(), city: $('span.t_G_1[itemprop=addressLocality]', html[i]).text(), address: $('span.t_G_1[itemprop=streetAddress]', html[i]).text(),
                times: times.split(" "), phoneNumber: $(".t_G_1.colorBlueMobile", html[i]).text()
            })
        }
        console.log(finalDoctors)
        console.log(finalDoctors.length);
    })
}, 10000);




const clean = function () {
    for (let i = 0; i < doctors.length; i++) {
        if (doctors[i].link == beginUrl + "undefined") {
            doctors.splice(i, 1)
            i--;
        }
    }
}


// (async () => {
    //     const csv = new ObjectsToCsv(doctors);
    //     await csv.toDisk('./docsNameAndLinks.csv');
    //     console.log(await csv.toString());
    // })()