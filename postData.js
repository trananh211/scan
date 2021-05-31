const puppeteer = require("puppeteer");

async function main(data, url) {
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
              headerVerify.key : headerVerify.value
          }
      });
  });

  const response = await page.goto(url);

  var content = await page.content(); 

  let innerText = await page.evaluate(() =>  {
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