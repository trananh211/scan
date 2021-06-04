const server = require('./server');
const puppeteer = require('puppeteer');
/*
  Send Post data to other URL not from this server
  data: body with data is json
  url : link to client 
*/
async function main(data, url) {
    const browser = await puppeteer.launch({
        args: ["--enable-features=NetworkService", "--no-sandbox"],
        ignoreHTTPSErrors: true
    });

    return false;

    const page = await browser.newPage();
    await page.setRequestInterception(true);
    if (header != null) {
        page.once("request", interceptedRequest => {
            interceptedRequest.continue({
                method: "POST",
                postData: JSON.stringify(data),
                'vp6': '12345'
            });
        });
    } else {
        page.once("request", interceptedRequest => {
            interceptedRequest.continue({
                method: "POST",
                postData: JSON.stringify(data)
            });
        });
    }

    const response = await page.goto(url);

    var content = await page.content();

    let innerText = await page.evaluate(() => {
        return JSON.parse(document.querySelector("body").innerText);
    });

    console.log({
        url: response.url(),
        statusCode: response.status()
    });

    console.log(innerText);

    await browser.close();
}

module.exports = main;