const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const port = 3000;

const searchGoogle = require('./searchGoogle');
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

app.post('/test', express.json({type: '*/*'}), (req, res) => {
  if (req.headers.hasOwnProperty('vp6') && req.headers.vp6 == 12345  )
  {
    console.log(JSON.stringify(req.body));
    let body = req.body;
    var response = {
        status  : 200,
        success : 'Updated Successfully'
    }
    searchGoogle(body)
            .then(results => {
                getData(results);
            });
    // echo json
    res.end(JSON.stringify(response));
  } else {
    res.sendStatus(404);
  }
});

function getData(data)
{
  const postData = require('./postData');
  postData(data);
  
  console.log('Day la ham nhan data sau khi chạy xong: ');
  console.log('Done');
}

//Initialises the express server on the port 30000
app.listen(port, () => console.log(`Example app listening on port ${port}!`));