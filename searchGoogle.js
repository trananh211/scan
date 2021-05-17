const fs = require('fs');
const puppeteer = require('puppeteer');

let arrTest = {
	'url': 'https://vetz3d.com/shop',
	// 'url' : 'https://vetz3d.com/shop?startId=6036571b4dd66d935ec5e512',
	// config catalog product
	'waitSelector' : 'div.ShopPage',
	'productItem' : 'div.ShopPage div.ProductItem',
	'productTitle' : 'div.BottomProduct > div.Title',
	'productLink' : 'a',
	'https_origin' : 'https://vetz3d.com',
	// config Page Next
	'btnNext' : 'button.ml-2', // dấu hiệu nhận biết nút btn next. 
	'signalParentButton' : '.ShopPagination .d-inline-flex button', // dấu hiệu nhận biết cha của button pagination
	'signalAttribute' : 'class', // class or Id
	'signalClassLastButton' : 'buttonDisabled', // dấu hiệu nhận biết là Button cuối cùng
	'typePageLoad' : 1,
};

// searchGoogle(arrTest).then(results => {
//                 console.log(results);
//             });

function searchGoogle(preData) {
	/*Dinh nghia config*/
	var gl_PageLoad_Button = 1;
	var gl_PageLoad_Scroll = 2;

	/* Chuan bi lai du lieu truoc khi kiem tra website de scrap*/
	const url = preData.url;
	const waitSelector = preData.waitSelector;
	const productItem = preData.productItem;
	const productTitle = preData.productTitle;
	const productLink = preData.productLink;
	const https_origin = preData.https_origin;
	const btnNext = preData.btnNext;
	const classBtnNextDisable = preData.classBtnNextDisable;
	const typePageLoad = preData.typePageLoad;

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
	const signalParentButton = config.signalParentButton;
	const signalAttribute = config.signalAttribute;
	const signalClassLastButton = config.signalClassLastButton;

	// kiểm tra xem tồn tại button next không
	const lastPageExist = await page.evaluate( (btnNext) => {
		const result = document.querySelector(btnNext);
		return result ? true : false ;
	},btnNext);
	// nếu tồn tại button next => tiếp tục click next trang
	if (lastPageExist) {
		// chuyển toàn bộ ký tự class của page vào thành chuỗi của mảng. Nút next sẽ là phần tử cuối cùng trong mảng
		const array = await page.evaluate((signalParentButton, signalAttribute) => 
		  	Array.from (
		  		document.querySelectorAll(signalParentButton)).map(d => d.getAttribute(signalAttribute)
		  		), signalParentButton, signalAttribute
		)
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
	} else { // nếu không tồn tại button next => trang cuối cùng 
		lastPage = true;
	}
	return lastPage;
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


