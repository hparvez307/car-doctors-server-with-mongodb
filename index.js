const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// express middle ware
app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mb5zcck.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const verifyJWT = (req, res, next) => {
  const authorized = req.headers.authorization;
  if(!authorized){
    return res.status(401).send({error: true, message: 'unauthorized access'})
  }
  const token = authorized.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if(error){
      return  res.status(401).send({error: true, message: 'unauthorized access'});
    }
    req.decoded = decoded;
    next();
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db('carDoctors').collection('services');
    const bookingCollection = client.db('carDoctors').collection('bookings');

    // jwt

    app.post('/jwt', (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      });
      res.send({token});

    })



    // SERVICE ROUT
    app.get('/services', async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {

        // Include only the `title` and `imdb` fields in the returned document
        projection: { img: 1, service_id: 1, title: 1, price: 1 },
      };

      const result = await serviceCollection.findOne(query, options);
      res.send(result);
    })


    //  bookings route

    app.get('/bookings', verifyJWT, async (req, res) => {

      const decoded = req.decoded;
      if(decoded.email !== req.query.email){
        return res.status(403).send({error: 1, message: 'forbidden access'})
      }
      console.log(req.headers.authorization)
      const email = req.query.email;
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email }
      }
      const result = await bookingCollection.find(query).toArray();
      res.send(result)
    })

    app.post('/bookings', async (req, res) => {
      const body = req.body;
      const result = await bookingCollection.insertOne(body);
      res.send(result)
    })

    // put method

    // app.put('/bookings/:id', async(req,res) => {
    //   const id = req.params.id;
    //   const filter = {_id: new ObjectId(id)};
    //   const body = req.body;
    //   const options = {upsert: true};
    //   const updateBookings = {
    //       $set: {
    //           name: body.name,
    //           _id: body._id,
    //           title: body.title,
    //           date: body.date,
    //           service: body.service,
    //           price: body.price,
    //           img: body.img
    //       }
    //   }
    //   const result = await bookingCollection.updateOne(filter,updateBookings,options);
    //   res.send(result)
    // })

    // patch method
    app.patch('/bookings/:id', async (req, res) =>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const body = req.body;
      const updateBooking = {
        $set:{
          status: body.status
        }
      }
      const result = await bookingCollection.updateOne(filter, updateBooking);
      res.send(result);

    })


    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    })





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);







app.get('/', (req, res) => {
  res.send('doctor is running');
})


app.listen(port, () => {
  console.log(`server is running on port: ${port}`);
})