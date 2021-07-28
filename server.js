// Node js framework dependencies
// -------------------------------------------------------------------------------------------------------
const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const port = 3000;
// -------------------------------------------------------------------------------------------------------

// Global define param
// -------------------------------------------------------------------------------------------------------
// Định nghĩa biến toàn cục ở đây
app.use(function(req, res, next) {
    var url = 'http://tai.test/api';
    global.headerVerify = {
        'key': 'vp6',
        'value': 'TFqe6sdLoywJQ1uZZOw2'
    };
    global.gl_PageLoad = {
        'button': 1, // kiểu page load nút bấm để next trang
        'scroll': 2, // kiểu page load cuộn chuộn để next trang
        'one_page' : 3 // chỉ có 1 trang thoi
    };
    global.gl_scrapData = {
        'scrap_product_data_url': url+"/list-product", // Url client để verify toàn bộ data trước khi cào
        'send_scrap_data_url': url+'/list-product', // Url client để lưu toàn bộ data về database
        'send_product_data_url': url+'/get-product-data', // Url client để lưu toàn bộ data về database 
    };
    next();
});
// -------------------------------------------------------------------------------------------------------

// Routes
// -------------------------------------------------------------------------------------------------------
const searchGoogle = require('./searchGoogle');
const preData = require('./process_data');
const verifyData = require('./verify_data_scrap');
const getProductData = require('./get_product_data');
// -------------------------------------------------------------------------------------------------------

// View & templating engine setup
// -------------------------------------------------------------------------------------------------------
//Catches requests made to localhost:3000/
app.get('/', (req, res) => res.send('Hello World!'));

// app.get('/xin-chao-2', (req, res) => res.send('Hello World!'));

// verify toàn bộ data crawl trước khi đồng ý scrap web
app.post('/verify-data-scrap', express.json({
    type: '*/*'
}), (req, res) => {
    if (req.headers.hasOwnProperty(headerVerify.key) && req.headers.vp6 == headerVerify.value) {
        let body = req.body;
        // console.log(JSON.stringify(req.body, 0, 2));
        verifyData(body)
            .then(results => {
                console.log(results);
                res.end(JSON.stringify(results));
            }).catch(function(err) {
                var results = err;
                console.log(err)
                res.end(JSON.stringify(results));
            });
        // res.end(JSON.stringify(body));
    } else {
        var result = {
            status: 'Error',
            result: 0,
            message: 'Phát hiện ra có người ngoài muốn hack vào hệ thống. Bật chế độ bảo mật cao.'
        };
        res.json(result);
    }
});

// Gửi toàn bộ data 
app.post('/post-data-scrap', express.json({
    type: '*/*'
}), (req, res) => {
    if (req.headers.hasOwnProperty(headerVerify.key) && req.headers.vp6 == headerVerify.value) {
        console.log('Nhận được data để scrap web.');
        let body = req.body;
        // console.log(JSON.stringify(req.body, 0, 2));
        var response = {
            status: 200,
            result: 1,
            message: 'Updated Successfully',
            web_scrap_id : req.headers.web_scrap_id
        }
        // echo json
        res.end(JSON.stringify(response));

        searchGoogle(body)
            .then(results => {
                const data = {
                    'vp6' : headerVerify.value,
                    web_scrap_id : req.headers.web_scrap_id,
                    'data' : results
                };
                getData(data);
            }).catch(function(err) {
                var results = err;
                res.end(JSON.stringify(results));
            });

    } else {
        var result = {
            status: 'Error',
            result: 0,
            message: 'Phát hiện ra có người ngoài muốn hack vào hệ thống. Bật chế độ bảo mật cao.'
        };
        res.json(result);
    }
});

/* Gửi data pre scrap về cho client*/
app.post('/get-list-product', express.json({
    type: '*/*'
}), (req, res) => {
    if (req.headers.hasOwnProperty(headerVerify.key) && req.headers.vp6 == headerVerify.value) {
        let body = req.body;
        var response = {
            status: 200,
            result: 1,
            message: 'Updated Successfully'
        }
        // echo json
        res.end(JSON.stringify(response));
        preData(req.body).then(results => {
            sendData(results);
        }).catch(function(err) {
                var results = err;
                res.end(JSON.stringify(results));
            });
    } else {
        var result = {
            status: 'Error',
            result: 0,
            message: 'Phát hiện ra có người ngoài muốn hack vào hệ thống. Bật chế độ bảo mật cao.'
        };
        response.json(result);
    }
});

// nhận data product để scrap, xong thì gửi lại về client
app.post('/post-data-product', express.json({ type: '*/*' }), (req, res) => {
    if (req.headers.hasOwnProperty(headerVerify.key) && req.headers.vp6 == headerVerify.value) {
        console.log('Nhận được data để scrap product.');
        let body = req.body;
        // console.log(JSON.stringify(body, 0, 2));
        var response = {
            status: 200,
            result: 1,
            message: 'Updated Successfully',
            data : body
        }
        // echo json
        res.end(JSON.stringify(response));

        getProductData(body)
            .then(results => {
                const data = {
                    'vp6' : headerVerify.value,
                    'data' : results
                };
                sendProductData(data);
            }).catch(function(err) {
                var results = err;
                res.end(JSON.stringify(results));
            });

    } else {
        console.log('Không đúng API key');
        var result = {
            status: 'error',
            result: 0,
            message: 'Phát hiện ra có người ngoài muốn hack vào hệ thống. Bật chế độ bảo mật cao.'
        };
        res.end(JSON.stringify(result));
        // res.json(result);
    }
});

// gửi toàn bộ danh sách product cào được về client để lưu vào data base
function getData(data) {
    let url = gl_scrapData.send_scrap_data_url;
    const postData = require('./postData');
    postData(data, url);

    console.log('Day la ham nhan data sau khi chạy xong toàn bộ: ');
    console.log('Done');
}

// gửi dữ liệu cào được về cho tool
function sendData(data) {
    let url = gl_scrapData.scrap_product_data_url;
    const postData = require('./postData');
    postData(data, url);
}

// gửi dữ liệu product về cho client
function sendProductData(data){
    let url = gl_scrapData.send_product_data_url;
    const postData = require('./postData');
    postData(data, url);
}

//Initialises the express server on the port 30000
app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// -------------------------------------------------------------------------------------------------------