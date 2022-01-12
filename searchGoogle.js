const fs = require('fs');
const puppeteer = require('puppeteer');

function searchGoogle(preData) {

	/* Chuan bi lai du lieu truoc khi kiem tra website de scrap*/
	const url = preData.url;
	const waitSelector = preData.waitSelector;
	const productItem = preData.productItem;
	const productTitle = preData.productTitle;
	const imageSelector = preData.imageSelector;
	const imageAttribute = preData.imageAttribute;
	const imageHttps = (preData.imageHttps != '') ? preData.imageHttps : '' ;
	const productLink = preData.productLink;
	const https_origin = preData.https_origin;
	const btnNext = preData.btnNext;
	const classBtnNextDisable = preData.classBtnNextDisable;
	const typePageLoad = preData.typePageLoad;

	return new Promise(async (resolve, reject) => {
		try {
			let lastPage = false;
	        let urls = [];

            const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox'] });
	        const page = await browser.newPage();
	        page.setViewport({width: 1280, height: 720});
	        await page.goto(url, { waitUntil: 'networkidle2' });

	        // Nếu trang thuộc dạng Load Scroll thì cuộn đến hết data thì thôi.
	        if (typePageLoad == gl_PageLoad.scroll)
	        {
	        	// Scroll and extract items from the page.
  				await autoScroll(page);
  				lastPage = true;	
	        }

	        // nếu khai báo là 1 page thì mặc định luôn đây là last page
	        if (typePageLoad == gl_PageLoad.one_page)
	        {
	        	lastPage = true;
	        }
	        
			let i=1;
	        // truy vấn từng trang 1 cho đến khi hết trang
	        do {
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

	            let newUrls = await page.evaluate((productItem, productTitle, productLink, https_origin, imageSelector, 
					imageAttribute, imageHttps) => {
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
		                const link = croppedLink ? https_origin+croppedLink : null;
		                
						let imgElement = '';
						let imgLink = '';
						// image
						if (imageSelector == '') {
							imgElement = item.querySelector('img');
							imgLink = imgElement ? imgElement.getAttribute('src') : null;
						} else {
							imgElement = item.querySelector(imageSelector);
							imgLink = imgElement ? imgElement.getAttribute(imageAttribute) : null;
						}
						const img = imgLink ? imageHttps+imgLink : null;
			        	//Add to the return Array
			        	results = results.concat({title, link, img, scrapeTime});
	                });
	                return results;
	            }, productItem, productTitle, productLink, https_origin, imageSelector, imageAttribute, imageHttps);

	            // console.log(JSON.stringify(newUrls,0,2));
	            urls = urls.concat(newUrls);
				
		        if (lastPage == false)
		        {
		        	var now = new Date();
		        	// chuyển trang
			        let timeLoadPage = getTimeLoading(3,6); // lấy thời gian random từ 3s -> 5s để load trang
			        console.log(now.toUTCString()+' ==> Page : '+ i +'. Time load trang la: '+ timeLoadPage);
			        var configPage = {
			        	'btnNext' : btnNext,
			        	'signalLastButtonNoClass' : preData.signalLastButtonNoClass,
			        	'signalAttribute' : preData.signalAttribute,
			        	'signalClassLastButton' : preData.signalClassLastButton
			        };
		        	// kiểm tra last page
	        		lastPage = await checkLastPage(page, lastPage, configPage, timeLoadPage);
		        }
				i++;
			} while (lastPage == false); // điều kiện là vẫn còn trang để next, last page = false
            
            // await page.screenshot({path: 'screenshot.png', fullPage: true});
            await browser.close();
            return resolve(urls);
		} catch (e) {
            return reject(e);
        }
	})
}

// tự động scroll đến dòng cuối cùng
async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 300);
        });
    });
}

async function checkLastPage(page, lastPage, config, time)
{
	//config data
	const btnNext = config.btnNext;
	const signalLastButtonNoClass = config.signalLastButtonNoClass;
	const signalAttribute = config.signalAttribute;
	const signalClassLastButton = config.signalClassLastButton;

	// kiểm tra xem tồn tại button next không
	const btnNextExist = await page.evaluate( (btnNext) => {
		let result = false;
		try {
			const checkExist = document.querySelector(btnNext);
			const el = document.querySelector(btnNext).clientHeight;
			result = (checkExist && el != 0) ? true : false;
		} catch (e) {
			result = false;
		}
		return result;
	}, btnNext);
	// nếu tồn tại button next => tiếp tục click next trang
	if (btnNextExist) {
		// chuyển toàn bộ ký tự class của page vào thành chuỗi của mảng. Nút next sẽ là phần tử cuối cùng trong mảng
		const array = await page.evaluate((signalLastButtonNoClass, signalAttribute) => 
		  	Array.from (
		  		document.querySelectorAll(signalLastButtonNoClass)).map(d => d.getAttribute(signalAttribute)
		  		), signalLastButtonNoClass, signalAttribute
		)
		if (array.length > 0) {
			// lấy nút cuối cùng trong mảng ra để so sánh
			const lastItem = array[array.length - 1];
			// nếu tồn tại ký hiệu trang cuối cùng
			if ( lastItem.indexOf(signalClassLastButton) !== -1) {
				lastPage = true;
			} else {
				try {
					// Mặc định sẽ Click vào nút cuối cùng mà tool tìm thấy
					await Promise.all([
						await page.click(btnNext+':nth-last-child(1)'),
						await page.waitForTimeout(time)
					])
				} catch (e) {
					lastPage = true;
				}	
			}
		} else {
			lastPage = true;
		}
			
	} else { // nếu không tồn tại button next => trang cuối cùng 
		lastPage = true;
	}
	return lastPage;
}

async function isVisible(selector) {
  let el = document.querySelector(selector).clientHeight;
  return (el != 0) ? true : false;
}

function getTimeLoading (min = null, max = null)
{	
	if (min == null || max == null){
		min = 1;
		max = 5;
	}
	return Math.floor( Math.random() * (max - min) + min) * 1000;
}

module.exports = searchGoogle;


