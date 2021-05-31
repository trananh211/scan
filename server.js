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
app.use(function(req,res,next){
    global.headerVerify = {
      'key' : 'vp6',
      'value' : '12345'
    };
    global.gl_PageLoad = {
      'button' : 1, // kiểu page load nút bấm để next trang
      'scroll' : 2 // kiểu page load cuộn chuộn để next trang
    };
    global.gl_scrapData = {
      'verify_data_url' : "http://tai.test/api/list-product", // Url client để verify toàn bộ data trước khi cào
      'send_scrap_data_url' : 'http://tai.test/api/list-product' // Url client để lưu toàn bộ data về database 
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

//Catches requests made to localhost:3000/search
app.get('/search', (request, response) => {
  //Do something when someone makes request to localhost:3000/search
  //request parameter - information about the request coming in
 	//response parameter - response object that we can use to send a response
 	//Holds value of the query param 'searchquery'.
  const searchQuery = request.query.searchquery;

  var data_map = new Map();

  // page button
	data_map.set('url', 'https://vetz3d.com/shop');
	data_map.set('waitSelector','div.ShopPage');
	data_map.set('productItem','div.ShopPage div.ProductItem');
	data_map.set('productTitle', 'div.BottomProduct > div.Title');
	data_map.set('productLink', 'a');
	data_map.set('https_origin', 'https://vetz3d.com')
  data_map.set('btnNext', 'button.ml-2');

  /*// Scroll 
  data_map.set('url', 'https://www.stickerify.co/collections/all')
  data_map.set('waitSelector','.collection-detail .product-grid');
  data_map.set('productItem','.collection-detail .product-grid .product-col');
  data_map.set('productTitle', '.collection-detail__product-details .title');
  data_map.set('productLink', 'a');
  data_map.set('https_origin', 'https://www.stickerify.co')*/
  
  	//Do something when the searchQuery is not null.
  	if(searchQuery != null){
  		searchGoogle(data_map)
            .then(results => {
                //Returns a 200 Status OK with Results JSON back to the client.
                response.status(200);
                response.json(results);
            });
  	} else {
    	response.end();
  	}
});

//Catches requests made to localhost:3000/
app.get('/', (req, res) => res.send('Hello World!'));

// app.get('/xin-chao-2', (req, res) => res.send('Hello World!'));

/* Gửi data pre scrap về cho client*/
app.post('/get-list-product', express.json({type: '*/*'}), (req, res) => {
  if (req.headers.hasOwnProperty(headerVerify.key) && req.headers.vp6 == headerVerify.value  )
  {
    let body = req.body;
    var response = {
        status  : 200,
        result : 1,
        message : 'Updated Successfully'
    }
    // echo json
    res.end(JSON.stringify(response));
    preData(req.body).then(results => {
      sendData(results);
    });
  } else {
    res.status(404);
    var result = {
      status : 'Error',
      result : 0,
      message : 'Phát hiện ra có người ngoài muốn hack vào hệ thống. Bật chế độ bảo mật cao.'
    };
    response.json(result);
  }
});

app.post('/post-data-scrap', express.json({type: '*/*'}), (req, res) => {
  if (req.headers.hasOwnProperty(headerVerify.key) && req.headers.vp6 == headerVerify.value  )
  {
    console.log(JSON.stringify(req.body));
    let body = req.body;
    var response = {
        status  : 200,
        result : 1,
        message : 'Updated Successfully'
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
      status : 'Error',
      result : 0,
      message : 'Phát hiện ra có người ngoài muốn hack vào hệ thống. Bật chế độ bảo mật cao.'
    };
    res.json(result);
  }
});

// verify toàn bộ data crawl trước khi đồng ý scrap web
app.post('/verify-data-scrap', express.json({type: '*/*'}), (req, res) => {
  if (req.headers.hasOwnProperty(headerVerify.key) && req.headers.vp6 == headerVerify.value  )
  {
    // console.log(JSON.stringify(req.body));
    let body = req.body;
    var response = {
        status  : 200,
        result : 1,
        message : 'Updated Successfully'
    }
    // echo json
    res.end(JSON.stringify(response));

    verifyData(body)
            .then(results => {
                getData(results);
            });
    
  } else {
    res.status(404);
    var result = {
      status : 'Error',
      result : 0,
      message : 'Phát hiện ra có người ngoài muốn hack vào hệ thống. Bật chế độ bảo mật cao.'
    };
    res.json(result);
  }
});

// gửi toàn bộ danh sách product cào được về client để lưu vào data base
function getData(data)
{
  let url = gl_scrapData.send_scrap_data_url;
  const postData = require('./postData');
  postData(data, url);
  
  console.log('Day la ham nhan data sau khi chạy xong: ');
  console.log('Done');
}

// gửi dữ liệu cào được về cho tool
function sendData(data) {
  let url = gl_scrapData.verify_data_url;
  console.log(JSON.stringify(data));
  const postData = require('./postData');
  postData(data, url);
  
  console.log('Day la ham send data sau khi chạy xong: ');
  console.log('Done');
}

//Initialises the express server on the port 30000
app.listen(port, () => console.log(`Example app listening on port ${port}!`));

// -------------------------------------------------------------------------------------------------------