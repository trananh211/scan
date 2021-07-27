const fs = require('fs');
const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const searchGoogle = require('./searchGoogle');

function verifyData(Data) {
	const preData = Data.catalog_source;
	const preDataProduct = Data.product_source;
	
	// console.log(JSON.stringify(preData,0,2));
	// console.log(JSON.stringify(preDataProduct,0,2));

	/* Chuan bi lai du lieu truoc khi kiem tra website de scrap*/
	const url = preData.url;
	let message = '';
	let result = 0;

	return new Promise(async (resolve, reject) => {
		let results = {};
		try {        
	        const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox'] });
	        const page = await browser.newPage();
	        page.setViewport({width: 1280, height: 720});
	        await page.goto(url, { waitUntil: 'networkidle2' });
	        // mặc định chờ load 2s
	        await page.waitForTimeout(2000);

	        // kiểm tra các dữ liệu từ client gửi lên xem có đúng hay không
	        const check_data_before = await verifyPreData(page, preData, result);

	        result = check_data_before.result;
	        message = check_data_before.message;
	        link_product = check_data_before.link_product;
	        if (result)
	        {
	        	// Nếu catalog product được pass thành công. Chuyển đến check product page
			    const res = await verifyProductPage(page, preDataProduct, link_product);
		    	result = res.result;
		    	message = res.message;
	        }
	        await browser.close();
		} catch (e) {
			result = 0;
			message = 'Xảy ra lỗi ngoài ý muốn. Không thể truy cập được url bạn khai báo.' + e;
	    }
	    // lấy data về show lại cho client
	    if (result == 1)
        {
        	let arrData = {
				'url': preData.url,
				'waitSelector' : preData.waitSelector,
				'productItem' : preData.productItem,
				'productTitle' : preData.productTitle,
				'productLink' : preData.productLink,
				'imageSelector' : preData.imageSelector,
				'imageAttribute' : preData.imageAttribute,
				'imageHttps' : preData.imageHttps,
				'productLink' : preData.productLink,
				'https_origin' : preData.https_origin,
				// config Page Next
				'btnNext' : preData.btnNext, 
				'signalLastButtonNoClass' : preData.signalLastButtonNoClass, // dấu hiệu nhận biết cha của button pagination
				'signalAttribute' : preData.signalAttribute, // class or Id
				'signalClassLastButton' : preData.signalClassLastButton, // dấu hiệu nhận biết là Button cuối cùng
				'typePageLoad' : gl_PageLoad.one_page
			};
        	const list_products = await searchGoogle(arrData);
        	results = {
	        	'result' : result,
	        	'message' : message,
	        	'data' : list_products
	        };
        	return resolve(results);
        } else {
        	results = {
	        	'result' : result,
	        	'message' : message
	        };
        	return reject(results);
        }
	})
}

