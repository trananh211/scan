const fs = require('fs');
const puppeteer = require("puppeteer");

function main(data)
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


function abc()
{
	return new Promise(async (resolve, reject) => {
		try {
            const browser = await puppeteer.launch({headless: false, args: ['--no-sandbox'] });
	        const page = await browser.newPage();
	        page.setViewport({width: 1280, height: 720});
	        await page.goto(url, { waitUntil: 'networkidle2' });

	        // Nếu trang thuộc dạng Load Scroll thì cuộn đến hết data thì thôi.
	        if (typePageLoad == gl_PageLoad_Scroll)
	        {
	        	// Scroll and extract items from the page.
  				await autoScroll(page);	
	        }
	        let lastPage = false;
	        let urls = [];
	        // truy vấn từng trang 1 cho đến khi hết trang
	        do {
	        	// kiểm tra button next đầu tiên để thoat khỏi vòng lặp
			  	if (typePageLoad == gl_PageLoad_Button) {	
		        	// kiểm tra tồn tại của button next.
		        	let checkBtnNextExist = await page.evaluate((btnNext) => {
					  	let el = document.querySelector(btnNext)
					  	return el ? true : false
					}, btnNext);
		        }
		        // nếu tồn tại wait Selector thi chờ trang load xong mới scrap. Nếu không thì chỉ chờ 3s
		        if (waitSelector.length > 0)
		        {	
		        	try {
		        		await page.waitForSelector(waitSelector , { timeout: 3000 });
		        	} catch (e) {
		        		await page.waitForTimeout(1000);
		        	}
		        } else {
		        	await page.waitForTimeout(3000);
		        }

	            let newUrls = await page.evaluate((productItem, productTitle, productLink, https_origin) => {
	                let results = [];
	                let items = document.querySelectorAll(productItem);
	                items.forEach((item) => {
	                	const scrapeTime = Date.now();
		                const titleElement = item.querySelector(productTitle);
		                const linkElement = item.querySelector(productLink);
		                // const imgElement = item.querySelector('.seb-img-switcher__imgs');

		                // You can combine croppedLink and link, or croppedImg and img to not make two variables if you want.
		                // But, in my opinion, separate variables are better. 
		                const title = titleElement ? titleElement.innerText.trim() : null;
		                const croppedLink = linkElement ? linkElement.getAttribute('href') : null;
		                // const croppedImg = imgElement ? imgElement.getAttribute('data-image') : null;

		                const link = croppedLink ? https_origin+croppedLink : null;
		                // const img = croppedImg ? `https:${croppedImg}` : null;

			        	//Add to the return Array
			        	results.push({title, link, scrapeTime});
	                });
	                return results;
	            }, productItem, productTitle, productLink, https_origin);

	            urls = urls.concat(newUrls);
		        
		        // chuyển trang
		        let timeLoadPage = getTimeLoading(1,5); // lấy thời gian random từ 1s -> 5s để load trang
		        console.log('time load trang la: '+ timeLoadPage);
		        var configPage = {
		        	'btnNext' : btnNext,
		        	'signalParentButton' : preData.signalParentButton,
		        	'signalAttribute' : preData.signalAttribute,
		        	'signalClassLastButton' : preData.signalClassLastButton
		        };
               	// kiểm tra last page
	        	lastPage = await checkLastPage(page, lastPage, configPage, timeLoadPage);
	        	
			} while (lastPage == false); // điều kiện là vẫn còn trang để next, last page = false
            
            // await page.screenshot({path: 'screenshot.png', fullPage: true});
            await browser.close();
            return resolve(urls);
		} catch (e) {
            return reject(e);
        }
	})
}

module.exports = main;