import express from "express"
import path from 'path'
import cookieParser from "cookie-parser";
import mongoose, { Mongoose } from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const app = express();

// database n stuff //

mongoose.connect('mongodb://127.0.0.1:27017', {dbName: 'backend'}).then((e) => {
        console.log('connected to mongodb')
    }).catch((err) => {
    console.log(err)
})

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
})


const User = mongoose.model('user', userSchema)

// middleswares //

app.use(express.static(path.join(path.resolve(), 'public')))
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())

app.set('view engine', 'ejs')

const isAuthenticated = async (req, res, next) => {
    const {token} = req.cookies                                 // checking if login cookies exist
    
    if (token){

        const decoded = jwt.verify(token, 'fiopefnofgnger')     // jwt.verify(A, B) returns decoded version of encoded token 'A' with secret key 'B'

        req.user = await User.findById(decoded._id)             // we are saving the information of user from our db using the findById method of mongoose model

        next()
    } else {
        res.redirect('/login')
    }
}


// request handling //

// GET requests

app.get('/', isAuthenticated, (req, res) => {
    res.render('logout', {name: req.user.name})
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/register', (req, res) => {
    res.render('register')
})

// POST requests

app.post('/register', async (req, res) => {
    const {name, email, password} = req.body 

    let user = await User.findOne({email})
    if (user) {
        return res.render('login', {message: 'The email is already registered.\nTry to log in instead', email})
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    
    user = await User.create({
        name,
        email,
        password: hashedPassword
    })
    
    const token = jwt.sign({_id:user._id}, 'fiopefnofgnger') // here jwt.sign(A, B) is used to endcode information 'A' with secret key 'B'
    // console.log(token)

    res.cookie('token', token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60*(60*1000)) // stay loged in for 1 hour
    })
    res.redirect('/')
})

app.post('/login', async (req, res) => {

    const {email, password} = req.body

    let user = await User.findOne({email})

    if(!user) return res.redirect('/register')
    
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        return res.render('login', {message: 'Incorrect email or password!'})
    }

    const token = jwt.sign({_id:user._id}, 'fiopefnofgnger') // here jwt.sign(A, B) is used to endcode information 'A' with secret key 'B'
    console.log(token)

    res.cookie('token', token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60*(60*1000)) // stay loged in for 1 hour
    })
    res.redirect('/')
 
})

app.get('/logout', (req, res) => {
    res.cookie('token', null, {
        httpOnly: true,
        expires: new Date(Date.now())
    })
    res.redirect('/')
})


// port setting //

app.listen(5000, () => {
    console.log('server is working on port 5000')
})