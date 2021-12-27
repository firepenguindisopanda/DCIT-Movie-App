const express = require('express')
const path = require('path')

const app = express()

//Serve only the static files from the dist directory
app.use(express.static('./dist/dcit_movie_app'))

app.get('/*', (req, res) => 
    res.send('index.html', {root: 'dist/dcit_movie_app/'}),
);

app.listen(process.env.PORT || 8080);