// hàm verify nội dung được gửi từ client
async function verifyPreData( page, preData, result)
{
	/* Chuan bi lai du lieu truoc khi kiem tra website de scrap*/
	const url = preData.url;
	const waitSelector = preData.waitSelector;
	const productItem = preData.productItem;
	const productTitle = preData.productTitle;
	const productLink = preData.productLink;
	const https_origin = preData.https_origin;
	const btnNext = preData.btnNext;
	const signalLastButtonNoClass = preData.signalLastButtonNoClass;
	const signalAttribute = preData.signalAttribute;
	const signalClassLastButton = preData.signalClassLastButton;
	const typePageLoad = preData.typePageLoad;
	const url_end = preData.url_end;

	let message = 'Kiểm tra Dữ liệu ngoài Category => ';

	const checkWaitSelector = await checkExistElement(page, waitSelector);
    if (checkWaitSelector) {
    	const checkProductItem = await checkExistElement(page, productItem);
    	if (checkProductItem) {
    		const checkProductTitle = await checkExistElement(page, productTitle);
    		if (checkProductTitle) {
    			const checkProductLink = await checkExistElement(page, productLink);
        		if (checkProductLink) {
        			let checkNextPage = 0;
        			// nếu là 1 trang duy nhất thì bỏ qua check next page
        			if (typePageLoad == gl_PageLoad.one_page)
        			{
        				checkNextPage = 1;
        			} else {
        				let dataPageLoad = {
	        				'typePageLoad' : typePageLoad,
	        				'btnNext' : btnNext,
	        				'signalLastButtonNoClass' : signalLastButtonNoClass,
	        				'signalAttribute' : signalAttribute,
	        				'signalClassLastButton' : signalClassLastButton,
	        				'url_end' : url_end
	        			};
	        			const result_checkNextPage = await checkExistNextPage(page, dataPageLoad);	
	        			checkNextPage = result_checkNextPage.result;
	        			message = result_checkNextPage.message;
        			}
        			if (checkNextPage)
        			{
        				result = 1;
        			}
        		} else {
        			message += 'Biến thứ 5 : " productLink" không thể tìm thấy biến này. Mời bạn kiểm tra lại';
        		}
    		} else {
    			message += 'Biến thứ 4 : " checkProductTitle" không thể tìm thấy biến này. Mời bạn kiểm tra lại';
    		}
    	} else {
    		message += 'Biến thứ 3 : " checkProductItem" không thể tìm thấy biến này. Mời bạn kiểm tra lại';
    	}
    } else {
    	message += 'Biến thứ 2 : " waitSelector" không thể tìm thấy biến này. Mời bạn kiểm tra lại';
    }

    // nếu toàn bộ trang catalog product verify thành công. Chuyển sang verify product page
    let link_product = null;
    if (result == 1)
    {
    	// lấy 1 link product đầu tiên để check
    	link_product = await page.evaluate((productItem, productLink, https_origin) => {
			let item = document.querySelector(productItem);
			const linkElement = item.querySelector(productLink);
			const croppedLink = linkElement ? linkElement.getAttribute('href') : null;
            const link = croppedLink ? https_origin+croppedLink : null;
            return link;
		}, productItem, productLink, https_origin);
    }
    const results = {
    	'result' : result,
    	'message' : message,
    	'link_product' : link_product
    };
    return results;
}

async function checkExistElement(page, element) {
	let results = false;
	if (element == '')
	{
		results = true;
	} else {
		try {
			results = await page.evaluate((element) => {
						  	let el = document.querySelector(element)
						  	return el ? true : false
						}, element);
		} catch (e) {
			results = false;
		}
	}
	return results;
}

// Gộp next page kiểu cuộn và nút bấm vào chung 1 hàm check. Trả về true hoặc false
async function checkExistNextPage(page, data) {
	let result = false;
	let message = '';
	// console.log(JSON.stringify(data, 0, 2));
	const typePageLoad = data.typePageLoad;
	// Page has type button next
	if (typePageLoad == gl_PageLoad.button) {
		const tmp_result = await checkButtonNext(page, data);
		result = tmp_result.result;
		message = tmp_result.message;
	} else { // page has type scroll 
		result = true;
		message = 'Toàn bộ thông tin khai báo đều đúng. Hệ thống sẽ lưu lại và scrap product sớm.';
	}
	const results = {
		'result' : result,
		'message' : message
	};
	return results;
}

