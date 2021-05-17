const puppeteer = require("puppeteer");

async function main(data) {
  
  const browser = await puppeteer.launch({
    args: ["--enable-features=NetworkService", "--no-sandbox"],
    ignoreHTTPSErrors: true
  });
  const page = await browser.newPage();

  await page.setRequestInterception(true);

  page.once("request", interceptedRequest => {
    interceptedRequest.continue({
      method: "POST",
      postData: JSON.stringify(data),
      headers: {
        ...interceptedRequest.headers(),
        "Content-Type": "application/x-www-form-urlencoded",
        "Vp6": "12345"
      }
    });
  });

  const response = await page.goto("http://ait.test/api/list-product");

  console.log({
    url: response.url(),
    statusCode: response.status()
    // body: await response.text()
  });

  await browser.close();
}

module.exports = main;