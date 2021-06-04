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
    global.headerVerify = {
        'key': 'vp6',
        'value': '12345'
    };
    global.gl_PageLoad = {
        'button': 1, // kiểu page load nút bấm để next trang
        'scroll': 2, // kiểu page load cuộn chuộn để next trang
        'one_page' : 3 // chỉ có 1 trangtoi
    };
    global.gl_scrapData = {
        'scrap_product_data_url': "http://tai.test/api/list-product", // Url client để verify toàn bộ data trước khi cào
        'send_scrap_data_url': 'http://tai.test/api/list-product' // Url client để lưu toàn bộ data về database 
    };
    next();
});
// -------------------------------------------------------------------------------------------------------

// Routes
// -------------------------------------------------------------------------------------------------------
const searchGoogle = require('./searchGoogle');
const preData = require('./process_data');
const verifyData = require('./verify_data_scrap');
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
        // console.log(JSON.stringify(req.body, 0, 2));
        let body = req.body;
        verifyData(body)
            .then(results => {
                console.log(results);
                res.end(JSON.stringify(results));
            });

    } else {
        res.status(404);
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
        console.log(JSON.stringify(req.body));
        let body = req.body;
        var response = {
            status: 200,
            result: 1,
            message: 'Updated Successfully'
        }
        // echo json
        res.end(JSON.stringify(response));

        searchGoogle(body)
            .then(results => {
                getData(results);
            });

    } else {
        res.status(404);
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
        });
    } else {
        res.status(404);
        var result = {
            status: 'Error',
            result: 0,
            message: 'Phát hiện ra có người ngoài muốn hack vào hệ thống. Bật chế độ bảo mật cao.'
        };
        response.json(result);
    }
});

// gửi toàn bộ danh sách product cào được về client để lưu vào data base
function getData(data) {
    let url = gl_scrapData.send_scrap_data_url;
    const postData = require('./postData');
    postData(data, url);

    console.log('Day la ham nhan data sau khi chạy xong: ');
    console.log('Done');
}

// gửi dữ liệu cào được về cho tool
function sendData(data) {
    let url = gl_scrapData.scrap_product_data_url;
    console.log(JSON.stringify(data));
    const postData = require('./postData');
    postData(data, url);

    console.log('Day la ham send data sau khi chạy xong: ');
    console.log('Done');
}

//Initialises the express server on the port 30000
app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// -------------------------------------------------------------------------------------------------------