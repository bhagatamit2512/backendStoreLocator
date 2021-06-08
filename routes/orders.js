const {Order}=require('../models/order');
const express = require("express");
const router = express.Router();
const {OrderItem} = require('../models/order-item');
const { Promise } = require('mongoose');

//list of all the order placed and name of the user placing the order and sort by date of order
router.get("/", async (req, res) => {
  const orderList = await Order.find().populate('user' ,'name').sort({'dateOrdered':-1});

  if (!orderList) {
    res.status(500).json({
      success: false,
    });
  }
  res.send(orderList);
});

//oder detail of one order 

router.get(`/:id`, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name")
    .populate({ path: "orderItems", populate: { path: "product" ,populate:'category'} });

  if (!order) {
    res.status(500).json({
      success: false,
    });
  }
  res.send(order);
});


//details of order placed
router.post('/', async(req,res)=>{
  let orderItemsIds = Promise.all(req.body.orderItems.map(async (orderItem) => {
    let newOrderItem = new OrderItem({
      quantity: orderItem.quantity,
      product: orderItem.product,
    });

    newOrderItem = await newOrderItem.save();

    return newOrderItem.id;
  }))

  const orderItemsIdsResolved=await orderItemsIds
  
  const totalPrices=await Promise.all(orderItemsIdsResolved.map(async(orderItemId)=>{
    const orderItem=await OrderItem.findById(orderItemId).populate('product','price');
    const totalPrice=orderItem.product.price * orderItem.quantity;

    return totalPrice
  }))

  const totalPrice=totalPrices.reduce((a,b)=> a+b, 0)

  let order= new Order({
    orderItems:orderItemsIdsResolved,
    shippingAddress1:req.body.shippingAddress1,
    shippingAddress2:req.body.shippingAddress2,
    city:req.body.city,
    zip:req.body.zip,
    country:req.body.country,
    phone:req.body.phone,
    status:req.body.status,
    totalPrice:totalPrice,
    user:req.body.user
  })

  order= await order.save();

  if(!order)
  return res.status(400).send('the order cannot be created')

  res.send(order);
})


//updating status of the product

router.put("/:id", async (req, res) => {
  const order= await Order.findByIdAndUpdate(
    req.params.id,
    {
      status:req.body.status
    },
    { new: true }
  );
  if (!order) return res.status(400).send("status updated");

  res.send(order);
});


//deleting the order

router.delete("/:id", (req, res) => {
 Order.findByIdAndRemove(req.params.id)
    .then(async(order) => {
      if (order) {
        await order.orderItems.map(async orderItem =>{
          await OrderItem.findByIdAndRemove(orderItem)
        })
        return res.status(200).json({
          success: true,
          message: "order is deleted",
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "order not found",
        });
      }
    })
    .catch((err) => {
      return res.status(400).json({
        success: false,
        error: err,
      });
    });
});

//get sum of totalSales
router.get('/get/totalsales', async(req,res)=>{
  const totalSales = await Order.aggregate([
    {$match:{status:"confirmed" }},
    {$group:{_id:null, totalsales:{$sum:'$totalPrice'}}}
  ])

  if(!totalSales){
     return res.status(400).send('the order sales cannot be genrated ')
  }

  res.send({totalsales:totalSales.pop()})
})

//count of product sales

router.get("/get/count", async (req, res) => {
  const orderCount = await Order.countDocuments((count) => count);

  if (!orderCount) {
    return res.status(500).json({
      success: false,
    });
  }

  res.send({
    orderCount: orderCount,
  });
});


//order history of the user

router.get("/get/userorders/:userid", async (req, res) => {
  const userOrderList = await Order.find({ user: req.params.userid })
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    })
    .sort({ dateOrdered: -1 });

  if (!userOrderList) {
    res.status(500).json({
      success: false,
    });
  }
  res.send(userOrderList);
});

module.exports = router;
