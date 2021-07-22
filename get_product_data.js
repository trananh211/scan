const fs = require('fs');
const puppeteer = require('puppeteer');

function main(preData) {
    return new Promise(async (resolve, reject) => {
        let results = {};
        let message = '';
		try {
            let products = []
            const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox'] });
	        const page = await browser.newPage();
	        page.setViewport({width: 1280, height: 720});

            // lặp toàn bộ data từ client để truy cập vào từng trang product
            for (let item of preData)
            {   
                let url = item.product_link;
                console.log('Đang scrap product link : '+ url);
                await page.goto(url, { waitUntil: 'networkidle2' });
                await page.waitForTimeout(1000);
                let data = await getDataProduct(page, item);
                products.push(data);
            }
            console.log('Đã duyệt xong toàn bộ product link. Đóng trình duyệt.');
            await browser.close();
            results = {
	        	'result' : 1,
	        	'message' : message,
	        	'data' : products
	        };
        	return resolve(results);
		} catch (e) {
            results = {
	        	'result' : 0,
	        	'message' : 'Xảy ra lỗi ngoài ý muốn.'
	        };
        	return reject(results);
        }
	})
}

// hàm lấy chi tiết title và ảnh sản phẩm
async function getDataProduct(page, data)
{
    let product_source = (data.product_source) ? JSON.parse(data.product_source) : null;
    
    let results = {};
    let res = false;
    if (product_source != null)
    {
        let productTitle = product_source.productTitle;
        let imageSelector = product_source.imageSelector;
        let imageAttribute = product_source.imageAttribute;
		let https_origin = product_source.https_origin;
        // lấy title 
        const title = await page.evaluate( (productTitle) => {
            let result = null;
            try {
                const titleElement = document.querySelector(productTitle);
                result = titleElement ? titleElement.innerText.trim() : null;
            } catch (e) {
                result = null;
            }
            return result;
        }, productTitle);

        // lấy ảnh
        let images = await page.evaluate((imageSelector, imageAttribute, https_origin) => {
            let result = [];
                try {
                    let items = document.querySelectorAll(imageSelector);
                    items.forEach((item) => {
                        const imgElement = item ? item.getAttribute(imageAttribute) : null;
                        const img = imgElement ? https_origin+imgElement : null;
                        
                        //Add to the return Array
                        if (img != null) {
                            result.push(img);
                        }
                    });
                } catch(e) {
                    result = [];
                }
            return result;
        }, imageSelector, imageAttribute, https_origin);

        // Add to the return Array
        results = {title, images};
        if (title != null && images.length > 0) {
            res = true;
        }
    } else {
        console.log('aaa');
    }

    // gắn lại vào đuôi của data cũ
    data.result = res;
    data.data = results;

    return data;
}

module.exports = main;


