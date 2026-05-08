const paginate = (model) => async (req, res, next) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const total = await model.countDocuments();

    const results = await model.find()
      .skip(skip)
      .limit(limit);

    res.paginatedResults = {
      total,
      page,
      pages: Math.ceil(total / limit),
      results
    };

    next();
  } catch (err) {
    next(err);
  }
};

export default paginate;