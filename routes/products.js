const {Product}=require('../models/product')
const express=require('express');
const { Category } = require('../models/category');
const { json } = require('body-parser');
const router=express.Router();
const mongoose=require("mongoose")
const multer=require('multer')

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
      const isValid = FILE_TYPE_MAP[file.mimetype];

      let uploadError= new Error('invalid image type')

      if(isValid){
          uploadError =null
      }
    cb(uploadError, "public/uploads");
  },
  filename: function (req, file, cb) {
      
    const filename=file.originalname.split(' ').join('-');
    const extension=FILE_TYPE_MAP[file.mimetype]
    cb(null, `${filename}-${Date.now()}.${extension}`);
  },
});

var uploadOptions = multer({ storage: storage });

//list of products
// router.get("/", async (req, res) => {
//   const productList = await Product.find();

//   if (!productList) {
//     res.status(500).json({
//       success: false,
//     });
//   }
//   res.send(productList);
// });

//getting product by id
// router.get("/:id",async(req,res)=>{
//     const product= await Product.findById(req.params.id)

//     if(!product)
//     return res.status(400).send("product not found")

//     res.send(product)
// })

//getting specific details of products

// router.get("/",async(req,res)=>{
//     const productDetailsSpecific=await Product.find().select('name image -_id')//-_id remove id from postman

//     if(!productDetailsSpecific)
//     return res.status(400).send("specic details of product not found")

//     res.send(productDetailsSpecific)
// })

//getting specific details of products along with category

router.get("/", async (req, res) => {
  const productDetailsSpecific = await Product.find()
    // .select("name image countInStock price brand -_id")
    .populate("category"); 

  if (!productDetailsSpecific)
    return res.status(400).send("specic details of product not found");

  res.send(productDetailsSpecific);
});


//creating product
router.post('/',uploadOptions.single('image'), async(req,res)=>{
    const category=await Category.findById(req.body.category);
    if(!category)
    return res.status(400).send("No Image Selected")

    const file=req.file
      if (!file) return res.status(400).send(" invalid file");

    const filename=req.file.filename
     
    const basePath=`${req.protocol}://${req.get('host')}/public/uploads/`;

   let product = new Product({
     name: req.body.name,
     description: req.body.description,
     richDescription: req.body.richDescription,
     image: `${basePath}${filename}`,
     brand: req.body.brand,
     price: req.body.price,
     category: req.body.category,
     countInStock: req.body.countInStock,
     rating: req.body.rating,
     numReviews: req.body.numReviews,
     isFeatured: req.body.isFeatured,
   });

    product =await product.save();

   if(!product)
   return res.status(500).send("the product cannot be created")

   res.send(product);
})

//getting product details as well as category details by id  //2nd

router.get("/:id",async(req,res)=>{
    const product=await Product.findById(req.params.id).populate("category")

    if(!product)
    return res.status(400).send("product and category details not found")

    res.send(product)
})

//getting product and category details of all products

//  router.get("/", async (req, res) => {
//   const productList = await Product.find().populate("category");

//   if (!productList) {
//     res.status(500).json({
//       success: false,
//     });
//   }
//   res.send(productList);
// })


//updating a product

router.put("/:id", uploadOptions.single("image"), async (req, res) => {
  //chscking the validity of id
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).send("invalid product id");
  }

  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send("invalid category");

 const product=await Product.findById(req.params.id);
 if(!product) return res.status(400).send('invalid product')

 const file=req.file;

 let imagepath;

 if(file){
     const fileName=file.filename
     const basePath=`${req.protocol}://${req.get('host')}/public/uploads/`;

     imagepath=`${basePath}${fileName}`
 }
 else{
     imagepath=product.image
 }

  const  updatedproduct = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: imagepath,
      brand: req.body.brand,
      price: req.body.price,
      category: req.body.category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    },
    { new: true }
  );

  if (!updatedproduct) return res.status(500).send("products failed to update");

  res.send(updatedproduct);
});

//deleting the products  //3rd
router.delete("/:id",async(req,res)=>{
    const product = await Product.findByIdAndDelete(req.params.id).then(product=>{
        if(product){
            return res.status(200).json({
                success:true,
                message:'product is deleted'
            })
        }
        else{
            return res.status(404).json({
                success:false,
                message:"product not found"
            })
        }
    }).catch(err=>{
        return res.status(500).json({
            success:false,
            error:err
        })
    })
})


//getting product count  //4th
router.get("/get/count",async(req,res)=>{
    const productCount=await Product.countDocuments((count)=>count)

    if(!productCount){
        return res.status(500).json({
            success:false
        })
    }

    res.send({
      productCount:productCount
    });
})

//featured products

// router.get("/get/featured",async(req,res)=>{
//     const featuredProduct=await Product.find({isFeatured:true})

//     if(!featuredProduct)
//     return res.status(400).json({success:true})

//     res.send(featuredProduct)
// })

//limitig the featured products  5th
router.get("/get/featured/:count", async (req, res) => {
    const count=req.params.count ? req.params.count :0
  const featuredProduct = await Product.find({ isFeatured: true }).limit(+count);

  if (!featuredProduct) return res.status(400).json({ success: true });

  res.send(featuredProduct);
});

//filtering by categories     // 1st
router.get("/",async(req,res)=>{
    let filter={}
    if(req.query.categories){
        filter={category:req.query.categories.split(',')}
    }
    const productList=await Product.find(filter).populate("category")

    if (!productList) {
      res.status(500).json({
        success: false,
      });
    }
    res.send(productList);
})



//uploading gallery image

router.put('/gallery-images/:id', uploadOptions.array('images',10), 
async(req,res)=>{
     if (!mongoose.isValidObjectId(req.params.id)) {
       res.status(400).send("invalid product id");
     }

     const files=req.files
     let imagesPath = [];
      const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
       
     if(files){
         files.map(
             file=>{
                 imagesPath.push(`${basePath}${file.filename}`);
             }
         )

     }
     const product=await Product.findByIdAndUpdate(
         req.params.id,
         {
             images:imagesPath
         },
         {new:true}
     )
     if(!product)
     return res.status(500).send('product cannot be updated')

     res.send(product)


})
module.exports=router;