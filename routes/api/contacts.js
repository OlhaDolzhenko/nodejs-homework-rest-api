const express = require('express');
const createError = require('http-errors');

const {Contact, schemas} = require("../../models/contact");
const { authenticate } = require("../../middlewares");
const router = express.Router()

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = (req.query);
    const skip = (page - 1) * limit;
    const { _id } = req.user;
    let query;
    if (req.query.favorite) {
      query = { owner: _id, favorite: req.query.favorite};
    } else { query = { owner: _id }}
    const result = await Contact.find(
      query, "-createdAt -updatedAt", {skip, limit: +limit}).populate("owner", "email");
      res.json(result);
  } catch (error) {
      next(error)
  }
})

router.get('/:contactId', async (req, res, next) => {
  try {
      const { contactId } = req.params;
      const result = await Contact.findById(contactId);
    if (!result) {
      throw new createError(404, "Not found");        
      }
      res.json(result);   
  } catch (error) {
    if (error.message.includes("Cast to ObjectId failed")) {
      error.status = 404;
    }
      next(error) 
  }
})

router.post('/', authenticate, async (req, res, next) => {
  try {
    const {error} = schemas.add.validate(req.body);
    if (error) {
      throw new createError(400, "missing required name field")
    }
    const data = {...req.body, owner: req.user._id}
    const result = await Contact.create(data);
    res.status(201).json(result);
  } catch (error) {
    if (error.message.includes("validation failed")) {
      error.status = 400;
    }
    next(error);
  }
})

router.delete('/:contactId', async (req, res, next) => {
  try {
      const { contactId } = req.params;
      const result = await Contact.findByIdAndDelete(contactId);
    if (!result) {
      throw new createError(404, "Not found");        
      }
      res.json(result);     
  } catch (error) {
    next(error)
  }
  res.json({ message: 'template message' })
})

router.put('/:contactId', async (req, res, next) => {
  try {
    const {error} = schemas.add.validate(req.body);
    if (error) {
      throw new createError(400, "missing fields")
    }
    const { contactId } = req.params;
    const result = await Contact.findByIdAndUpdate(contactId, req.body, {new: true});
    if(!result){
      throw new createError(404, "Not found")
    }
    res.json(result);
  } catch (error) {
    next(error)
  }
})

router.patch("/:contactId/favorite", async(req, res, next)=> {
    try {
        const {error} = schemas.updateFavorite.validate(req.body);
        if(error){
            throw new createError(400, "missing field favorite")
        }
        const { contactId } = req.params;
        const result = await Contact.findByIdAndUpdate(contactId, req.body, {new: true});
        if(!result){
            throw new createError(404, "Not found")
        }
        res.json(result);
    } catch (error) {
        next(error)
    }
})

module.exports = router
