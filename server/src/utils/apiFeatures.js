class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
    this.filterQuery = {}; // 🔥 سنخزن هنا الفلتر النهائي بعد التعديل لاستخدامه في الـ Count
  }

  filter() {
    const queryObj = this._normalizeQueryOperators({ ...this.queryString });

    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // دعم البحث الجزئي بالاسم
    if (queryObj.name) {
      queryObj.name = { $regex: queryObj.name, $options: "i" };
    }

    let queryStr = JSON.stringify(queryObj);

    // تحويل gte إلى $gte
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    const parsedQuery = JSON.parse(queryStr);

    this._castStringsToNumbers(parsedQuery);

    this.filterQuery = parsedQuery; // 🔥 حفظ كائن الفلترة الصحيح 100% هنا
    this.query = this.query.find(parsedQuery);

    return this;
  }

  // دالة داخلية تقوم بالفحص والتحويل التلقائي للأرقام حتى لو كانت متداخلة (Nested Objects)
  _castStringsToNumbers(obj) {
    for (const key in obj) {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        this._castStringsToNumbers(obj[key]);
      } else if (
        typeof obj[key] === "string" &&
        !isNaN(obj[key]) &&
        obj[key].trim() !== ""
      ) {
        obj[key] = Number(obj[key]); // تحويل النص إلى رقم
      }
    }
  }

  _normalizeQueryOperators(queryObj) {
    const normalizedQuery = {};

    for (const [key, value] of Object.entries(queryObj)) {
      const operatorMatch = key.match(/^(.+)\[(gte|gt|lte|lt)\]$/);

      if (operatorMatch) {
        const [, field, operator] = operatorMatch;
        normalizedQuery[field] = {
          ...(normalizedQuery[field] || {}),
          [operator]: value,
        };
      } else {
        normalizedQuery[key] = value;
      }
    }

    return normalizedQuery;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  paginate(totalDocuments) {
    const page = parseInt(this.queryString.page) || 1;
    const limit = parseInt(this.queryString.limit) || 10;
    const skip = (page - 1) * limit;

    this.pagination = {
      currentPage: page,
      limit,
      totalPages: Math.ceil(totalDocuments / limit) || 1,
      totalDocuments,
    };

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const excludedFields = ["password", "__v"];
      const fields = this.queryString.fields
        .split(",")
        .filter((field) => !excludedFields.includes(field))
        .join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }
}

export default APIFeatures;