async function checkButtonNext(page, config, link_product)
{
	let result = false;
	let message = 'Kiểm tra Dữ liệu ngoài Category => ';
	//config data
	const btnNext = config.btnNext;
	const signalLastButtonNoClass = config.signalLastButtonNoClass;
	const signalAttribute = config.signalAttribute;
	const signalClassLastButton = config.signalClassLastButton;
	const url_end = config.url_end;

	// kiểm tra xem tồn tại button next không
	const lastPageExist = await page.evaluate( (btnNext) => {
		let result = false;
		try {
			const checkExist = document.querySelector(btnNext);
			const el = document.querySelector(btnNext).clientHeight;
			result = (checkExist && el != 0) ? true : false;
		} catch (e) {
			result = false;
		}
		return result;
	},btnNext);
	// nếu tồn tại button next => tiếp tục click next trang
	if (lastPageExist) {
		let checkParentButton = false;
		try {
			// chuyển toàn bộ ký tự class của page vào thành chuỗi của mảng. Nút next sẽ là phần tử cuối cùng trong mảng
			const array = await page.evaluate((signalLastButtonNoClass, signalAttribute) => 
			  	Array.from (
			  		document.querySelectorAll(signalLastButtonNoClass)).map(d => d.getAttribute(signalAttribute)
			  		), signalLastButtonNoClass, signalAttribute
			);
			if (array.length > 0)
			{
				checkParentButton = true;
			} else {
				message += 'Biến thứ 8 và 9 : "signalLastButtonNoClass" & "signalAttribute" không hợp lệ. Mời bạn kiểm tra lại';
			}
		} catch (e) {
			message += 'Biến thứ 8 và 9 : "signalLastButtonNoClass" & "signalAttribute" không thể tìm thấy biến này. Mời bạn kiểm tra lại';
		}
		// nếu tồn tại nút bấm thì thử bấm nút
		if (checkParentButton)
		{
			let check_url = false;
			try {
				// Nếu partent Button ok. Chuyển đến trang cuối cùng
				await page.goto(url_end, { waitUntil: 'networkidle2' });
				check_url = true;
			} catch (e) {
				message += 'Biến thứ 11 : "url_end" không thể truy cập đường link này. Mời bạn kiểm tra lại';
			}
			
			if (check_url)
			{
				await page.waitForTimeout(1000);
				// chuyển toàn bộ ký tự class của page vào thành chuỗi của mảng. Nút next sẽ là phần tử cuối cùng trong mảng
				const array = await page.evaluate((signalLastButtonNoClass, signalAttribute) => 
				  	Array.from (
				  		document.querySelectorAll(signalLastButtonNoClass)).map(d => d.getAttribute(signalAttribute)
				  		), signalLastButtonNoClass, signalAttribute
				);

				// lấy nút cuối cùng trong mảng ra để so sánh
				const lastItem = array[array.length - 1];
				// nếu tồn tại ký hiệu trang cuối cùng
				if ( lastItem.indexOf(signalClassLastButton) !== -1) {
					result = true;
					message = 'Toàn bộ thông tin khai báo đều đúng. Hệ thống sẽ lưu lại và scrap product sớm. Nhớ để ý thông báo nhé.';
				} else {
					message += 'Biến thứ 10 : "signalClassLastButton" không thể tìm thấy biến này. Mời bạn kiểm tra lại';
				}
			}
		}
		
	} else { // nếu không tồn tại button next => trang cuối cùng 
		message += 'Biến thứ 7 : " btnNext" không thể tìm thấy biến này. Mời bạn kiểm tra lại';
	}
	const results = {
		'result' : result,
		'message' : message
	};
	return results;
}

async function verifyProductPage(page, dataProduct, link_product) {
	let result = 0;
	let message = 'Kiểm tra Dữ liệu Trang Sản Phẩm => ';

	if (link_product != null) {
		//config data
		const productTitle = dataProduct.productTitle;
		const imageSelector = dataProduct.imageSelector;
		const imageAttribute = dataProduct.imageAttribute;
		
		//goto url
		await page.goto(link_product, { waitUntil: 'networkidle2' });
	    await page.waitForTimeout(2000);

		// begin check
		const checkProductTitle = await checkExistElement(page, productTitle);
		if (checkProductTitle) {
			// lấy 1 link product đầu tiên để check
	    	const checkImageSrc = await page.evaluate((imageSelector, imageAttribute) => {
				let imgElement = document.querySelector(imageSelector);
				const img = imgElement ? imgElement.getAttribute(imageAttribute) : null;
	            const result = img ? true : false;
	            return result;
			}, imageSelector, imageAttribute);

			if (checkImageSrc)
			{
				result = 1;
				message = 'Toàn bộ thông tin khai báo đều đúng. Hệ thống sẽ lưu lại và scrap product sớm. Nhớ để ý thông báo.';
			} else {
				message += 'Biến thứ 2 + 3: "imageSelector +  imageAttribute" không thể tìm thấy biến này. Mời bạn kiểm tra lại';
			}
		} else {
			message += 'Biến thứ 1 : " checkProductTitle" không thể tìm thấy biến này. Mời bạn kiểm tra lại';
		}
	} else {
		message = 'Không thể truy cập được trang Product để kiểm tra Product Source. Mời bạn thử lại biến Product Category';
	}
	
	const results = {
		"result" : result,
		"message" : message
	};
	return results;
}

module.exports = verifyData;


