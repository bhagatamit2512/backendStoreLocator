const express=require("express");
const app=express();
const morgan=require("morgan");
const mongoose=require("mongoose");
const cors=require('cors');
require("dotenv/config");
const authJwt=require('./helpers/jwt');
const errorHandler=require('./helpers/error-handler')
const port=process.env.PORT || 3000

app.use(cors());
app.options('*',cors())

//middleware
app.use(express.json());
app.use('/public/uploads',express.static(__dirname + '/public/uploads'))
app.use(morgan("tiny"));
app.use(authJwt());
app.use(errorHandler)


//routes
const categoriesRoutes=require("./routes/categories");
const productRoutes=require("./routes/products");
const orderRoutes=require("./routes/orders");
const userRoutes=require("./routes/users");


const api = process.env.API_URL;

app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/products`,productRoutes);
app.use(`${api}/users`, userRoutes);
app.use(`${api}/orders`, orderRoutes);


//database connection
mongoose.connect(
    process.env.CONNECTION_STRING,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false 
    }
  )
  .then(() => {
    console.log("DB Connected");
  }).catch((err)=>{
      console.log(err);
  })



app.listen(3000,()=>{
    console.log(`app is running at ${port}`)
})