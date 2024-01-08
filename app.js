const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');

const Message = require(__dirname + '/Message.js');
const User = require(__dirname + '/User.js');
const Book = require(__dirname + '/User.js').book;

async function run(){
    try{

        const books = await Book.find({});

        const user = new User({name: 'John', email: 'test@example.com', password: 'test', books: books});

        await user.save();
        
    }
    catch(err){
        console.log(err);
    }
}

run();

app.use(express.static('public'));

app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs');

mongoose.connect("mongodb+srv://admin:admin@cluster0.vyaefh3.mongodb.net/libraryDB");

app.route('/').get((req, res) => {
    res.render('index');
});

app.route("/login").get((req, res) => {
    res.render("sign-in");
}).post(async (req, res) => {
    try{
        const user = await User.findOne({email: req.body.email, password: req.body.password});

        if(user !== null){
            console.log("Exists!");
            res.redirect("/");
        }
        else{
            console.log("Not found!");
            res.redirect("/login");
        }
    }
    catch(err)
    {
        console.log(err.message);
        res.redirect("/");
    }
});

app.route("/register").get((req, res) => {
    res.render("register");
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});