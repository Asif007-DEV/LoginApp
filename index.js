const express = require('express');
const app = express();
const path = require('path');
const routes = require('./routes.js');



app.set('view engine', 'ejs');
app.set('views',path.join(__dirname, 'views'));


app.get('/',routes);
app.post('/register',routes);
app.get('/login',routes);
app.post('/login',routes);
app.get('/success',routes);
app.get('/logout',routes);
app.post('/addmsg',routes);
app.get('/addmsg',routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>console.log('Server runing on port ',PORT));