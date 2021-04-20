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
	data_map.set('url', 'https://vetz3d.com/shop')
	data_map.set('waitSelector','div.ShopPage');
	data_map.set('productItem','div.ShopPage div.ProductItem');
	data_map.set('productTitle', 'div.BottomProduct > div.Title');
	data_map.set('productLink', 'a');
	data_map.set('https_origin', 'https://vetz3d.com')
    	
  	//Do something when the searchQuery is not null.
  	if(searchQuery != null){
  		searchGoogle(data_map)
            .then(results => {
                //Returns a 200 Status OK with Results JSON back to the client.
                response.status(200);
                response.json(results);
            });
  	}else{
    	response.end();
  	}
});

//Catches requests made to localhost:3000/
app.get('/', (req, res) => res.send('Hello World!'));


//Initialises the express server on the port 30000
app.listen(port, () => console.log(`Example app listening on port ${port}!`));