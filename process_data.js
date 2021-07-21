const fs = require('fs');
const puppeteer = require("puppeteer");

function processData(data)
{
	// console.log(JSON.stringify(data, 0, 2));

	return new Promise(async (resolve, reject) => {
		try {
			const browser = await puppeteer.launch({headless: false, args: ['--no-sandbox'] });
	        const page = await browser.newPage();
	        page.setViewport({width: 1280, height: 720});

	        var waitSelector = '';
	        var productTitle = '.ProductWrapper .ProductTitle';
	        var productImage = '#main-preview .ProductImage .Image .img-fluid';
	        var attrImage = 'src';
	        var https_origin = '';
			var i = 1; 
			let results = [];

			for (let i = 0; i < data.length ; i++)
			{
				let tmp = [];
				let product_url = data[i].product_link;
				let product_id = data[i].id;
				await page.goto(product_url, { waitUntil: 'networkidle2' });
				if (waitSelector.length > 0)
		        {	
		        	try {
		        		await page.waitForSelector(waitSelector , { timeout: 100 });
		        	} catch (e) {
		        		await page.waitForTimeout(100);
		        	}
		        } else {
		        	await page.waitForTimeout(100);
		        }

		        // lấy title
		        let title = '';
		        try {
		        	title = await page.$eval(productTitle, e => e.innerText);
		        } catch (e) {
		        	title = null;
		        }

		        // lấy image
		        let images = [];
		        try {
		        	images = await page.evaluate((productImage, attrImage, https_origin) => {
		                let results = [];
		                let items = document.querySelectorAll(productImage);
		                items.forEach((item) => {
			                const linkElement = item;
			                console.log(item);
			                // You can combine croppedLink and link, or croppedImg and img to not make two variables if you want.
			                // But, in my opinion, separate variables are better. 
			                const croppedLink = linkElement ? linkElement.getAttribute(attrImage) : null;
			                // const croppedImg = imgElement ? imgElement.getAttribute('data-image') : null;

			                const link = croppedLink ? https_origin+croppedLink : null;
			                // const img = croppedImg ? `https:${croppedImg}` : null;

				        	//Add to the return Array
				        	results.push( link );
		                });
		                return JSON.stringify(results);
		                // return results;
		            }, productImage, attrImage, https_origin);
		        } catch (e) {
		        	images = [];
		        }
		        results.push({product_id, product_url , title, images});
		        // results = results.concat(tmp);
			}

	        await browser.close();

			return resolve(results);
		} catch (e) {
			return reject(e);
		}
	})
}

module.exports = processData;