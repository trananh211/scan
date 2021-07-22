const server = require('./server');
const puppeteer = require('puppeteer');
/*
  Send Post data to other URL not from this server
  data: body with data is json
  url : link to client 
*/
async function postData(data, url) {
    const browser = await puppeteer.launch({
        args: ["--enable-features=NetworkService", "--no-sandbox"],
        ignoreHTTPSErrors: true
    });

    // console.log(JSON.stringify(data, 0, 2));

    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.once("request", interceptedRequest => {
        interceptedRequest.continue({
            method: "POST",
            postData: JSON.stringify(data)
        });
    });

    const response = await page.goto(url);

    var content = await page.content();
    console.log(content);

    // let innerText = await page.evaluate(() => {
    //     return JSON.parse(document.querySelector("body").innerText);
    // });
    // console.log({
    //     url: response.url(),
    //     statusCode: response.status()
    // });
    // console.log(innerText);


    
    await browser.close();
}

module.exports = postData;