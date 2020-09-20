const express = require('express'),
    redis = require("redis"),
    dotenv = require('dotenv'),
    mysql = require('mysql');

const PORT = process.env.PORT || 3000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

dotenv.config();

const app = express();
const redisClient = redis.createClient(REDIS_PORT);

//mysql connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.PASS,
    database: process.env.DB
});

//function to find city from DB
const findCiti = (req, res, next) => {
    const name = req.params.name;

    const sql = `SELECT area FROM cities WHERE name = '${name}'`;
    connection.query(sql, (err, result) => {
        if (err) {
            console.log("error while getting the citi");
            throw err;
        }
        else {
            //set data to redis
            redisClient.set(name, result[0].area);
            console.log('from sql');
            res.json({
                citi: name,
                area: result[0].area
            });
        }
        //connection.end();
    });
}

//midleware
const cache = (req, res, next) => {
    const name = req.params.name;
    redisClient.get(name, (error, cachedData) => {
        if (error) {
            throw error;
        }

        if (cachedData != null) {
            console.log('from redis');
            const area = parseInt(cachedData);
            res.json({
                citi: name,
                area: area
            });
        } else {
            next();
        }
    });
}

//home route
app.get('/', (req, res) => {
    res.render('home.ejs');
});

//citi data route
app.get('/citi/:name', cache, findCiti);


// mysql connection
connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL Server!');
});


//
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});