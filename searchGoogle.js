const puppeteer = require('puppeteer');

function searchGoogle(preData) {
	/* Chuan bi lai du lieu truoc khi kiem tra website de scrap*/
	const url = preData.get('url');
	const waitSelector = preData.get('waitSelector');
	const productItem = preData.get('productItem');
	const productTitle = preData.get('productTitle');
	const productLink = preData.get('productLink');
	const https_origin = preData.get('https_origin');

	return new Promise(async (resolve, reject) => {
		try {
            const browser = await puppeteer.launch({headless: false});
	        const page = await browser.newPage();
	        page.setViewport({width: 1280, height: 720});
	        await page.goto(url, { waitUntil: 'networkidle2' });

            // nếu tồn tại wait Selector thi chờ trang load xong mới scrap. Nếu không thì chỉ chờ 3s
	        if (waitSelector.length > 0)
	        {	
	        	try {
	        		await page.waitForSelector(waitSelector , {
				        timeout: 3000
				  	});
	        	} catch (e) {
	        		await page.waitForTimeout(1000);
	        	}
	        } else {
	        	await page.waitForTimeout(3000);
	        }

            let urls = await page.evaluate((productItem, productTitle, productLink, https_origin) => {
                let results = [];
                let items = document.querySelectorAll(productItem);
                items.forEach((item) => {

                	const scrapeTime = Date.now();
	                const titleElement = item.querySelector(productTitle);
	                const linkElement = item.querySelector(productLink);
	                // const imgElement = item.querySelector('.seb-img-switcher__imgs');
	                
	                /**
	                 * You can combine croppedLink and link, or croppedImg and img to not make two variables if you want.
	                 * But, in my opinion, separate variables are better. 
	                 */
	                const title = titleElement ? titleElement.innerText.trim() : null;
	                const croppedLink = linkElement ? linkElement.getAttribute('href') : null;
	                // const croppedImg = imgElement ? imgElement.getAttribute('data-image') : null;

	                const link = croppedLink ? https_origin+croppedLink : null;
	                // const img = croppedImg ? `https:${croppedImg}` : null;

		        	//Add to the return Array
		        	results.push({title, link, scrapeTime});
                });
                return results;
            }, productItem, productTitle, productLink, https_origin)
            browser.close();
            return resolve(urls);
		} catch (e) {
            return reject(e);
        }
	})
}


module.exports = searchGoogle;